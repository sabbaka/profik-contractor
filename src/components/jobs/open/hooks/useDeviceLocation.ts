import { logError } from "@/src/utils/logger";
import * as Location from "expo-location";
import { useCallback, useState } from "react";

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
 * Never called on mount — only from an explicit tap on the radius filter, so
 * opening the sheet alone never triggers the OS permission prompt.
 */
export function useDeviceLocation() {
  const [status, setStatus] = useState<DeviceLocationStatus>("idle");
  const [coords, setCoords] = useState<DeviceCoords | null>(null);

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
