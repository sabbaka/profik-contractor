import type { MeResponse } from "@/src/api/profikApi";
import { apiCalls, mockApi } from "@/src/test-utils/mockApi";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import { Alert } from "react-native";
import EditProfileRoute from "@/app/(contractor)/profile";

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const ME: MeResponse = {
  id: "pro-1",
  email: null,
  role: "contractor",
  name: "Jana Nováková",
  phone: "+420777000111",
  balance: 495,
};

describe("edit profile: changing the avatar", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("says once, in the app's language, that photo access is needed when it is refused", async () => {
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({ granted: false });
    const api = mockApi({ "GET /auth/me": { body: ME } });
    await renderWithProviders(<EditProfileRoute />, { authed: true });

    await fireEvent.press(await screen.findByText("Change avatar"));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    // The hook already explained what to do; a second "Error / Permission
    // denied" on top of it was untranslated and said nothing new.
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      "Permission required",
      "Please allow photo library access to change your avatar.",
    );
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
    const calls = await apiCalls(api);
    expect(calls.some((c) => c.url.includes("/users/me/avatar"))).toBe(false);
  });
});
