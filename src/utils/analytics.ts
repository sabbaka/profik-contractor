import { logError } from "@/src/utils/logger";
import PostHog from "posthog-react-native";

/**
 * EU cloud, deliberately. The app bills in CZK and its users are European, so
 * the behavioural data stays inside the union and the privacy policy does not
 * have to justify a transfer out of it. A PostHog project's region cannot be
 * changed after it is created — moving to US Cloud means a new project and a
 * new key, not a setting.
 */
const POSTHOG_HOST = "https://eu.i.posthog.com";

/**
 * `EXPO_PUBLIC_*` is inlined into the bundle at build time, so this is whatever
 * the machine that built the app had. Locally that is `.env`; on EAS it is the
 * environment variable of the same name, and it has to be set there separately
 * — a missing one does not fail the build, it just ships an app that never
 * sends anything. The Google Maps key has already gone wrong this way once.
 */
const apiKey = (process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "").trim();

/**
 * Null when there is no key, which is the normal state of a fresh checkout.
 * Every function below no-ops rather than throwing, so a developer without the
 * key runs the app exactly as usual and analytics simply does not exist.
 */
const client = apiKey
  ? new PostHog(apiKey, {
      host: POSTHOG_HOST,
      // Session replay, autocapture, and PostHog's own app-lifecycle events
      // (Application Opened/Backgrounded/Installed/Became Active) all stay
      // off — `profik_client` keeps the lifecycle ones for retention, but
      // this app sends only the events in `AnalyticsEventMap` and nothing
      // else, so the event stream stays readable against the spec instead
      // of buried under one lifecycle row per foreground/background.
      captureAppLifecycleEvents: false,
      enableSessionReplay: false,
    })
  : null;

/** True when a key was compiled in. Read it before promising data exists. */
export const analyticsEnabled = client !== null;

/**
 * Every event the app may send, with the properties each one carries.
 *
 * The map is the contract with the analytics spec ([спец] tabs of the shared
 * sheet — this is the contractor side; `profik_client` carries its own map
 * against the [клиент] tabs), and it is a type rather than a convention on
 * purpose: an event name is a string a call site cannot be trusted to spell,
 * and a typo does not fail — it silently creates a second event that nobody
 * is looking at. Adding a call site means adding a line here first.
 *
 * `undefined` means the event carries no properties of its own; the
 * cross-cutting ones are attached to everything by `registerSuperProperties`.
 */
export interface AnalyticsEventMap {
  onboarding_started: { entry_point: "first_launch" | "reinstall" };
  onboarding_completed: undefined;

  sign_up_started: undefined;
  sign_up_as_guest_clicked: undefined;
  sign_up_completed: undefined;
  login_completed: undefined;

  open_jobs_screen_viewed: {
    jobs_count: number;
    state: "list" | "empty";
    is_authenticated: boolean;
  };
  /**
   * The spec was written against a chip-filter design ("выбор чипа-фильтра
   * (категория и т.п.)"); the sheet that shipped edits price, date and radius
   * together and applies them in one tap rather than one chip at a time. This
   * fires once per active filter *group* when "Show N jobs" is pressed, each
   * carrying its own `filter_name`/`filter_value` and the same
   * `jobs_count_after` — the count the button itself just showed.
   */
  open_jobs_filter_applied: {
    filter_name: "price_range" | "date_range" | "radius";
    filter_value: string;
    jobs_count_after: number;
  };
  job_card_clicked: {
    job_id: string;
    job_category?: string;
    job_price_kc: number;
    job_city?: string | null;
    position_in_list: number;
  };

  job_responce_reply_clicked: undefined;
  job_responce_guest_blocked_viewed: undefined;
  job_responce_insufficient_balance_viewed: undefined;
  job_responce_counter_price_entered: undefined;
  job_responce_sent: {
    job_id: string;
    offer_price_kc: number;
    is_counter_offer: boolean;
    offer_cost_charged_kc: number;
    /**
     * Computed as balance-before minus the charge, not re-read from the
     * server: the mutation's response carries the created offer, not the
     * account's new balance, and a refetch here would be one more request
     * for a number the client can already work out.
     */
    balance_after_kc: number;
  };
  /**
   * Fired from the `type: "job_completed"` push (see
   * `usePushNotifications.ts`), not from viewing the job detail screen — a
   * view-based trigger either fired again on every revisit of an
   * already-completed job, or never fired at all for one nobody reopened
   * at the right moment. `offer_price_kc` is optional because the push
   * payload doesn't carry it.
   */
  job_completed: { job_id: string; offer_price_kc?: number };
  job_responce_message_customer_clicked: undefined;

  chat_messages_inbox_viewed: {
    conversations_count: number;
    unread_count: number;
    /**
     * Two values, not the spec's four (open/in_progress/completed/archive):
     * the Messages tab collapses "open" and "in_progress" into one Active
     * tab (see `MessagesScreen.tsx`) and does not surface Archive. This sends
     * whichever of the two the reader is actually looking at.
     */
    active_tab: "active" | "completed";
    state: "empty" | "list";
  };
  chat_message_sent: undefined;
  /**
   * Only ever fires while the app is in the foreground — that is the one
   * case `Notifications.addNotificationReceivedListener` covers (see
   * `usePushNotifications.ts`). A message that arrives while the app is
   * backgrounded or closed is not counted; there is no reliable hook for
   * that without a background task.
   */
  chat_message_received: undefined;

  balance_topup_screen_viewed: {
    /** The UI calls this "credits" now, not crowns, but the number is still
     *  Kč-denominated — see `formatCredits` in `src/utils/currency.ts`. */
    balance_kc: number;
    entry_point: "profile" | "insufficient_balance" | "manual";
  };
  balance_topup_payment_completed: {
    amount_kc: number;
    balance_after_kc: number;
    /**
     * `POST /payments/topup` returns only a checkout URL, not a transaction
     * id — there is nothing here to send. Add it once the endpoint returns
     * one.
     */
    transaction_id?: string;
  };

  client_rating_sent: { job_id: string; rating: number };
  app_rating_sent: { job_id?: string; rating: number };
}

type EventProps<E extends keyof AnalyticsEventMap> =
  AnalyticsEventMap[E] extends undefined ? [] : [props: AnalyticsEventMap[E]];

/**
 * Sends one event. Never throws: analytics is not worth a crash, and a failure
 * here is reported once to Sentry rather than to the person using the app.
 */
export function track<E extends keyof AnalyticsEventMap>(
  event: E,
  ...args: EventProps<E>
): void {
  if (!client) return;

  try {
    // The map's values are all JSON scalars, which is what PostHog accepts;
    // the cast is only to hand a mapped type to a plain index signature.
    client.capture(
      event,
      args[0] as unknown as Parameters<typeof client.capture>[1],
    );
  } catch (error) {
    logError(error, "analytics:track", { event });
  }
}

/**
 * Properties attached to every event from here on — the "сквозные" column of
 * the spec.
 *
 * `platform` and `app_version` PostHog already sends as `$os` and
 * `$app_version`, and `session_id` as `$session_id`; they are registered again
 * under the spec's names so a query written against the spec finds them
 * without knowing PostHog's own vocabulary. `screen_name` is updated
 * separately as the route changes, and `user_id` / `is_authenticated` by
 * `identifyUser` and `resetAnalytics`.
 *
 * `app: "pro"` is not in the spec sheet — it is not a column of either app's
 * "сквозные" table. It exists because this app and `profik_client` share one
 * PostHog project (same key, same EU host): a handful of event *names*
 * genuinely collide between the two specs (`chat_message_sent`,
 * `app_rating_sent`, `login_completed`, ...), and without something to
 * segment on, a query can't tell which app — or which side of one
 * conversation — an event came from. `profik_client` does not register this
 * property yet; its events read as `app: undefined` until it does.
 */
export function registerSuperProperties(props: {
  platform: string;
  app_version: string;
}): void {
  if (!client) return;

  client
    .register({ ...props, app: "pro", session_id: client.getSessionId() })
    .catch((error: unknown) => {
      logError(error, "analytics:register");
    });
}

/**
 * The screen the person is on, attached to every event sent from it.
 *
 * Also re-reads `client.getSessionId()` here, not just once in
 * `registerSuperProperties` — PostHog rotates its own session id after
 * enough idle time, and a `session_id` registered once at app start would
 * quietly go stale for the rest of that app lifetime otherwise. A route
 * change is a reasonable heartbeat for catching that: it is frequent enough
 * in practice, and cheap to piggy-back on since this call already fires on
 * every one.
 */
export function setScreenName(screen_name: string): void {
  if (!client) return;

  client
    .register({ screen_name, session_id: client.getSessionId() })
    .catch((error: unknown) => {
      logError(error, "analytics:screen");
    });
}

/**
 * The spec lists `balance_kc` as cross-cutting ("где применимо" — where
 * applicable), not as a property of one specific event. Call this whenever
 * the signed-in contractor's balance is read, so it rides along on whatever
 * fires next — a top-up, an offer, a screen view — without every one of
 * those call sites having to know the current balance itself.
 */
export function registerBalance(balance_kc: number): void {
  if (!client) return;

  client.register({ balance_kc }).catch((error: unknown) => {
    logError(error, "analytics:balance");
  });
}

/**
 * Ties the events collected so far to a real account.
 *
 * Called wherever the token changes, beside `profikApi.util.resetApiState()` —
 * the two answer the same question from different sides, and an identity that
 * outlives a sign-out attributes one person's events to another exactly the
 * way a stale cache shows one person's data to another.
 */
export function identifyUser(userId: string): void {
  if (!client) return;

  try {
    client.identify(userId, { is_authenticated: true });
    void client.register({ user_id: userId, is_authenticated: true });
  } catch (error) {
    logError(error, "analytics:identify");
  }
}

/** Drops the identity on sign-out. The next events are anonymous again. */
export function resetAnalytics(): void {
  if (!client) return;

  try {
    client.reset();
    void client.register({ is_authenticated: false });
  } catch (error) {
    logError(error, "analytics:reset");
  }
}
