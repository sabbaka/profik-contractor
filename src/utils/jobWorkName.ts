import type { TFunction } from "i18next";

import type { PropertyType, ServiceType } from "@/src/api/types";

/**
 * The minimum a caller must hold to name a job's work. Structural on purpose:
 * a full `Job`, a `Conversation["job"]` and a `PaymentHistoryJob` are three
 * unrelated shapes that all satisfy it.
 */
export interface WorkNameSource {
  title?: string | null;
  serviceType?: ServiceType | null;
  propertyType?: PropertyType | null;
}

/**
 * The job's work name, in the language the reader is using.
 *
 * The client app's wizard writes an English title into the database — and
 * keeps doing so, because released builds read it raw and it is the fallback
 * here. But the language it was written in is the client's, not this
 * contractor's, so nothing renders it directly: the label is derived from the
 * two enum columns the backend stores and returns, at the moment it is shown.
 * Same shape as `formatCountry` in `src/utils/country.ts`.
 *
 * Falls back to the stored title for a job posted before the wizard asked for
 * these — those rows have both columns null.
 *
 * The client app carries the same helper in `src/features/jobs/utils.ts`; keep
 * the two in step.
 */
export function formatWorkName(
  job: WorkNameSource | null | undefined,
  t: TFunction,
): string {
  const service = job?.serviceType;
  const property = job?.propertyType;

  if (service && property) {
    return t("job.workName", {
      service: t(`job.serviceType.${service}`),
      property: t(`job.propertyType.${property}`),
    });
  }
  // The wizard requires the pair, so a service without a property can only
  // reach this from a hand-written row — naming it still beats an English
  // title.
  if (service) return t(`job.serviceType.${service}`);

  return job?.title?.trim() || t("job.untitled");
}

/**
 * Display label for the `JobCategory` enum the backend sends verbatim
 * ("Cleaning", "Renovation", ...). The stored value is the key and its own
 * fallback, so a category added on the backend before the apps ship a key
 * shows "Plumbing" rather than a blank.
 */
export function formatCategory(
  category: string | null | undefined,
  t: TFunction,
): string {
  if (!category) return "";

  return t(`job.category.${category}`, { defaultValue: category });
}
