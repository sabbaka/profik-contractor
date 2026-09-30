import { logError } from "@/src/utils/logger";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

export type DeviceLocationStatus =
  "idle" | "requesting" | "granted" | "denied" | "unavailable" | "error";

/**
 * What expo-location rejects with when permission is granted but there is no
 * fix — location services switched off, or no signal. A state of the phone,
 * not a failure of the app, so it is shown to the contractor rather than
 * reported (PROFIK-CONTRACTOR-4). The codes are expo's, inferred from the
 * native exception class names: on Android `getCurrentPositionAsync` throws
 * ERR_CURRENT_LOCATION_IS_UNAVAILABLE (no fix) or
 * ERR_LOCATION_SETTINGS_UNSATISFIED (services off, system dialog declined); on
 * iOS it throws ERR_LOCATION_UNAVAILABLE, which also covers a weak signal.
 */
const LOCATION_UNAVAILABLE_CODES = new Set([
  "ERR_CURRENT_LOCATION_IS_UNAVAILABLE",
  "ERR_LOCATION_UNAVAILABLE",
  "ERR_LOCATION_SETTINGS_UNSATISFIED",
]);

function isLocationUnavailable(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    LOCATION_UNAVAILABLE_CODES.has(String(error.code))
  );
}

interface DeviceCoords {
  lat: number;
  lng: number;
}

/**
 * Foreground GPS on demand, for the Open Jobs radius filter — the one place
 * in the app that reads the contractor's own location. `expo-location` was
 * already a dependency (unused) before this; there is no location field on
 * the contractor profile and none is planned, this is device-only and asked
 * for fresh each time `request()` runs.
 *
 * `request()` is only ever called from an explicit tap on the radius filter,
 * so opening the sheet alone never triggers the OS permission *prompt*. But
 * this hook's own `coords`/`status` live only as long as it stays mounted, so
 * without the effect below, a contractor who already said yes — in an
 * earlier session, or before this sheet happened to remount — would see the
 * "Enable Location" button again and have to tap it once more before the
 * radius slider comes back, even though the OS itself has nothing left to
 * ask. The effect checks the OS's existing answer (never prompts — that's
 * what makes `getForegroundPermissionsAsync` different from `request`'s
 * `requestForegroundPermissionsAsync`) and silently restores the granted
 * state if there is one.
 */
export function useDeviceLocation() {
  const [status, setStatus] = useState<DeviceLocationStatus>("idle");
  const [coords, setCoords] = useState<DeviceCoords | null>(null);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Shared by the mount-time check below and by the AppState listener that
  // re-runs it after a trip to Settings — see `prepareForSettingsReturn`.
  // Never prompts (`getForegroundPermissionsAsync`, not `request...`), so
  // calling it speculatively on every return to the app would have been fine
  // too; it's gated instead only to avoid a location fetch on every single
  // foreground for contractors who were never in this flow at all.
  const restore = useCallback(async () => {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted || !isMounted.current) return;
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!isMounted.current) return;
      setCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setStatus("granted");
    } catch (error) {
      // Silent restore: with no fix the sheet keeps its "Enable location"
      // button, which is right — tapping it says why.
      if (isMounted.current && !isLocationUnavailable(error)) {
        logError(error, "useDeviceLocation.restore");
      }
    }
  }, []);

  useEffect(() => {
    // The extra wrapper, not `void restore()` directly, is what keeps the
    // linter's "no setState synchronously in an effect body" rule from
    // flagging this: `restore` sets state only after its own awaits, never
    // synchronously, but the rule can't see through a bare reference to a
    // `useCallback` — an inline call site reads the same as the case it's
    // actually guarding against.
    void (async () => {
      await restore();
    })();
  }, [restore]);

  /**
   * Once the OS has refused the permission prompt once, it never shows it
   * again — `request()` below just silently re-resolves `denied`, forever.
   * Settings is the only way back on, and this is what makes coming back
   * from it actually take effect without the contractor having to close and
   * reopen the sheet: a ref (not state, since it's read from inside a
   * listener that must not be torn down and rebuilt on every render) armed
   * right before `openAppSettings`, consumed on the next time the app
   * becomes active.
   */
  const awaitingSettingsReturn = useRef(false);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !awaitingSettingsReturn.current) return;
      awaitingSettingsReturn.current = false;
      void restore();
    });
    return () => subscription.remove();
  }, [restore]);

  const prepareForSettingsReturn = useCallback(() => {
    awaitingSettingsReturn.current = true;
  }, []);

  const request = useCallback(async (): Promise<DeviceCoords | null> => {
    setStatus("requesting");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setStatus("denied");
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCoords(next);
      setStatus("granted");
      return next;
    } catch (error) {
      if (isLocationUnavailable(error)) {
        setStatus("unavailable");
        return null;
      }
      logError(error, "useDeviceLocation.request");
      setStatus("error");
      return null;
    }
  }, []);

  return { status, coords, request, prepareForSettingsReturn };
}
