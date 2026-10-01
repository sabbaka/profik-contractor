import type { MeResponse } from "@/src/api/profikApi";
import { mockApi } from "@/src/test-utils/mockApi";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { screen, within } from "@testing-library/react-native";
import React from "react";
import ProfileRoute from "@/app/(contractor)/(tabs)/profile";

const ME: MeResponse = {
  id: "pro-1",
  email: null,
  role: "contractor",
  name: "Petr Mistr",
  phone: "+420777000222",
  balance: 490,
};

/**
 * Everything on the profile screen that can be pressed is announced as a
 * button. A plain Pressable is read as its text alone, so a screen-reader user
 * heard "Terms of Use" or the balance with nothing to say it opens anything.
 */
describe("Profile", () => {
  it("announces each menu row as a button", async () => {
    mockApi({ "GET /auth/me": { body: ME } });
    await renderWithProviders(<ProfileRoute />, { authed: true });

    for (const label of [
      "Notifications",
      "Language",
      "Appearance",
      "Terms of Use",
      "Privacy Policy",
      "Help & Support",
      "About",
    ]) {
      expect(
        await screen.findByRole("button", { name: new RegExp(label) }),
      ).toBeOnTheScreen();
    }
  });

  /**
   * The appearance value goes under its label, not beside it. Beside it, on a
   * 320pt-wide phone in Ukrainian, "Як у системі" wrapped inside its 45% and
   * left "Оформлення" too little room, so the label was cut off.
   */
  it("puts the appearance value under its label", async () => {
    mockApi({ "GET /auth/me": { body: ME } });
    await renderWithProviders(<ProfileRoute />, { authed: true });

    const row = await screen.findByRole("button", { name: /Appearance/ });
    const label = within(row).getByText("Appearance");
    expect(within(label.parent!).getByText("System")).toBeOnTheScreen();
  });

  it("announces Edit Profile and the balance card as buttons", async () => {
    mockApi({ "GET /auth/me": { body: ME } });
    await renderWithProviders(<ProfileRoute />, { authed: true });

    expect(
      await screen.findByRole("button", { name: /Edit Profile/ }),
    ).toBeOnTheScreen();
    expect(
      await screen.findByRole("button", { name: /AVAILABLE BALANCE/ }),
    ).toBeOnTheScreen();
  });
});
