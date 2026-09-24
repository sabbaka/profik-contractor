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
 * Answers whether it opened, so a caller can say so rather than looking as
 * though the tap did nothing.
 */
export async function openLegalDocument(url: string): Promise<boolean> {
  try {
    if (!(await Linking.canOpenURL(url))) return false;
    await Linking.openURL(url);
    return true;
  } catch (error) {
    logError(error, "legal:openDocument", { url });
    return false;
  }
}
