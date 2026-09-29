import type { MeResponse } from "@/src/api/profikApi";
import type { OfferMessage } from "@/src/api/types";
import { apiCalls, mockApi, type MockRoutes } from "@/src/test-utils/mockApi";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { formatCzk } from "@/src/utils/currency";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import OfferChatRoute from "@/app/(contractor)/offer-chat/[offerId]";

// Lives here rather than beside the route: every file under app/ is a route to
// expo-router, a test file included. offerChatRoute.ts, next door, is what
// builds the params this screen reads.

const OFFER_ID = "offer-9";

const ME: MeResponse = {
  id: "pro-1",
  email: null,
  role: "contractor",
  name: "Jana Nováková",
  phone: "+420777000111",
  balance: 495,
};

const message = (
  id: string,
  senderId: string,
  content: string,
  createdAt: string,
): OfferMessage => ({ id, offerId: OFFER_ID, senderId, content, createdAt });

// Oldest first, as the API returns them.
const HISTORY = [
  message(
    "m1",
    "client-7",
    "Dobrý den, zvládnete to v pondělí dopoledne?",
    "2026-09-29T08:00:00.000Z",
  ),
  message("m2", ME.id, "Ano, v 9:00 můžu.", "2026-09-29T08:05:00.000Z"),
];

/**
 * A chat on a pending offer. Stateful like the server: a sent message is in
 * the history the invalidated query reads back.
 */
const routes = (
  initial: OfferMessage[],
  overrides: MockRoutes = {},
): MockRoutes => {
  const history = [...initial];
  return {
    "GET /auth/me": { body: ME },
    [`GET /offers/${OFFER_ID}/messages`]: () => ({ body: history }),
    [`POST /offers/${OFFER_ID}/messages/read`]: { status: 204 },
    [`POST /offers/${OFFER_ID}/messages`]: ({ body }) => {
      const sent = message(
        `m${history.length + 1}`,
        ME.id,
        (body as { content: string }).content,
        "2026-09-29T09:00:00.000Z",
      );
      history.push(sent);
      return { status: 201, body: sent };
    },
    ...overrides,
  };
};

/** What the screen posted to `path`, bodies parsed. */
const posts = async (api: jest.SpyInstance, path: string) =>
  (await apiCalls(api)).filter(
    (r) => r.method === "POST" && new URL(r.url).pathname === path,
  );

// A refused send goes to logError, which prints it. Expected in the tests that
// provoke one, and noise in the output.
let consoleError: jest.SpyInstance | undefined;
const silenceLoggedError = () => {
  consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
};
afterEach(() => {
  consoleError?.mockRestore();
  consoleError = undefined;
});

beforeEach(() => {
  jest.mocked(useLocalSearchParams).mockReturnValue({
    offerId: OFFER_ID,
    jobId: "job-42",
    jobTitle: "Standard Cleaning — Apartment",
    serviceType: "standard",
    propertyType: "apartment",
    offerPrice: "2200",
    offerStatus: "pending",
    jobStatus: "open",
    clientName: "Petr Svoboda",
  });
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

describe("Offer chat", () => {
  it("shows the history, the client and the job it is about", async () => {
    mockApi(routes(HISTORY));
    await renderWithProviders(<OfferChatRoute />, { authed: true });

    expect(
      await screen.findByText("Dobrý den, zvládnete to v pondělí dopoledne?"),
    ).toBeOnTheScreen();
    expect(screen.getByText("Ano, v 9:00 můžu.")).toBeOnTheScreen();
    expect(screen.getByText("Petr Svoboda")).toBeOnTheScreen();
    expect(
      screen.getByText(`Your response ${formatCzk(2200)}`),
    ).toBeOnTheScreen();
  });

  it("marks the chat read up to the newest message", async () => {
    const api = mockApi(routes(HISTORY));
    await renderWithProviders(<OfferChatRoute />, { authed: true });

    await waitFor(async () =>
      expect(
        await posts(api, `/offers/${OFFER_ID}/messages/read`),
      ).toHaveLength(1),
    );
    const [read] = await posts(api, `/offers/${OFFER_ID}/messages/read`);
    expect(read.body).toEqual({
      lastReadMessageId: "m2",
    });
  });

  it("opens the job from the banner", async () => {
    mockApi(routes(HISTORY));
    await renderWithProviders(<OfferChatRoute />, { authed: true });

    await fireEvent.press(
      await screen.findByRole("button", { name: "Open job details" }),
    );

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/(contractor)/jobs/[id]",
      params: { id: "job-42" },
    });
  });

  it("invites the first message when there is none", async () => {
    const api = mockApi(routes([]));
    await renderWithProviders(<OfferChatRoute />, { authed: true });

    expect(await screen.findByText("Start the conversation")).toBeOnTheScreen();
    // Nothing to mark read in an empty chat.
    expect(await posts(api, `/offers/${OFFER_ID}/messages/read`)).toHaveLength(
      0,
    );
  });

  it("sends the trimmed message and shows it once the server has it", async () => {
    const api = mockApi(routes(HISTORY));
    await renderWithProviders(<OfferChatRoute />, { authed: true });
    await screen.findByText("Ano, v 9:00 můžu.");

    const send = screen.getByRole("button", { name: "Send message" });
    // Nothing typed yet, so nothing to send.
    expect(send).toBeDisabled();

    const field = screen.getByPlaceholderText("Write a message...");
    await fireEvent.changeText(field, "  Přinesu i vysavač.  ");
    await fireEvent.press(send);

    await waitFor(async () =>
      expect(await posts(api, `/offers/${OFFER_ID}/messages`)).toHaveLength(1),
    );
    const [sent] = await posts(api, `/offers/${OFFER_ID}/messages`);
    expect(sent.body).toEqual({
      content: "Přinesu i vysavač.",
    });
    expect(await screen.findByText("Přinesu i vysavač.")).toBeOnTheScreen();
    expect(field.props.value).toBe("");
  });

  it("closes the composer when the server says the conversation is over", async () => {
    silenceLoggedError();
    mockApi(
      routes(HISTORY, {
        [`POST /offers/${OFFER_ID}/messages`]: {
          status: 403,
          body: {
            statusCode: 403,
            code: "offer.conversationClosed",
            message: "Conversation is closed",
          },
        },
      }),
    );
    await renderWithProviders(<OfferChatRoute />, { authed: true });
    await screen.findByText("Ano, v 9:00 můžu.");

    await fireEvent.changeText(
      screen.getByPlaceholderText("Write a message..."),
      "Jste tam?",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Send message" }));

    expect(
      await screen.findByText("This conversation is closed"),
    ).toBeOnTheScreen();
    expect(
      screen.queryByPlaceholderText("Write a message..."),
    ).not.toBeOnTheScreen();
    // The history stays readable.
    expect(screen.getByText("Ano, v 9:00 můžu.")).toBeOnTheScreen();
  });

  it("keeps the draft when sending fails for any other reason", async () => {
    silenceLoggedError();
    mockApi(
      routes(HISTORY, {
        [`POST /offers/${OFFER_ID}/messages`]: {
          status: 500,
          body: { statusCode: 500, message: "Internal server error" },
        },
      }),
    );
    await renderWithProviders(<OfferChatRoute />, { authed: true });
    await screen.findByText("Ano, v 9:00 můžu.");

    const field = screen.getByPlaceholderText("Write a message...");
    await fireEvent.changeText(field, "Jste tam?");
    await fireEvent.press(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Message not sent",
        "Please try again.",
      ),
    );
    expect(field.props.value).toBe("Jste tam?");
  });
});
