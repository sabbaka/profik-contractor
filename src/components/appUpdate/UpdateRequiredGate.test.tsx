import { mockApi } from "@/src/test-utils/mockApi";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as Application from "expo-application";
import React from "react";
import { Linking, Platform, Text } from "react-native";

import { UpdateRequiredGate } from "./UpdateRequiredGate";

jest.mock("expo-application", () => ({ nativeApplicationVersion: "1.1.33" }));

const noMinimum = { ios: null, android: null };

const configWith = (proIos: string | null) => ({
  proAppStoreLive: false,
  minSupportedVersion: {
    client: noMinimum,
    contractor: { ios: proIos, android: null },
  },
});

const renderGate = () =>
  renderWithProviders(
    <UpdateRequiredGate>
      <Text>the app</Text>
    </UpdateRequiredGate>,
  );

describe("update required gate", () => {
  beforeAll(() => {
    expect(Platform.OS).toBe("ios");
    expect(Application.nativeApplicationVersion).toBe("1.1.33");
  });

  it("lets the app through when no minimum is set", async () => {
    const spy = mockApi({ "GET /app-config": { body: configWith(null) } });
    await renderGate();

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(screen.getByText("the app")).toBeOnTheScreen();
    expect(screen.queryByText("Update Profik Pro")).toBeNull();
  });

  it("lets the app through on the minimum version itself", async () => {
    const spy = mockApi({ "GET /app-config": { body: configWith("1.1.33") } });
    await renderGate();

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(screen.getByText("the app")).toBeOnTheScreen();
  });

  it("replaces the app with the update screen below the minimum", async () => {
    mockApi({ "GET /app-config": { body: configWith("1.1.34") } });
    await renderGate();

    expect(await screen.findByText("Update Profik Pro")).toBeOnTheScreen();
    expect(screen.queryByText("the app")).toBeNull();
  });

  it("opens this app's store page from the button", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    mockApi({ "GET /app-config": { body: configWith("1.1.34") } });
    await renderGate();

    await fireEvent.press(
      await screen.findByRole("button", { name: "Update" }),
    );

    expect(openURL).toHaveBeenCalledWith(
      "https://apps.apple.com/app/id6787445540",
    );
    openURL.mockRestore();
  });

  // The other app's minimum, and the other platform's, are not this one's.
  it("ignores a minimum set for the client app", async () => {
    const spy = mockApi({
      "GET /app-config": {
        body: {
          proAppStoreLive: true,
          minSupportedVersion: {
            client: { ios: "9.9.9", android: "9.9.9" },
            contractor: { ios: null, android: "9.9.9" },
          },
        },
      },
    });
    await renderGate();

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(screen.getByText("the app")).toBeOnTheScreen();
  });

  // Only a backend that answered, and named a newer minimum, stops anyone.
  it("lets the app through when the request fails", async () => {
    const spy = mockApi({ "GET /app-config": { status: 500, body: {} } });
    await renderGate();

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(screen.getByText("the app")).toBeOnTheScreen();
  });

  it("lets the app through on a backend from before the field", async () => {
    const spy = mockApi({
      "GET /app-config": { body: { proAppStoreLive: false } },
    });
    await renderGate();

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(screen.getByText("the app")).toBeOnTheScreen();
  });

  it("names the build on the request", async () => {
    const spy = mockApi({ "GET /app-config": { body: configWith(null) } });
    await renderGate();

    await waitFor(() => expect(spy).toHaveBeenCalled());
    const request = spy.mock.calls[0][0] as Request;
    // jest's expo-updates reports an update id of its own after the platform.
    expect(request.headers.get("X-Profik-App")).toMatch(
      /^contractor\/1\.1\.33\/ios(\/|$)/,
    );
  });
});
