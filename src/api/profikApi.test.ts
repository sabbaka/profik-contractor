import { configureStore } from "@reduxjs/toolkit";
import i18n, { changeLanguage } from "i18next";
import { profikApi } from "./profikApi";
import authReducer, { setToken } from "@/src/store/authSlice";

/**
 * The transport layer, exercised through a real store rather than by exporting
 * its internals: `baseQueryWithReauth` and `prepareHeaders` are private to the
 * module, and what matters is what a dispatched request actually does.
 *
 * Mirrors the client app's suite. The one behavioural difference between the
 * two is where `hasToken` is read — after the request here, before it there —
 * which only shows under a logout racing an in-flight request, and neither app
 * has a case that does that.
 */

const stores: ReturnType<typeof configureStore>[] = [];

const makeStore = () => {
  const store = configureStore({
    reducer: { auth: authReducer, [profikApi.reducerPath]: profikApi.reducer },
    middleware: (getDefault) => getDefault().concat(profikApi.middleware),
  });
  stores.push(store);
  return store;
};

/**
 * RTK Query schedules cache removal on a real timer (keepUnusedDataFor, 60s by
 * default). Those outlive the test file, and jest then reports each one as "the
 * environment has been torn down" — noise that buries a real failure. Faking
 * timers here means they are queued and discarded rather than fired; promises
 * still settle on the microtask queue, which is all these tests await.
 */
beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask"] });
});

afterEach(() => {
  for (const store of stores.splice(0)) {
    store.dispatch(profikApi.util.resetApiState());
  }
  jest.useRealTimers();
});

type Store = ReturnType<typeof makeStore>;

/**
 * Dispatch an endpoint and drop the subscription it opened.
 *
 * An `initiate()` left subscribed keeps a keepUnusedDataFor timer alive past
 * the end of the test, and jest then reports every one of them as "the
 * environment has been torn down" — noise that buries a real failure.
 */
const run = async <T extends { unwrap: unknown }>(
  store: Store,
  thunk: unknown,
) => {
  const promise = store.dispatch(thunk as never) as unknown as Promise<T> & {
    unsubscribe?: () => void;
  };
  const result = await promise;
  promise.unsubscribe?.();
  return result;
};

const respond = (status: number, body: unknown = {}) =>
  jest.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = respond(200);
  global.fetch = fetchMock as unknown as typeof fetch;
});

const lastRequestHeaders = () => {
  const request = fetchMock.mock.calls[0][0] as Request;
  return request.headers;
};

describe("prepareHeaders", () => {
  it("attaches the bearer token when one is held", async () => {
    const store = makeStore();
    store.dispatch(setToken("tok-123"));

    await run(store, profikApi.endpoints.me.initiate());

    expect(lastRequestHeaders().get("Authorization")).toBe("Bearer tok-123");
  });

  it("sends no Authorization header for a guest", async () => {
    const store = makeStore();

    await run(store, profikApi.endpoints.me.initiate());

    expect(lastRequestHeaders().get("Authorization")).toBeNull();
  });

  // The server needs this for the one thing it sends before an account exists:
  // the SMS carrying the sign-in code. So it cannot depend on being signed in.
  it("always states the language, signed in or not", async () => {
    const store = makeStore();
    await changeLanguage("cs");

    await run(store, profikApi.endpoints.me.initiate());

    expect(lastRequestHeaders().get("Accept-Language")).toBe(i18n.language);
  });
});

describe("baseQueryWithReauth", () => {
  const tokenAfter = (store: Store) => store.getState().auth.token;

  it("signs the user out when a held token is rejected", async () => {
    const store = makeStore();
    store.dispatch(setToken("expired"));
    global.fetch = respond(401) as unknown as typeof fetch;

    await run(store, profikApi.endpoints.me.initiate());

    expect(tokenAfter(store)).toBeNull();
  });

  /**
   * Signing in is itself a 401 away — a mistyped SMS code answers 401. Reacting
   * to that resets the cache and aborts the in-flight request, so the caller
   * sees an abort instead of the real status and cannot tell the user what
   * actually went wrong.
   */
  it("leaves a guest alone on a 401, so a wrong SMS code stays readable", async () => {
    const store = makeStore();
    global.fetch = respond(401, {
      message: "Invalid code",
    }) as unknown as typeof fetch;

    const result = await run(
      store,
      profikApi.endpoints.verifyOtpCode.initiate({
        phone: "+420777123456",
        code: "000000",
        role: "contractor",
      }),
    );

    expect(tokenAfter(store)).toBeNull();
    // The real status reaches the caller rather than an abort.
    expect((result as { error?: { status?: number } }).error?.status).toBe(401);
  });

  it("does not sign the user out on a 403", async () => {
    const store = makeStore();
    store.dispatch(setToken("tok-123"));
    global.fetch = respond(403) as unknown as typeof fetch;

    await run(store, profikApi.endpoints.me.initiate());

    expect(tokenAfter(store)).toBe("tok-123");
  });

  it("does nothing on a successful request", async () => {
    const store = makeStore();
    store.dispatch(setToken("tok-123"));

    await run(store, profikApi.endpoints.me.initiate());

    expect(tokenAfter(store)).toBe("tok-123");
  });
});

/**
 * Both profile mutations answer with a UserResponseDto, which is narrower than
 * what GET /auth/me returns. Replacing the cache entry drops the difference —
 * which is how the phone number on the profile screen turned into "—" the
 * moment the avatar changed.
 */
describe("the me cache is merged, never replaced", () => {
  const seedMe = async (store: Store) => {
    global.fetch = respond(200, {
      id: "u1",
      name: "Anna",
      phone: "+420777123456",
      role: "contractor",
    }) as unknown as typeof fetch;
    await run(store, profikApi.endpoints.me.initiate());
  };

  const meFromCache = (store: Store) =>
    profikApi.endpoints.me.select(undefined)(store.getState()).data as
      Record<string, unknown> | undefined;

  it("keeps fields updateProfile does not answer with", async () => {
    const store = makeStore();
    store.dispatch(setToken("tok-123"));
    await seedMe(store);

    global.fetch = respond(200, {
      id: "u1",
      name: "Anna Nova",
    }) as unknown as typeof fetch;
    await run(
      store,
      profikApi.endpoints.updateProfile.initiate({ name: "Anna Nova" }),
    );

    expect(meFromCache(store)).toMatchObject({
      name: "Anna Nova",
      phone: "+420777123456",
    });
  });

  it("keeps them through an avatar upload too", async () => {
    const store = makeStore();
    store.dispatch(setToken("tok-123"));
    await seedMe(store);

    global.fetch = respond(200, {
      id: "u1",
      avatarUrl: "/avatars/u1.webp",
    }) as unknown as typeof fetch;
    await run(
      store,
      profikApi.endpoints.uploadAvatar.initiate({ uri: "file:///a.jpg" }),
    );

    const me = meFromCache(store);
    expect(me).toMatchObject({
      avatarUrl: "/avatars/u1.webp",
      phone: "+420777123456",
    });
  });
});
