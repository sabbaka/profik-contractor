import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import { AppState, type AppStateStatus } from "react-native";
import { logError } from "@/src/utils/logger";
import { usePushNotifications } from "./usePushNotifications";

const mockRegisterPushToken = jest.fn();

jest.mock("@/src/api/profikApi", () => ({
  useRegisterPushTokenMutation: () => [mockRegisterPushToken],
  useUnregisterPushTokenMutation: () => [jest.fn()],
  profikApi: { util: { invalidateTags: jest.fn() } },
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { MAX: 5 },
  useLastNotificationResponse: () => null,
  addNotificationReceivedListener: () => ({ remove: jest.fn() }),
}));

jest.mock("expo-device", () => ({ isDevice: true }));

jest.mock("expo-constants", () => ({
  expoConfig: { extra: { eas: { projectId: "test-project" } } },
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useRootNavigationState: () => undefined,
  useSegments: () => [],
}));

jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: "cs" } }),
}));

jest.mock("@/src/utils/logger", () => ({ logError: jest.fn() }));

const notifications = jest.mocked(Notifications);

/** RTK Query mutations are called then unwrapped; `unwrap` is what can reject. */
const registerResolves = () =>
  mockRegisterPushToken.mockReturnValue({ unwrap: async () => ({}) });

/** Captures the AppState listener the hook installs, to play a foreground. */
let appStateListeners: ((state: AppStateStatus) => void)[] = [];

/** Lets an attempt's `finally` run, so it is no longer in flight. */
async function settle() {
  await act(async () => {});
}

async function comeToForeground() {
  await act(async () => {
    for (const listener of appStateListeners) listener("active");
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  appStateListeners = [];
  jest.spyOn(AppState, "addEventListener").mockImplementation(((
    _type: string,
    listener: (state: AppStateStatus) => void,
  ) => {
    appStateListeners.push(listener);
    return {
      remove: () => {
        appStateListeners = appStateListeners.filter((l) => l !== listener);
      },
    };
  }) as never);
  notifications.getPermissionsAsync.mockResolvedValue({
    status: "granted",
  } as never);
  notifications.requestPermissionsAsync.mockResolvedValue({
    status: "granted",
  } as never);
  notifications.getExpoPushTokenAsync.mockResolvedValue({
    data: "ExponentPushToken[abc]",
    type: "expo",
  });
  registerResolves();
});

describe("usePushNotifications registration", () => {
  it("registers the device's push token with the UI language", async () => {
    await renderHook(() => usePushNotifications("jwt-1"));

    await waitFor(() =>
      expect(mockRegisterPushToken).toHaveBeenCalledWith({
        pushToken: "ExponentPushToken[abc]",
        language: "cs",
      }),
    );
  });

  // PROFIK-CONTRACTOR-8: "Aborted" arrived with no context, so nobody could
  // tell which of the four awaits gave up.
  it("reports which step failed", async () => {
    const aborted = new Error("Aborted");
    notifications.getExpoPushTokenAsync.mockRejectedValueOnce(aborted);

    await renderHook(() => usePushNotifications("jwt-1"));

    await waitFor(() =>
      expect(logError).toHaveBeenCalledWith(aborted, "push:register", {
        step: "getExpoPushToken",
      }),
    );
  });

  it("names the server call when the backend refuses the token", async () => {
    const refused = { status: 500, data: null };
    mockRegisterPushToken.mockReturnValueOnce({
      unwrap: async () => {
        throw refused;
      },
    });

    await renderHook(() => usePushNotifications("jwt-1"));

    await waitFor(() =>
      expect(logError).toHaveBeenCalledWith(refused, "push:register", {
        step: "saveToken",
      }),
    );
  });

  // The hook lives in the root layout and mounts once per launch, so before
  // this a failed attempt was retried only on the next cold start: the device
  // stayed without pushes for as long as the app lived in the background.
  it("tries again when the app comes back to the foreground after a failure", async () => {
    notifications.getExpoPushTokenAsync.mockRejectedValueOnce(
      new Error("Aborted"),
    );

    await renderHook(() => usePushNotifications("jwt-1"));
    await waitFor(() => expect(logError).toHaveBeenCalled());
    await settle();
    expect(mockRegisterPushToken).not.toHaveBeenCalled();

    await comeToForeground();

    await waitFor(() =>
      expect(mockRegisterPushToken).toHaveBeenCalledWith({
        pushToken: "ExponentPushToken[abc]",
        language: "cs",
      }),
    );
  });

  it("does not register again on foreground once it has succeeded", async () => {
    await renderHook(() => usePushNotifications("jwt-1"));
    await waitFor(() => expect(mockRegisterPushToken).toHaveBeenCalledTimes(1));

    await comeToForeground();
    await comeToForeground();

    expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledTimes(1);
    expect(mockRegisterPushToken).toHaveBeenCalledTimes(1);
  });

  // Asking again on every return to the app would nag on Android, where the
  // system prompt can reappear. A foreground only picks up a permission the
  // person has since granted in Settings.
  it("never shows the permission prompt from a foreground retry", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      status: "denied",
    } as never);
    notifications.requestPermissionsAsync.mockResolvedValue({
      status: "denied",
    } as never);

    await renderHook(() => usePushNotifications("jwt-1"));
    await waitFor(() =>
      expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1),
    );

    await comeToForeground();
    await waitFor(() =>
      expect(notifications.getPermissionsAsync).toHaveBeenCalledTimes(2),
    );

    expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockRegisterPushToken).not.toHaveBeenCalled();
  });

  it("registers after a foreground once the person turned pushes on in Settings", async () => {
    notifications.getPermissionsAsync.mockResolvedValueOnce({
      status: "denied",
    } as never);
    notifications.requestPermissionsAsync.mockResolvedValueOnce({
      status: "denied",
    } as never);

    await renderHook(() => usePushNotifications("jwt-1"));
    await waitFor(() =>
      expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1),
    );
    expect(mockRegisterPushToken).not.toHaveBeenCalled();

    await comeToForeground();

    await waitFor(() => expect(mockRegisterPushToken).toHaveBeenCalledTimes(1));
  });

  // A phone that can never get a token fails on every foreground; one event
  // per foreground would bury everything else in Sentry.
  it("reports a repeated failure once, not on every foreground", async () => {
    notifications.getExpoPushTokenAsync.mockRejectedValue(new Error("Aborted"));

    await renderHook(() => usePushNotifications("jwt-1"));
    await waitFor(() => expect(logError).toHaveBeenCalledTimes(1));
    await settle();

    await comeToForeground();
    await settle();
    await comeToForeground();
    await settle();

    expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledTimes(3);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("does not save a token for an account that signed out meanwhile", async () => {
    let deliverToken: (value: {
      data: string;
      type: "expo";
    }) => void = () => {};
    notifications.getExpoPushTokenAsync.mockReturnValueOnce(
      new Promise((resolve) => {
        deliverToken = resolve;
      }),
    );

    const { rerender } = await renderHook(
      ({ token }: { token: string | null }) => usePushNotifications(token),
      { initialProps: { token: "jwt-1" as string | null } },
    );
    await waitFor(() =>
      expect(notifications.getExpoPushTokenAsync).toHaveBeenCalled(),
    );

    await rerender({ token: null });
    await act(async () => {
      deliverToken({ data: "ExponentPushToken[abc]", type: "expo" });
    });

    expect(mockRegisterPushToken).not.toHaveBeenCalled();
    expect(appStateListeners).toHaveLength(0);
  });

  // At launch the effect restarts once (its key settles right after mount).
  // The first run is cancelled, and before this it still went for a token and
  // reported its own failure: two Sentry events per launch, not one.
  it("stops a cancelled run before it asks for a token", async () => {
    let grantFirst: (value: { status: string }) => void = () => {};
    notifications.getPermissionsAsync.mockReturnValueOnce(
      new Promise((resolve) => {
        grantFirst = resolve;
      }) as never,
    );

    const { rerender } = await renderHook(
      ({ token }: { token: string }) => usePushNotifications(token),
      { initialProps: { token: "jwt-1" } },
    );
    await rerender({ token: "jwt-2" });
    await waitFor(() => expect(mockRegisterPushToken).toHaveBeenCalledTimes(1));

    await act(async () => {
      grantFirst({ status: "granted" });
    });

    expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledTimes(1);
    expect(mockRegisterPushToken).toHaveBeenCalledTimes(1);
  });

  it("does not report the failure of a run that was cancelled meanwhile", async () => {
    let failFirst: (error: Error) => void = () => {};
    notifications.getExpoPushTokenAsync
      .mockReturnValueOnce(
        new Promise((_resolve, reject) => {
          failFirst = reject;
        }),
      )
      .mockRejectedValue(new Error("Aborted"));

    const { rerender } = await renderHook(
      ({ token }: { token: string }) => usePushNotifications(token),
      { initialProps: { token: "jwt-1" } },
    );
    await waitFor(() =>
      expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledTimes(1),
    );
    await rerender({ token: "jwt-2" });
    await waitFor(() => expect(logError).toHaveBeenCalledTimes(1));

    await act(async () => {
      failFirst(new Error("Aborted"));
    });

    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("does nothing while signed out", async () => {
    await renderHook(() => usePushNotifications(null));
    await comeToForeground();

    expect(notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(mockRegisterPushToken).not.toHaveBeenCalled();
  });
});
