import type { GetOpenJobsParams } from "@/src/api/types";
import { toDateParam } from "@/src/utils/localDate";
import { useCallback, useMemo, useState } from "react";

/**
 * The three filters on the Open Jobs sheet, in the shape the sheet edits
 * them — text for the price inputs (so a half-typed number doesn't get
 * coerced mid-keystroke), `Date | null` for the range, and a single slider
 * value for radius. `null` on `radiusKm` means the location filter is off,
 * distinct from "0 km" which is not a value the slider can reach.
 */
export interface OpenJobsFilterDraft {
  priceMin: string;
  priceMax: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  radiusKm: number | null;
}

export const EMPTY_OPEN_JOBS_FILTERS: OpenJobsFilterDraft = {
  priceMin: "",
  priceMax: "",
  dateFrom: null,
  dateTo: null,
  radiusKm: null,
};

/** Matches the server default used when `lat`/`lng` are sent without `radiusKm`. */
export const DEFAULT_RADIUS_KM = 15;

/** Where the slider's own scale ends — past this it reads "30+". */
export const RADIUS_SLIDER_MAX = 30;

/** Sent instead of the slider's own max — `radiusKm`'s real ceiling is 100. */
const UNBOUNDED_RADIUS_KM = 100;

/** What "30+" on the slider actually asks the server for. */
export function resolveRadiusKm(sliderValue: number): number {
  return sliderValue >= RADIUS_SLIDER_MAX ? UNBOUNDED_RADIUS_KM : sliderValue;
}

function parsePositiveInt(raw: string): number | undefined {
  const n = Number(raw.replace(/[^0-9]/g, ""));
  return raw.trim() !== "" && Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Turns a sheet draft into the query params `getOpenJobs` sends. Pure so the
 * edge cases — an empty price field, a radius picked before location was
 * granted — are covered by a unit test instead of only by hand-testing the
 * sheet.
 */
export function buildOpenJobsParams(
  draft: OpenJobsFilterDraft,
  coords: { lat: number; lng: number } | null,
): GetOpenJobsParams {
  const params: GetOpenJobsParams = {};

  const priceMin = parsePositiveInt(draft.priceMin);
  const priceMax = parsePositiveInt(draft.priceMax);
  if (priceMin != null) params.priceMin = priceMin;
  if (priceMax != null) params.priceMax = priceMax;

  if (draft.dateFrom) params.dateFrom = toDateParam(draft.dateFrom);
  if (draft.dateTo) params.dateTo = toDateParam(draft.dateTo);

  // A radius chosen before location was ever granted is not a location
  // filter — there is nothing to search around, so it is dropped rather than
  // sent without lat/lng (which the server would reject as an incomplete pair).
  if (draft.radiusKm != null && coords) {
    params.lat = coords.lat;
    params.lng = coords.lng;
    params.radiusKm = resolveRadiusKm(draft.radiusKm);
  }

  return params;
}

/** Drives the filter button's badge — one dot per active *group*, not per field. */
export function countActiveFilterGroups(params: GetOpenJobsParams): number {
  let count = 0;
  if (params.priceMin != null || params.priceMax != null) count++;
  if (params.dateFrom != null || params.dateTo != null) count++;
  if (params.lat != null && params.lng != null) count++;
  return count;
}

/**
 * Owns the filters actually applied to the Open Jobs list — separate from
 * whatever the sheet's own draft state is while the contractor is still
 * adjusting it, so scrolling the list underneath never sees a half-edited
 * filter. `apply` is the only way the committed value changes; `clear`
 * commits the empty state directly, matching "Clear All" applying at once
 * rather than needing a second confirm.
 */
export function useOpenJobsFilters() {
  const [applied, setApplied] = useState(EMPTY_OPEN_JOBS_FILTERS);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const params = useMemo(
    () => buildOpenJobsParams(applied, coords),
    [applied, coords],
  );
  const activeCount = useMemo(() => countActiveFilterGroups(params), [params]);

  const apply = useCallback(
    (
      draft: OpenJobsFilterDraft,
      nextCoords: { lat: number; lng: number } | null,
    ) => {
      setApplied(draft);
      setCoords(nextCoords);
    },
    [],
  );

  const clear = useCallback(() => {
    setApplied(EMPTY_OPEN_JOBS_FILTERS);
    setCoords(null);
  }, []);

  return { applied, coords, params, activeCount, apply, clear };
}
