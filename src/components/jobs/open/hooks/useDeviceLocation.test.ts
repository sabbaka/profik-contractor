import { logError } from "@/src/utils/logger";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as Location from "expo-location";
import { useDeviceLocation } from "./useDeviceLocation";

jest.mock("@/src/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const granted = { status: "granted", granted: true, canAskAgain: true };

/** What expo-location rejects with when location services are off. */
const servicesOff = Object.assign(
  new Error(
    "Current location is unavailable. Make sure that location services are enabled",
  ),
  { code: "ERR_CURRENT_LOCATION_IS_UNAVAILABLE" },
);

describe("useDeviceLocation", () => {
  beforeEach(() => {
    jest.mocked(logError).mockClear();
    jest.mocked(Location.getForegroundPermissionsAsync).mockReset();
    jest.mocked(Location.requestForegroundPermissionsAsync).mockReset();
    jest.mocked(Location.getCurrentPositionAsync).mockReset();
  });

  // PROFIK-CONTRACTOR-4: permission granted, but no fix — location services
  // off or no signal. A state of the phone, not a failure of the app.
  it("does not report switched-off location services when restoring", async () => {
    jest
      .mocked(Location.getForegroundPermissionsAsync)
      .mockResolvedValue(granted as never);
    jest
      .mocked(Location.getCurrentPositionAsync)
      .mockRejectedValue(servicesOff);

    const { result } = await renderHook(() => useDeviceLocation());

    await waitFor(() =>
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled(),
    );
    expect(logError).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("says location is unavailable, without reporting it, when asked", async () => {
    jest
      .mocked(Location.getForegroundPermissionsAsync)
      .mockResolvedValue({ ...granted, granted: false } as never);
    jest
      .mocked(Location.requestForegroundPermissionsAsync)
      .mockResolvedValue(granted as never);
    jest
      .mocked(Location.getCurrentPositionAsync)
      .mockRejectedValue(servicesOff);

    const { result } = await renderHook(() => useDeviceLocation());
    await act(async () => {
      await result.current.request();
    });

    expect(result.current.status).toBe("unavailable");
    expect(logError).not.toHaveBeenCalled();
  });

  it("still reports anything else that goes wrong", async () => {
    jest
      .mocked(Location.getForegroundPermissionsAsync)
      .mockResolvedValue({ ...granted, granted: false } as never);
    jest
      .mocked(Location.requestForegroundPermissionsAsync)
      .mockResolvedValue(granted as never);
    const failure = new Error("Something unexpected");
    jest.mocked(Location.getCurrentPositionAsync).mockRejectedValue(failure);

    const { result } = await renderHook(() => useDeviceLocation());
    await act(async () => {
      await result.current.request();
    });

    expect(result.current.status).toBe("error");
    expect(logError).toHaveBeenCalledWith(failure, "useDeviceLocation.request");
  });
});
