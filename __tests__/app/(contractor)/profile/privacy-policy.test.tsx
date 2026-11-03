import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { screen } from "@testing-library/react-native";
import React from "react";
import PrivacyPolicyScreen from "@/app/(contractor)/profile/privacy-policy";

describe("privacy policy summary", () => {
  // Credits are bought through Stripe on Android and through the App Store on
  // iPhone, where RevenueCat checks each purchase. The list of processors named
  // Stripe alone, and Apple only for maps; the published policy names all three.
  it("names who processes payments on each platform", async () => {
    await renderWithProviders(<PrivacyPolicyScreen />);

    const sharing = screen.getByText(/Stripe \(card payments on Android\)/);
    expect(sharing).toHaveTextContent(/Apple \(App Store payments on iPhone/);
    expect(sharing).toHaveTextContent(
      /RevenueCat \(verifying App Store purchases\)/,
    );
  });
});
