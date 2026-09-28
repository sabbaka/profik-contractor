import { Linking } from "react-native";

import { logError } from "./logger";

/**
 * Opens one of the published legal documents in the phone's browser.
 *
 * The Terms and the Privacy Policy are not carried inside the app. There is one
 * binding text, published at profik.app, and a copy in the bundle would be a
 * second edition to keep in step with it — which is exactly how an app ends up
 * showing something other than what people agreed to.
 *
 * No `canOpenURL` guard, deliberately. For an `https` URL that check answers
 * from Android's package visibility rather than from whether a browser exists,
 * and neither app declares a `queries` block — so it can answer false on a
 * phone that would have opened the link perfectly well. The cost of that
 * false negative lands in the worst possible place: someone being asked to
 * accept a document the app has just told them it cannot show. `openURL` either
 * opens or throws, and throwing is what the caller already handles.
 *
 * Answers whether it opened, so a caller can say so rather than looking as
 * though the tap did nothing.
 */
export async function openLegalDocument(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch (error) {
    logError(error, "legal:openDocument", { url });
    return false;
  }
}
