import { act, renderHook } from "@testing-library/react-native";
import { Alert, Linking } from "react-native";
import {
  RECONCILE_ATTEMPTS,
  RECONCILE_INTERVAL_MS,
  useIdentityVerification,
} from "./useIdentityVerification";

const mockStartMutation = jest.fn();
const mockRefreshMutation = jest.fn();
let mockVerification: unknown;

jest.mock("@/src/api/profikApi", () => ({
  useMeQuery: () => ({
    data: { identityVerification: mockVerification },
    isLoading: false,
  }),
  useStartVerificationMutation: () => [mockStartMutation, { isLoading: false }],
  useRefreshVerificationMutation: () => [
    mockRefreshMutation,
    { isLoading: false },
  ],
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/src/features/auth/types", () => ({
  extractErrorMessage: () => "server message",
}));

const unwrapping = (mock: jest.Mock) => ({
  resolves: (value: unknown) =>
    mock.mockReturnValue({ unwrap: () => Promise.resolve(value) }),
  rejects: (error: unknown) =>
    mock.mockReturnValue({ unwrap: () => Promise.reject(error) }),
});

/** Status the reconcile poll sees on each successive attempt. */
const statusSequence = (values: string[]) => {
  let call = 0;
  mockRefreshMutation.mockImplementation(() => ({
    unwrap: () => {
      const status = values[Math.min(call, values.length - 1)];
      call += 1;
      return Promise.resolve({
        status,
        verifiedAt: null,
        verifiedUntil: null,
        displayName: null,
      });
    },
  }));
};

/**
 * Runs `reconcile` to completion with fake timers, stepping past each gap.
 * Each attempt awaits a mutation before sleeping, so the timers cannot be run
 * all at once — the microtask queue has to drain between ticks.
 */
const runReconcile = async (reconcile: () => Promise<unknown>) => {
  let settled: unknown;
  const pending = reconcile().then((value) => (settled = value));

  for (let i = 0; i < RECONCILE_ATTEMPTS + 1; i++) {
    await act(async () => {
      await Promise.resolve();
      jest.advanceTimersByTime(RECONCILE_INTERVAL_MS);
    });
  }

  await pending;
  return settled as { status: string } | null;
};

describe("useIdentityVerification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockVerification = undefined;
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("start", () => {
    // The whole reason this hook does not copy useTopup: the flow needs the
    // camera, and an in-app authentication session does not reliably grant it.
    it("opens the session in the system browser", async () => {
      unwrapping(mockStartMutation).resolves({
        url: "https://verify.example/s/1",
        sessionId: "s1",
        status: "not_started",
        resumed: false,
      });

      const { result } = await renderHook(() => useIdentityVerification());

      let opened: boolean | undefined;
      await act(async () => {
        opened = await result.current.start();
      });

      expect(opened).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith(
        "https://verify.example/s/1",
      );
    });

    it("reports a device that cannot open the link, without opening it", async () => {
      unwrapping(mockStartMutation).resolves({
        url: "https://verify.example/s/1",
        sessionId: "s1",
        status: "not_started",
        resumed: false,
      });
      jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);

      const { result } = await renderHook(() => useIdentityVerification());

      let opened: boolean | undefined;
      await act(async () => {
        opened = await result.current.start();
      });

      expect(opened).toBe(false);
      expect(Linking.openURL).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalled();
    });

    // 409 already verified, 429 too many attempts and 503 not configured each
    // carry their own code, which the extractor turns into its own message.
    it("surfaces the server's reason when the session cannot be opened", async () => {
      unwrapping(mockStartMutation).rejects({ status: 429 });

      const { result } = await renderHook(() => useIdentityVerification());

      let opened: boolean | undefined;
      await act(async () => {
        opened = await result.current.start();
      });

      expect(opened).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "common.error",
        "server message",
      );
      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });

  describe("reconcile", () => {
    it("stops as soon as the provider has settled", async () => {
      statusSequence(["approved"]);

      const { result } = await renderHook(() => useIdentityVerification());
      const settled = await runReconcile(result.current.reconcile);

      expect(settled?.status).toBe("approved");
      expect(mockRefreshMutation).toHaveBeenCalledTimes(1);
    });

    // The webhook may not have landed at the moment the browser handed control
    // back, so an unsettled first answer is expected rather than a failure.
    it("keeps asking while the answer is still in progress", async () => {
      statusSequence(["in_progress", "in_progress", "approved"]);

      const { result } = await renderHook(() => useIdentityVerification());
      const settled = await runReconcile(result.current.reconcile);

      expect(settled?.status).toBe("approved");
      expect(mockRefreshMutation).toHaveBeenCalledTimes(3);
    });

    it("gives up after the last attempt rather than polling forever", async () => {
      statusSequence(["in_progress"]);

      const { result } = await renderHook(() => useIdentityVerification());
      const settled = await runReconcile(result.current.reconcile);

      expect(settled?.status).toBe("in_progress");
      expect(mockRefreshMutation).toHaveBeenCalledTimes(RECONCILE_ATTEMPTS);
    });

    // A provider outage must leave the profile showing its last known state,
    // not an error.
    it("returns quietly when the server call fails", async () => {
      unwrapping(mockRefreshMutation).rejects(new Error("offline"));

      const { result } = await renderHook(() => useIdentityVerification());
      const settled = await runReconcile(result.current.reconcile);

      expect(settled).toBeNull();
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("treats a decline as settled, the same as an approval", async () => {
      statusSequence(["declined"]);

      const { result } = await renderHook(() => useIdentityVerification());
      const settled = await runReconcile(result.current.reconcile);

      expect(settled?.status).toBe("declined");
      expect(mockRefreshMutation).toHaveBeenCalledTimes(1);
    });
  });

  it("exposes the summary carried by /auth/me", async () => {
    mockVerification = {
      status: "approved",
      verifiedAt: "2026-09-11T10:00:00.000Z",
      verifiedUntil: "2028-09-11T10:00:00.000Z",
      displayName: "Olena P.",
    };

    const { result } = await renderHook(() => useIdentityVerification());

    expect(result.current.verification?.displayName).toBe("Olena P.");
  });
});
