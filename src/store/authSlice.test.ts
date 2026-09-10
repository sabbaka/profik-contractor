import { configureStore } from "@reduxjs/toolkit";
import authReducer, {
  loadTokenFromStorage,
  logout,
  setToken,
} from "./authSlice";
import * as tokenStorage from "../utils/tokenStorage";

jest.mock("../utils/tokenStorage", () => ({
  getToken: jest.fn(),
  saveToken: jest.fn(),
  deleteToken: jest.fn(),
}));

const mocked = tokenStorage as jest.Mocked<typeof tokenStorage>;

const makeStore = () => configureStore({ reducer: { auth: authReducer } });

const authOf = (store: ReturnType<typeof makeStore>) => store.getState().auth;

/**
 * Two reducers here write to secure storage from inside the reducer, which
 * Redux calls a side effect and forbids. It works, and it is load-bearing —
 * nothing else persists the token — so the behaviour is pinned rather than
 * assumed: a later move of the persistence into middleware has to keep it, and
 * a silent loss of it signs the user out on every cold start.
 */
describe("authSlice", () => {
  // Not "signed out": the app is a guest-capable one, and a `false` here on
  // the first frame routes a signed-in user through the auth gate.
  it("starts out not knowing, rather than knowing there is no token", () => {
    expect(authOf(makeStore())).toEqual({ token: null, loading: true });
  });

  it("persists the token as it stores it", () => {
    const store = makeStore();
    store.dispatch(setToken("jwt-1"));

    expect(authOf(store).token).toBe("jwt-1");
    expect(mocked.saveToken).toHaveBeenCalledWith("jwt-1");
  });

  it("clears the stored token on logout, not just the one in memory", () => {
    const store = makeStore();
    store.dispatch(setToken("jwt-1"));
    store.dispatch(logout());

    expect(authOf(store).token).toBeNull();
    expect(mocked.deleteToken).toHaveBeenCalled();
  });

  it("adopts the token found in storage on start", async () => {
    mocked.getToken.mockResolvedValue("jwt-from-storage");
    const store = makeStore();
    await store.dispatch(loadTokenFromStorage() as never);

    expect(authOf(store)).toEqual({
      token: "jwt-from-storage",
      loading: false,
    });
  });

  it("settles as a guest when storage holds nothing", async () => {
    mocked.getToken.mockResolvedValue(null);
    const store = makeStore();
    await store.dispatch(loadTokenFromStorage() as never);

    expect(authOf(store)).toEqual({ token: null, loading: false });
  });

  // Without this the app sits on the splash screen forever: nothing else ever
  // clears `loading`, and SecureStore can fail on a device.
  it("stops waiting even when storage fails outright", async () => {
    mocked.getToken.mockRejectedValue(new Error("keychain unavailable"));
    const store = makeStore();
    await store.dispatch(loadTokenFromStorage() as never);

    expect(authOf(store)).toEqual({ token: null, loading: false });
  });
});
