import type { MeResponse } from "@/src/api/profikApi";
import { mockApi } from "@/src/test-utils/mockApi";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { screen } from "@testing-library/react-native";
import React from "react";

import { TermsGateScreen } from "./TermsGateScreen";

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
