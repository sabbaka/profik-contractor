/**
 * The network, faked at the one place every request leaves the app: `fetch`.
 *
 * Mocking here rather than at the RTK Query hooks keeps the real API layer in
 * the test — the URL each endpoint builds, its query string, the auth header,
 * the cache and its invalidation — so a test fails when any of that changes,
 * not only when the screen does.
 */

/** What a route sees of the request it is answering. */
export interface MockRequest {
  url: string;
  method: string;
  /** Parsed JSON when the body was JSON, the raw text otherwise. */
  body: unknown;
}

export interface MockReply {
  /** Defaults to 200. */
  status?: number;
  /** Serialised as JSON; omit for an empty body. */
  body?: unknown;
}

export type MockRoute =
  MockReply | ((req: MockRequest) => MockReply | Promise<MockReply>);

/** Keyed `"METHOD /path"` — the pathname only, the query string is ignored. */
export type MockRoutes = Record<string, MockRoute>;

let active: jest.SpyInstance | null = null;
let unmatched: string[] = [];

async function readBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Answers every `fetch` from `routes` and returns the spy, so a test can
 * inspect what was sent. A request no route matches is rejected and fails the
 * test after it ends, naming the URL — RTK Query would otherwise swallow the
 * rejection as a `FETCH_ERROR` and the screen would just show its error state.
 */
export function mockApi(routes: MockRoutes): jest.SpyInstance {
  restoreApiMock();
  const table = new Map(
    Object.entries(routes).map(([key, route]) => {
      const [method, path] = key.trim().split(/\s+/);
      return [`${method.toUpperCase()} ${path}`, route] as const;
    }),
  );

  active = jest
    .spyOn(global, "fetch")
    .mockImplementation(async (input, init) => {
      const request =
        input instanceof Request ? input : new Request(String(input), init);
      const method = request.method.toUpperCase();
      const { pathname } = new URL(request.url);
      const route = table.get(`${method} ${pathname}`);
      if (!route) {
        unmatched.push(`${method} ${request.url}`);
        throw new Error(`mockApi: no route for ${method} ${request.url}`);
      }
      const reply =
        typeof route === "function"
          ? await route({
              url: request.url,
              method,
              body: await readBody(request.clone()),
            })
          : route;
      const status = reply.status ?? 200;
      return new Response(
        reply.body === undefined ? null : JSON.stringify(reply.body),
        { status, headers: { "Content-Type": "application/json" } },
      );
    });
  return active;
}

/** Puts the real `fetch` back. Runs after every test on its own. */
export function restoreApiMock(): void {
  active?.mockRestore();
  active = null;
}

/**
 * Every request the spy saw, parsed the way routes see them — for asserting on
 * what a screen sent rather than on what it rendered.
 */
export async function apiCalls(spy: jest.SpyInstance): Promise<MockRequest[]> {
  return Promise.all(
    spy.mock.calls.map(async ([input, init]) => {
      const request =
        input instanceof Request
          ? input.clone()
          : new Request(String(input), init);
      return {
        url: request.url,
        method: request.method.toUpperCase(),
        body: await readBody(request),
      };
    }),
  );
}

afterEach(() => {
  restoreApiMock();
  const missed = unmatched;
  unmatched = [];
  if (missed.length > 0) {
    throw new Error(
      `mockApi: unmatched request(s) — add a route:\n  ${missed.join("\n  ")}`,
    );
  }
});
