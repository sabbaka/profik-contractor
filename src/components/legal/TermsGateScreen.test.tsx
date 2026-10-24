import type { MeResponse } from "@/src/api/profikApi";
import { apiCalls, mockApi } from "@/src/test-utils/mockApi";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";

import { TermsGateScreen } from "./TermsGateScreen";

const HOME = "/(contractor)/(tabs)/open";

const ME: MeResponse = {
  id: "pro-1",
  email: null,
  role: "contractor",
  name: "Jana Nováková",
  phone: "+420777000111",
  balance: 500,
  terms: {
    required: true,
    currentVersion: "2026-09-30",
    acceptedVersion: null,
    acceptedAt: null,
    termsUrl: "https://profik.app/obchodni-podminky",
    privacyUrl: "https://profik.app/zasady-ochrany-osobnich-udaju",
    acceptedTermsUrl: null,
  },
};

describe("terms gate: the short version", () => {
  it("does not tell a PRO they must be a registered business", async () => {
    mockApi({ "GET /auth/me": { body: ME } });
    await renderWithProviders(<TermsGateScreen />, { authed: true });

    // The Terms let anyone work independently; "an independent business"
    // read as a requirement to be registered as one, which the Czech and
    // Ukrainian summaries never said.
    expect(await screen.findByText(/you work independently/)).toBeTruthy();
    expect(screen.queryByText(/independent business/)).toBeNull();
  });
});

describe("terms gate: accepting", () => {
  it("unlocks Accept with the checkbox and records the acceptance", async () => {
    const spy = mockApi({
      "GET /auth/me": { body: ME },
      "POST /auth/terms/accept": {
        status: 201,
        body: {
          terms: {
            ...ME.terms,
            required: false,
            acceptedVersion: "2026-09-30",
            acceptedAt: "2026-10-24T16:00:00.000Z",
          },
        },
      },
    });
    await renderWithProviders(<TermsGateScreen />, { authed: true });

    const accept = await screen.findByRole("button", {
      name: "Accept and continue",
    });
    expect(accept).toBeDisabled();

    // The checkbox is the only way in. It lives beside the button now, not at
    // the end of the scroll, but jest lays nothing out — what it can hold is
    // that ticking it is what the button waits for.
    await fireEvent.press(
      screen.getByRole("checkbox", {
        name: "I have read and accept the Terms of Use",
      }),
    );
    expect(accept).toBeEnabled();
    await fireEvent.press(accept);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(HOME));
    const sent = (await apiCalls(spy)).find(
      (call) =>
        call.method === "POST" && call.url.endsWith("/auth/terms/accept"),
    );
    expect(sent?.body).toEqual({ version: "2026-09-30", locale: "en" });
  });
});
