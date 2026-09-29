import { mockApi } from "@/src/test-utils/mockApi";
import {
  makeTestStore,
  TEST_TOKEN,
} from "@/src/test-utils/renderWithProviders";
import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import type { AuthResult } from "../types";
import { useEditProfileForm } from "./useEditProfileForm";

async function saveProfile(): Promise<AuthResult> {
  const store = makeTestStore({ auth: { token: TEST_TOKEN } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const view = await renderHook(
    () => useEditProfileForm({ name: "Petr", email: "petr@example.com" }),
    { wrapper },
  );
  let result: AuthResult | undefined;
  await act(async () => {
    result = await view.result.current.submit();
  });
  return result!;
}

describe("useEditProfileForm", () => {
  it("says the profile could not be saved when the refusal has no code", async () => {
    mockApi({
      "PATCH /users/me": {
        status: 500,
        body: { statusCode: 500, message: "Internal server error" },
      },
    });

    expect(await saveProfile()).toEqual({
      success: false,
      error: "Failed to update profile",
    });
  });

  it("still words a coded refusal as itself", async () => {
    mockApi({
      "PATCH /users/me": {
        status: 409,
        body: {
          statusCode: 409,
          code: "user.emailInUse",
          message: "Email already in use",
        },
      },
    });

    expect(await saveProfile()).toEqual({
      success: false,
      error: "That email is already in use.",
    });
  });
});
