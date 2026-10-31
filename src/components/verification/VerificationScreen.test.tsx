import type { MeResponse } from "@/src/api/profikApi";
import i18n from "@/src/i18n";
import { mockApi } from "@/src/test-utils/mockApi";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { act, screen } from "@testing-library/react-native";
import { VerificationScreen } from "./VerificationScreen";

const ME: MeResponse = {
  id: "pro-1",
  email: null,
  role: "contractor",
  name: "Petr Mistr",
  phone: "+420777000222",
  balance: 490,
  identityVerification: {
    status: "not_started",
    verifiedAt: null,
    verifiedUntil: null,
    displayName: null,
  },
};

/**
 * The note above the button is where consent to the face check is given. A
 * face photo is biometric data (GDPR art. 9), so the consent has to say that,
 * and name who processes it — Didit asks its customers to disclose it as the
 * verification provider, and App Review asked who handles face data.
 */
describe("Identity verification consent", () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage("en"));
  });

  it.each([
    ["en", /Didit/, /biometric/i],
    ["cs", /Didit/, /biometrick/i],
    ["uk", /Didit/, /біометричн/i],
  ])(
    "names Didit and biometric data in %s",
    async (language, provider, biometric) => {
      await act(() => i18n.changeLanguage(language));
      mockApi({ "GET /auth/me": { body: ME } });
      await renderWithProviders(<VerificationScreen />, { authed: true });

      const note = await screen.findByText(provider);
      expect(note).toHaveTextContent(biometric);
    },
  );
});
