import type { MeResponse } from "@/src/api/profikApi";
import type { Job, Offer } from "@/src/api/types";
import { apiCalls, mockApi, type MockRoutes } from "@/src/test-utils/mockApi";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { formatCzk } from "@/src/utils/currency";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import { JobDetail } from "./JobDetail";

// The location card draws a native map, and react-native-maps asserts its
// native half exists at import time. A plain View keeps whatever is inside.
jest.mock("react-native-maps", () => {
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: View, Marker: View };
});

const JOB: Job = {
  id: "job-42",
  title: "Standard Cleaning — Apartment",
  description: "Běžný úklid bytu po nájemnících.",
  category: "Cleaning",
  price: 2400,
  clientId: "client-7",
  contractorId: null,
  status: "open",
  // Stripped for anyone but the owner and the hired contractor.
  addressLine: null,
  city: "Praha",
  postalCode: null,
  country: "CZ",
  lat: 50.08,
  lng: 14.42,
  placeId: null,
  propertyType: "apartment",
  serviceType: "standard",
  roomsCount: "2+kk",
  bathroomsCount: "1",
  area: 54,
  vacuumCleaner: "have",
  cleaningSupplies: "bring",
  ladder: "noneeded",
  windowCleaning: "no",
  windowCount: null,
  scheduledDates: ["2026-10-05"],
  timeSlot: "morning",
  notes: null,
  createdAt: "2026-09-28T10:00:00.000Z",
  updatedAt: "2026-09-28T10:00:00.000Z",
};

const ME: MeResponse = {
  id: "pro-1",
  email: null,
  role: "contractor",
  name: "Jana Nováková",
  phone: "+420777000111",
  balance: 500,
};

const offerFrom = (body: { price: number; message?: string }): Offer => ({
  id: "offer-9",
  jobId: JOB.id,
  contractorId: ME.id,
  price: body.price,
  message: body.message ?? null,
  status: "pending",
  createdAt: "2026-09-29T08:00:00.000Z",
});

/**
 * A signed-in contractor looking at somebody else's open job, not yet offered
 * on. Stateful like the server: once an offer is posted, the lookup the
 * mutation invalidates answers with it.
 */
const routes = (overrides: MockRoutes = {}): MockRoutes => {
  let sent: Offer | null = null;
  return {
    [`GET /jobs/${JOB.id}`]: { body: JOB },
    "GET /auth/me": { body: ME },
    [`GET /offers/job/${JOB.id}/my`]: () => ({ body: sent }),
    "POST /offers": ({ body }) => {
      sent = offerFrom(body as { price: number; message?: string });
      return { status: 201, body: sent };
    },
    ...overrides,
  };
};

/** The offers the screen posted, bodies parsed. */
const offerPosts = async (api: jest.SpyInstance) =>
  (await apiCalls(api)).filter(
    (r) => r.method === "POST" && new URL(r.url).pathname === "/offers",
  );

const alertSpy = () => Alert.alert as jest.Mock;

beforeEach(() => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ id: JOB.id });
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

describe("Job detail", () => {
  it("shows the job, named in the reader's language", async () => {
    mockApi(routes());
    await renderWithProviders(<JobDetail />, { authed: true });

    expect(
      await screen.findByText("Standard Cleaning — Apartment"),
    ).toBeOnTheScreen();
    expect(screen.getByText(formatCzk(2400))).toBeOnTheScreen();
    expect(
      await screen.findByText("Interested in this job?"),
    ).toBeOnTheScreen();
  });

  it("offers a guest the sign-in instead of the offer buttons", async () => {
    const api = mockApi({ [`GET /jobs/${JOB.id}`]: { body: JOB } });
    await renderWithProviders(<JobDetail />);

    expect(await screen.findByText("Sign in to respond")).toBeOnTheScreen();
    expect(screen.queryByText("Interested in this job?")).not.toBeOnTheScreen();
    // No /auth/me and no offer lookup — either would 401 for a guest.
    const calls = await apiCalls(api);
    expect(calls.map((r) => new URL(r.url).pathname)).toEqual([
      `/jobs/${JOB.id}`,
    ]);
  });

  it("says the job failed to load when the server errors", async () => {
    mockApi(routes({ [`GET /jobs/${JOB.id}`]: { status: 500, body: {} } }));
    await renderWithProviders(<JobDetail />, { authed: true });

    expect(await screen.findByText("Failed to load job")).toBeOnTheScreen();
    expect(screen.getByText("Retry")).toBeOnTheScreen();
  });

  describe("sending an offer", () => {
    it("at the client's price posts exactly that price", async () => {
      const api = mockApi(routes());
      await renderWithProviders(<JobDetail />, { authed: true });

      await fireEvent.press(
        await screen.findByRole("button", { name: "Send Response" }),
      );

      await waitFor(async () => expect(await offerPosts(api)).toHaveLength(1));
      const [posted] = await offerPosts(api);
      expect(posted.body).toEqual({ jobId: JOB.id, price: 2400 });
      // The response replaces the buttons with the offer as the server has it.
      expect(await screen.findByText("Your response")).toBeOnTheScreen();
      expect(alertSpy()).toHaveBeenCalledWith(
        "Success",
        "Response sent successfully",
      );
    });

    it("with a counter price posts the typed price and message", async () => {
      const api = mockApi(routes());
      await renderWithProviders(<JobDetail />, { authed: true });

      await fireEvent.press(
        await screen.findByRole("button", {
          name: "Propose a different price",
        }),
      );
      const priceField = screen.getByPlaceholderText("Your price in CZK");
      // Seeded with the client's price so the contractor edits rather than retypes.
      expect(priceField.props.value).toBe("2400");

      await fireEvent.changeText(priceField, "2100");
      await fireEvent.changeText(
        screen.getByPlaceholderText("Explain what's included..."),
        "  Včetně oken, mám vlastní prostředky.  ",
      );
      await fireEvent.press(
        screen.getByRole("button", { name: "Send Response" }),
      );

      await waitFor(async () => expect(await offerPosts(api)).toHaveLength(1));
      const [posted] = await offerPosts(api);
      expect(posted.body).toEqual({
        jobId: JOB.id,
        price: 2100,
        message: "Včetně oken, mám vlastní prostředky.",
      });
      expect(await screen.findByText(formatCzk(2100))).toBeOnTheScreen();
    });

    it("keeps a counter without a reason from being sent", async () => {
      const api = mockApi(routes());
      await renderWithProviders(<JobDetail />, { authed: true });

      await fireEvent.press(
        await screen.findByRole("button", {
          name: "Propose a different price",
        }),
      );
      await fireEvent.changeText(
        screen.getByPlaceholderText("Your price in CZK"),
        "2100",
      );
      const send = screen.getByRole("button", { name: "Send Response" });

      expect(send).toBeDisabled();
      await fireEvent.press(send);
      expect(await offerPosts(api)).toHaveLength(0);
    });

    it("says why the server refused, and keeps the buttons", async () => {
      mockApi(
        routes({
          "POST /offers": {
            status: 403,
            body: {
              statusCode: 403,
              code: "offer.insufficientBalance",
              message: "Insufficient balance",
            },
          },
        }),
      );
      await renderWithProviders(<JobDetail />, { authed: true });

      await fireEvent.press(
        await screen.findByRole("button", { name: "Send Response" }),
      );

      await waitFor(() =>
        expect(alertSpy()).toHaveBeenCalledWith(
          "Error",
          "Your balance is too low to send a response.",
        ),
      );
      expect(screen.getByText("Interested in this job?")).toBeOnTheScreen();
      expect(screen.queryByText("Your response")).not.toBeOnTheScreen();
    });

    it("does not quote a refusal that carries no code", async () => {
      mockApi(
        routes({
          "POST /offers": {
            status: 400,
            body: { statusCode: 400, message: ["price must be a number"] },
          },
        }),
      );
      await renderWithProviders(<JobDetail />, { authed: true });

      await fireEvent.press(
        await screen.findByRole("button", { name: "Send Response" }),
      );

      await waitFor(() =>
        expect(alertSpy()).toHaveBeenCalledWith(
          "Error",
          "Failed to send response",
        ),
      );
    });

    it("sends a contractor who cannot afford it to top up instead", async () => {
      mockApi(routes({ "GET /auth/me": { body: { ...ME, balance: 3 } } }));
      await renderWithProviders(<JobDetail />, { authed: true });

      expect(await screen.findByText("Not enough balance")).toBeOnTheScreen();
      expect(
        screen.queryByRole("button", { name: "Send Response" }),
      ).not.toBeOnTheScreen();
    });
  });

  it("shows an offer already sent instead of the buttons", async () => {
    mockApi(
      routes({
        [`GET /offers/job/${JOB.id}/my`]: {
          body: offerFrom({ price: 2200, message: "Můžu ve čtvrtek." }),
        },
      }),
    );
    await renderWithProviders(<JobDetail />, { authed: true });

    expect(await screen.findByText("Your response")).toBeOnTheScreen();
    expect(screen.getByText(formatCzk(2200))).toBeOnTheScreen();
    expect(screen.getByText("Můžu ve čtvrtek.")).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Send Response" }),
    ).not.toBeOnTheScreen();
  });
});
