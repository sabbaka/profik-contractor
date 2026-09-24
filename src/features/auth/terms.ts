/**
 * Whether this account still owes an acceptance of the Terms, and what to show
 * if it does.
 *
 * Sign-in and registration are one screen here — a phone number and a code —
 * so nothing on that screen can tell a returning person from a new one. The
 * server can: it answers every sign-in and every `/auth/me` with this block,
 * and `required` is the only thing either app looks at. That is what keeps the
 * checkbox off the screen of someone who has already agreed.
 *
 * The same field covers a second case with no extra machinery. A new account
 * has never accepted anything; an old one may hold an edition that has since
 * been replaced. Both are `required`, and `acceptedVersion` tells them apart
 * for the wording — "please review these" against "these have changed".
 */
export interface TermsState {
  required: boolean;
  currentVersion: string;
  /** Null when nothing has ever been accepted, which is not the same as stale. */
  acceptedVersion: string | null;
  acceptedAt: string | null;
  termsUrl: string;
  privacyUrl: string;
  /** The edition actually read, not the one in force. Null until they accept. */
  acceptedTermsUrl: string | null;
}

/** Where to send someone who taps a link, with the published pages as a floor. */
export const FALLBACK_TERMS_URL = "https://profik.app/obchodni-podminky";
export const FALLBACK_PRIVACY_URL =
  "https://profik.app/zasady-ochrany-osobnich-udaju";

/**
 * Fail open, deliberately.
 *
 * A response without the block means "nothing to accept". The server sends it
 * unconditionally, so an absence can only come from something being wrong — a
 * rolled-back backend, an old staging server, a request that failed and left
 * the cache empty — and the cost of guessing wrong in the other direction is
 * every install stuck behind a screen that cannot be dismissed. Being asked a
 * little late is recoverable; being locked out is not.
 */
export function termsRequired(user?: { terms?: TermsState } | null): boolean {
  return user?.terms?.required === true;
}

/**
 * True when this account has never accepted anything, as opposed to holding an
 * edition that has since been replaced. Only the wording differs.
 */
export function isFirstAcceptance(terms?: TermsState | null): boolean {
  return !terms?.acceptedVersion;
}

export function termsUrlOf(terms?: TermsState | null): string {
  return terms?.termsUrl ?? FALLBACK_TERMS_URL;
}

export function privacyUrlOf(terms?: TermsState | null): string {
  return terms?.privacyUrl ?? FALLBACK_PRIVACY_URL;
}

/**
 * The last answer the server gave, as it is kept between launches.
 *
 * Only what the launch decision needs. The live answer arrives from `/auth/me`
 * a moment later and replaces this; the copy exists so the first frame does
 * not have to wait for a network round trip, and so a launch with no network
 * still knows which screen to paint.
 */
export interface CachedTerms {
  required: boolean;
  /**
   * Which edition the answer was about. A cache written before a new edition
   * shipped is not wrong, just old — the live answer corrects it.
   */
  currentVersion: string;
}

export function toCachedTerms(terms?: TermsState | null): CachedTerms | null {
  if (!terms) return null;
  return { required: terms.required, currentVersion: terms.currentVersion };
}
