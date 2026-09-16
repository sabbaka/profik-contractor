import { logError } from "@/src/utils/logger";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

export type DeviceLocationStatus =
  "idle" | "requesting" | "granted" | "denied" | "error";

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted || cancelled) return;
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus("granted");
      } catch (error) {
        if (!cancelled) logError(error, "useDeviceLocation.restore");
      }
    })();
    return () => {
      cancelled = true;
    };
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
      logError(error, "useDeviceLocation.request");
      setStatus("error");
      return null;
    }
  }, []);

  return { status, coords, request };
}
