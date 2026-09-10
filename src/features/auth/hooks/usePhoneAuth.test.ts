import { act, renderHook } from "@testing-library/react-native";
import { router } from "expo-router";
import { logError } from "@/src/utils/logger";
import { usePhoneAuth } from "./usePhoneAuth";

const mockRequestOtpCode = jest.fn();
const mockVerifyOtpCode = jest.fn();
const mockDispatch = jest.fn();
const mockResetApiState = jest.fn(() => ({ type: "api/resetApiState" }));

jest.mock("@/src/api/profikApi", () => ({
  useRequestOtpCodeMutation: () => [mockRequestOtpCode, { isLoading: false }],
  useVerifyOtpCodeMutation: () => [mockVerifyOtpCode, { isLoading: false }],
  profikApi: { util: { resetApiState: () => mockResetApiState() } },
}));

jest.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/src/utils/logger", () => ({ logError: jest.fn() }));

/** RTK Query mutations are called then unwrapped; `unwrap` is what can reject. */
const resolves = (mutation: jest.Mock, value: unknown = {}) =>
  mutation.mockReturnValue({ unwrap: async () => value });

const rejects = (mutation: jest.Mock, error: unknown) =>
  mutation.mockReturnValue({
    unwrap: async () => {
      throw error;
    },
  });

beforeEach(() => {
  jest.useFakeTimers();
  resolves(mockRequestOtpCode);
  resolves(mockVerifyOtpCode, { token: "jwt-1" });
});

afterEach(() => {
  jest.useRealTimers();
});

const setUp = async (returnTo?: string) =>
  (await renderHook(() => usePhoneAuth(returnTo as never))).result;

/** Get as far as the code boxes, which most of these start from. */
const reachCodeStep = async (returnTo?: string) => {
  const result = await setUp(returnTo);
  await act(async () => {
    await result.current.requestCode("777123456");
  });
  return result;
};

/** Walk the resend cooldown down to zero, one scheduled second at a time. */
const drainCooldown = async () => {
  for (let i = 0; i < 60; i++) {
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  }
};

describe("requesting a code", () => {
  it("normalises what the user typed before sending it", async () => {
    const result = await reachCodeStep();

    expect(mockRequestOtpCode).toHaveBeenCalledWith({ phone: "+420777123456" });
    expect(result.current.phone).toBe("+420777123456");
    expect(result.current.step).toBe("code");
  });

  // The field error is raised here rather than letting the API answer 400.
  it("refuses a number it cannot make sense of, without asking the server", async () => {
    const result = await setUp();

    await act(async () => {
      await result.current.requestCode("12");
    });

    expect(mockRequestOtpCode).not.toHaveBeenCalled();
    expect(result.current.phoneError).toBe("auth.errors.phoneInvalid");
    expect(result.current.step).toBe("phone");
  });

  it("stays on the phone step when the send fails", async () => {
    rejects(mockRequestOtpCode, { status: 422 });
    const result = await setUp();

    await act(async () => {
      await result.current.requestCode("777123456");
    });

    expect(result.current.step).toBe("phone");
    expect(result.current.phoneError).toBe("auth.otp.errors.undeliverable");
    expect(result.current.phone).toBeNull();
  });
});

/**
 * The server allows three requests per five minutes, so a resend that slips
 * past the cooldown spends the user's budget on a screen they cannot leave.
 */
describe("the resend cooldown", () => {
  it("starts at a minute and counts down", async () => {
    const result = await reachCodeStep();
    expect(result.current.secondsUntilResend).toBe(60);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.secondsUntilResend).toBe(59);
  });

  it("does nothing at all while it is still running", async () => {
    const result = await reachCodeStep();
    mockRequestOtpCode.mockClear();

    await act(async () => {
      await result.current.resend();
    });

    expect(mockRequestOtpCode).not.toHaveBeenCalled();
  });

  it("sends again once it has run out, and restarts", async () => {
    const result = await reachCodeStep();
    await drainCooldown();
    expect(result.current.secondsUntilResend).toBe(0);

    mockRequestOtpCode.mockClear();
    await act(async () => {
      await result.current.resend();
    });

    expect(mockRequestOtpCode).toHaveBeenCalledWith({ phone: "+420777123456" });
    expect(result.current.secondsUntilResend).toBe(60);
  });
});

describe("verifying the code", () => {
  // The app this is signing in from, echoed back in the token. It has been
  // wrong before, in both apps, and nothing else pins it.
  it("tells the server which app the session is talking from", async () => {
    const result = await reachCodeStep();

    await act(async () => {
      await result.current.verifyCode("123456");
    });

    expect(mockVerifyOtpCode).toHaveBeenCalledWith({
      phone: "+420777123456",
      code: "123456",
      role: "contractor",
    });
  });

  it("stores the token and clears the previous user's cache", async () => {
    const result = await reachCodeStep();

    await act(async () => {
      await result.current.verifyCode("123456");
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "auth/setToken",
      payload: "jwt-1",
    });
    expect(mockResetApiState).toHaveBeenCalled();
  });

  it("lands on the home tab, replacing the auth screen rather than stacking it", async () => {
    const result = await reachCodeStep();

    await act(async () => {
      await result.current.verifyCode("123456");
    });

    expect(router.replace).toHaveBeenCalledWith("/(contractor)/(tabs)/open");
  });

  it("goes back where the user was sent from, when there is somewhere", async () => {
    const result = await reachCodeStep(
      "/(contractor)/jobs/3fa85f64-5717-4562-b3fc-2c963f66afa6",
    );

    await act(async () => {
      await result.current.verifyCode("123456");
    });

    expect(router.replace).toHaveBeenCalledWith(
      "/(contractor)/jobs/3fa85f64-5717-4562-b3fc-2c963f66afa6",
    );
  });

  // Verification fires by itself on the sixth digit, so it can be reached
  // twice for one code if a render slips between the two.
  it("verifies once even when it is asked twice", async () => {
    const result = await reachCodeStep();

    await act(async () => {
      await Promise.all([
        result.current.verifyCode("123456"),
        result.current.verifyCode("123456"),
      ]);
    });

    expect(mockVerifyOtpCode).toHaveBeenCalledTimes(1);
  });

  it("does nothing before a number has been confirmed", async () => {
    const result = await setUp();

    await act(async () => {
      await result.current.verifyCode("123456");
    });

    expect(mockVerifyOtpCode).not.toHaveBeenCalled();
  });
});

/**
 * Each reason gets its own message: a mistyped code and an expired one need
 * different advice, and a rate limit is not something to retry.
 */
describe("telling the failures apart", () => {
  it.each([
    [401, "auth.otp.errors.invalidCode"],
    [404, "auth.otp.errors.expired"],
    [429, "auth.otp.errors.tooManyAttempts"],
    [403, "auth.otp.errors.wrongApp"],
  ])("turns a %s into its own message", async (status, key) => {
    rejects(mockVerifyOtpCode, { status });
    const result = await reachCodeStep();

    await act(async () => {
      await result.current.verifyCode("123456");
    });

    expect(result.current.codeError).toBe(key);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("treats a transport failure as a network problem", async () => {
    rejects(mockVerifyOtpCode, { status: "FETCH_ERROR" });
    const result = await reachCodeStep();

    await act(async () => {
      await result.current.verifyCode("123456");
    });

    expect(result.current.codeError).toBe("auth.otp.errors.network");
  });

  // A classified failure is expected and already shown to the user; only an
  // unrecognised one is worth a Sentry event.
  it("reports only the unrecognised ones", async () => {
    rejects(mockVerifyOtpCode, { status: 401 });
    const result = await reachCodeStep();
    await act(async () => {
      await result.current.verifyCode("123456");
    });
    expect(logError).not.toHaveBeenCalled();

    rejects(mockVerifyOtpCode, new Error("boom"));
    await act(async () => {
      await result.current.verifyCode("123456");
    });
    expect(logError).toHaveBeenCalledWith(
      expect.anything(),
      "phoneAuth:verifyCode",
    );
  });

  it("lets a second attempt through after a failed one", async () => {
    rejects(mockVerifyOtpCode, { status: 401 });
    const result = await reachCodeStep();

    await act(async () => {
      await result.current.verifyCode("111111");
    });
    resolves(mockVerifyOtpCode, { token: "jwt-1" });
    await act(async () => {
      await result.current.verifyCode("123456");
    });

    expect(router.replace).toHaveBeenCalled();
  });
});

describe("changing the number", () => {
  it("goes back to the phone step with both fields clear", async () => {
    rejects(mockVerifyOtpCode, { status: 401 });
    const result = await reachCodeStep();
    await act(async () => {
      await result.current.verifyCode("111111");
    });
    expect(result.current.codeError).toBeDefined();

    await act(async () => {
      result.current.changeNumber();
    });

    expect(result.current.step).toBe("phone");
    expect(result.current.codeError).toBeUndefined();
    expect(result.current.phoneError).toBeUndefined();
  });
});
