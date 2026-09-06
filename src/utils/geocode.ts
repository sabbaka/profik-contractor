import * as Location from "expo-location";
import { Platform } from "react-native";

import { logError } from "./logger";

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Turns a written address into coordinates, trying the cheapest source first.
 *
 * `Location.geocodeAsync` is the platform geocoder: free, no quota, no key. On
 * Android it is Play Services' `Geocoder`, which returns an empty list on a lot
 * of real devices — that silent empty result is what left job detail maps stuck
 * on "Locating…". So an empty answer there is expected, not exceptional, and we
 * fall through to Google's Geocoding web service using the same key the address
 * autocomplete already relies on.
 *
 * Returns `null` when neither source can place the address. Callers must render
 * something for that case; there is no third attempt.
 *
 * Mirrors `src/utils/geocode.ts` in the client app — keep the two in step.
 */
export async function geocodeAddress(
  address: string,
): Promise<Coordinates | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const fromPlatform = await geocodeViaPlatform(trimmed);
  if (fromPlatform) return fromPlatform;

  return geocodeViaGoogle(trimmed);
}

/**
 * Not logged when it comes up empty: on Android that is the normal case this
 * whole fallback chain exists for, and `logError` raises a dev alert.
 */
async function geocodeViaPlatform(
  address: string,
): Promise<Coordinates | null> {
  if (Platform.OS === "web") return null;

  try {
    const [first] = await Location.geocodeAsync(address);
    if (
      typeof first?.latitude === "number" &&
      typeof first?.longitude === "number"
    ) {
      return { lat: first.latitude, lng: first.longitude };
    }
  } catch {
    // Falls through to Google below, which reports if it fails too.
  }
  return null;
}

async function geocodeViaGoogle(address: string): Promise<Coordinates | null> {
  const key = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
  if (!key) {
    logError(
      new Error("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set"),
      "geocodeAddress",
    );
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address,
    )}&key=${key}`;
    const response = await fetch(url);
    const json = await response.json();

    const location = json?.results?.[0]?.geometry?.location;
    if (typeof location?.lat === "number" && typeof location?.lng === "number") {
      return { lat: location.lat, lng: location.lng };
    }

    // ZERO_RESULTS means the address is simply not on the map — a data problem,
    // not a fault of ours. Anything else is a key, quota or billing problem we
    // want to hear about.
    if (json?.status && json.status !== "ZERO_RESULTS") {
      logError(
        new Error(`Google geocoding returned ${json.status}`),
        "geocodeAddress",
        { errorMessage: json?.error_message },
      );
    }
  } catch (error) {
    logError(error, "geocodeAddress");
  }
  return null;
}
