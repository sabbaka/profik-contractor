import type { MeResponse } from "@/src/api/profikApi";
import { mockApi } from "@/src/test-utils/mockApi";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { screen, within } from "@testing-library/react-native";
import React from "react";
import * as Updates from "expo-updates";
import ProfileRoute from "@/app/(contractor)/(tabs)/profile";

// Mutable, so each test can say which kind of launch it is. The module is
// read at render, not at import, so changing it between tests is enough.
jest.mock("expo-updates", () => ({
  isEnabled: true,
  isEmbeddedLaunch: false,
  updateId: null,
}));
const mockUpdates = Updates as {
  isEnabled: boolean;
  isEmbeddedLaunch: boolean;
  updateId: string | null;
};

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

  /**
   * The footer names the over-the-air update the app is running, so testers
   * and support can see whether one has arrived. A launch from the bundle in
   * the binary shows the version alone.
   */
  it("names the running update after the version", async () => {
    mockUpdates.isEmbeddedLaunch = false;
    mockUpdates.updateId = "f9abcd76-1c2e-4b5a-9d3f-0a1b2c3d4e5f";
    mockApi({ "GET /auth/me": { body: ME } });
    await renderWithProviders(<ProfileRoute />, { authed: true });

    expect(
      await screen.findByText(/^Version .* · update f9abcd76$/),
    ).toBeOnTheScreen();
  });

  it("shows the version alone for the bundle that shipped with the build", async () => {
    mockUpdates.isEmbeddedLaunch = true;
    mockUpdates.updateId = "f9abcd76-1c2e-4b5a-9d3f-0a1b2c3d4e5f";
    mockApi({ "GET /auth/me": { body: ME } });
    await renderWithProviders(<ProfileRoute />, { authed: true });

    expect(await screen.findByText(/^Version /)).toBeOnTheScreen();
    expect(screen.queryByText(/· update/)).toBeNull();
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
