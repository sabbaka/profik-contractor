import { logError } from "./logger";

let initialized = false;

/**
 * Catches errors that escape React's render lifecycle (which is handled by
 * `<ErrorBoundary>`):
 *
 *   • uncaught exceptions in async code, event handlers, timers
 *   • unhandled promise rejections (e.g. `await fetch(...)` without try/catch)
 *
 * Without this, RN would either silently swallow them (release builds) or
 * show the red screen of death (dev). Now every escape route lands in
 * `logError`, which makes the error visible and ready to forward to Sentry.
 */
export function setupGlobalErrorHandlers() {
  if (initialized) return;
  initialized = true;

  // 1. Global synchronous JS errors.
  // ErrorUtils is a private RN API that's been stable for years and is the
  // only way to install a top-level handler.
  const ErrorUtils = (globalThis as any).ErrorUtils;
  if (ErrorUtils?.setGlobalHandler) {
    const previous = ErrorUtils.getGlobalHandler?.();
    ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      logError(error, isFatal ? "global:fatal" : "global");
      // Preserve the original handler so the dev red-box still shows up.
      previous?.(error, isFatal);
    });
  }

  // 2. Unhandled promise rejections.
  // RN uses a polyfilled Promise (promise/setimmediate/rejection-tracking).
  // We hook into it via the documented entry-point.
  try {
    // Must be `require`, not a static import: the package may not be present
    // on every platform (web/SSR), and this needs to load synchronously at
    // startup — a dynamic `import()` would leave a window where unhandled
    // rejections go untracked.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tracking = require("promise/setimmediate/rejection-tracking");
    tracking.disable();
    tracking.enable({
      allRejections: true,
      onUnhandled: (id: number, error: unknown) => {
        logError(error, `unhandledRejection:${id}`);
      },
      onHandled: () => {
        // Intentionally empty — nothing to do once the rejection is handled.
      },
    });
  } catch {
    // promise package is not present, ignore (web/SSR cases).
  }
}
