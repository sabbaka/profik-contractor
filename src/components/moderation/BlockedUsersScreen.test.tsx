import type { BlockedUser } from "@/src/features/moderation/types";
import { apiCalls, mockApi } from "@/src/test-utils/mockApi";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { BlockedUsersScreen } from "./BlockedUsersScreen";

const PETR: BlockedUser = {
  id: "client-7",
  name: "Petr Svoboda",
  avatarUrl: null,
  blockedAt: "2026-10-11T08:00:00.000Z",
};

describe("Blocked", () => {
  it("lists the blocked clients and unblocks one", async () => {
    // Stateful like the server: the unblock empties the list it re-reads.
    let blocked = [PETR];
    const api = mockApi({
      "GET /users/me/blocks": () => ({ body: blocked }),
      "DELETE /users/client-7/block": () => {
        blocked = [];
        return { status: 204 };
      },
    });
    await renderWithProviders(<BlockedUsersScreen />, { authed: true });

    expect(await screen.findByText("Petr Svoboda")).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "Unblock Petr Svoboda" }),
    );

    await waitFor(async () =>
      expect(
        (await apiCalls(api)).filter((r) => r.method === "DELETE"),
      ).toHaveLength(1),
    );
    expect(await screen.findByText("No one is blocked")).toBeOnTheScreen();
  });

  it("says so when nobody is blocked", async () => {
    mockApi({ "GET /users/me/blocks": { body: [] } });
    await renderWithProviders(<BlockedUsersScreen />, { authed: true });

    expect(await screen.findByText("No one is blocked")).toBeOnTheScreen();
  });

  it("offers a retry when the list does not load", async () => {
    let fail = true;
    mockApi({
      "GET /users/me/blocks": () =>
        fail ? { status: 500, body: {} } : { body: [PETR] },
    });
    await renderWithProviders(<BlockedUsersScreen />, { authed: true });

    expect(
      await screen.findByText("We couldn't load the list."),
    ).toBeOnTheScreen();
    fail = false;
    await fireEvent.press(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Petr Svoboda")).toBeOnTheScreen();
  });
});
