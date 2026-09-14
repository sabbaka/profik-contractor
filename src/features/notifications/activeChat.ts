/**
 * Which offer's chat is on screen right now, if any — module-scope rather
 * than Redux on purpose. The push notification handler
 * (`Notifications.setNotificationHandler` in `usePushNotifications.ts`) runs
 * outside the React tree and has to answer synchronously the instant a
 * notification arrives; a Redux-backed flag would also re-render every
 * subscriber on every chat open/close for a value only one handler ever
 * reads. `app/(contractor)/offer-chat/[offerId].tsx` is the only writer,
 * via `useFocusEffect`.
 */
let activeOfferId: string | null = null;

export function setActiveChat(offerId: string) {
  activeOfferId = offerId;
}

/** Only clears if this screen is still the one that set it — a stale unmount
 *  (e.g. after a quick screen swap) must not clobber a newer chat's flag. */
export function clearActiveChat(offerId: string) {
  if (activeOfferId === offerId) activeOfferId = null;
}

export function isChatOnScreen(offerId: string | undefined): boolean {
  return !!offerId && activeOfferId === offerId;
}
