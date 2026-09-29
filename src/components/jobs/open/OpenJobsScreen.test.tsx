import { profikApi } from "@/src/api/profikApi";
import type { Job } from "@/src/api/types";
import { apiCalls, mockApi } from "@/src/test-utils/mockApi";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import * as analytics from "@/src/utils/analytics";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { OpenJobsScreen } from "./OpenJobsScreen";

// The filters read the location permission on mount. Undetermined, and denied
// when asked, is where a fresh install starts — no coordinates are sent.
jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({
    status: "undetermined",
    granted: false,
    canAskAgain: true,
  })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({
    status: "denied",
    granted: false,
    canAskAgain: false,
  })),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(async () => null),
  Accuracy: { Balanced: 3 },
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
}));

const job = (overrides: Partial<Job>): Job => ({
  id: "job-1",
  title: "Úklid bytu 2+kk",
  description: "Běžný úklid, dvě místnosti a kuchyň.",
  category: "Cleaning",
  price: 1500,
  clientId: "client-1",
  contractorId: null,
  status: "open",
  addressLine: null,
  city: "Praha",
  postalCode: null,
  country: "CZ",
  lat: 50.08,
  lng: 14.42,
  placeId: null,
  propertyType: null,
  serviceType: null,
  roomsCount: null,
  bathroomsCount: null,
  area: null,
  vacuumCleaner: null,
  cleaningSupplies: null,
  ladder: null,
  windowCleaning: null,
  windowCount: null,
  scheduledDates: ["2026-10-05"],
  timeSlot: "morning",
  notes: null,
  createdAt: "2026-09-28T10:00:00.000Z",
  updatedAt: "2026-09-28T10:00:00.000Z",
  ...overrides,
});

const JOBS = [
  job({ id: "job-1", title: "Úklid bytu 2+kk" }),
  job({ id: "job-2", title: "Mytí oken", price: 900, city: "Brno" }),
];

describe("Open Jobs", () => {
  it("lists what the feed returns and counts it", async () => {
    mockApi({ "GET /jobs/open": { body: JOBS } });
    await renderWithProviders(<OpenJobsScreen />);

    expect(await screen.findByText("Úklid bytu 2+kk")).toBeOnTheScreen();
    expect(screen.getByText("Mytí oken")).toBeOnTheScreen();
    // Two is a short page, so there is no "+" — the feed has ended.
    expect(screen.getByText("2 jobs available near you")).toBeOnTheScreen();
  });

  it("asks for the first page of cleaning jobs, with no location", async () => {
    const api = mockApi({ "GET /jobs/open": { body: JOBS } });
    await renderWithProviders(<OpenJobsScreen />);
    await screen.findByText("Úklid bytu 2+kk");

    const [request] = await apiCalls(api);
    const url = new URL(request.url);
    expect(url.pathname).toBe("/jobs/open");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      limit: "20",
      category: "Cleaning",
    });
  });

  it("opens the job that was pressed", async () => {
    mockApi({ "GET /jobs/open": { body: JOBS } });
    await renderWithProviders(<OpenJobsScreen />);

    await fireEvent.press(await screen.findByText("Mytí oken"));

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/(contractor)/jobs/[id]",
      params: { id: "job-2" },
    });
  });

  it("says so when there is nothing to offer on", async () => {
    mockApi({ "GET /jobs/open": { body: [] } });
    await renderWithProviders(<OpenJobsScreen />);

    expect(await screen.findByText("You're all caught up")).toBeOnTheScreen();
    expect(screen.getByText("0 jobs available near you")).toBeOnTheScreen();
  });

  it("shows the error and a retry that asks again", async () => {
    let calls = 0;
    mockApi({
      "GET /jobs/open": () =>
        ++calls === 1
          ? { status: 500, body: { message: "Internal server error" } }
          : { body: JOBS },
    });
    await renderWithProviders(<OpenJobsScreen />);

    expect(await screen.findByText("Couldn't load jobs")).toBeOnTheScreen();
    expect(
      screen.getByText("Check your connection and try again."),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Úklid bytu 2+kk")).not.toBeOnTheScreen();
    // Nothing was loaded, so the header has no count to claim — "0 jobs
    // available" above "Couldn't load jobs" reads as an empty feed.
    expect(screen.queryByText(/available near you/)).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Retry"));

    expect(await screen.findByText("Úklid bytu 2+kk")).toBeOnTheScreen();
    expect(screen.getByText("2 jobs available near you")).toBeOnTheScreen();
  });

  it("keeps the loaded jobs when a later refresh fails, and offers a retry", async () => {
    let fail = false;
    mockApi({
      "GET /jobs/open": () =>
        fail
          ? { status: 500, body: { message: "Internal server error" } }
          : { body: JOBS },
    });
    const { store } = await renderWithProviders(<OpenJobsScreen />);
    expect(await screen.findByText("Úklid bytu 2+kk")).toBeOnTheScreen();

    // What happens behind the contractor's back: an offer sent elsewhere
    // invalidates "Jobs", or the app comes back to the foreground.
    fail = true;
    await act(async () => {
      store.dispatch(profikApi.util.invalidateTags(["Jobs"]));
    });
    await screen.findByRole("button", {
      name: "Couldn't refresh jobs. Tap to try again.",
    });

    expect(screen.getByText("Úklid bytu 2+kk")).toBeOnTheScreen();
    expect(screen.getByText("2 jobs available near you")).toBeOnTheScreen();
    expect(screen.queryByText("Couldn't load jobs")).not.toBeOnTheScreen();

    fail = false;
    await fireEvent.press(
      screen.getByRole("button", {
        name: "Couldn't refresh jobs. Tap to try again.",
      }),
    );

    expect(await screen.findByText("Úklid bytu 2+kk")).toBeOnTheScreen();
    await screen.findByText("2 jobs available near you");
    await waitFor(() =>
      expect(
        screen.queryByText("Couldn't refresh jobs. Tap to try again."),
      ).not.toBeOnTheScreen(),
    );
  });

  it("reports a failed first load as an error, not an empty feed", async () => {
    const track = jest.spyOn(analytics, "track");
    mockApi({
      "GET /jobs/open": { status: 500, body: { message: "Internal error" } },
    });
    await renderWithProviders(<OpenJobsScreen />);
    await screen.findByText("Couldn't load jobs");

    expect(track).toHaveBeenCalledWith("open_jobs_screen_viewed", {
      state: "error",
      is_authenticated: false,
    });
    track.mockRestore();
  });

  it("reports a loaded feed with its count", async () => {
    const track = jest.spyOn(analytics, "track");
    mockApi({ "GET /jobs/open": { body: JOBS } });
    await renderWithProviders(<OpenJobsScreen />);
    await screen.findByText("Úklid bytu 2+kk");

    expect(track).toHaveBeenCalledWith("open_jobs_screen_viewed", {
      jobs_count: 2,
      state: "list",
      is_authenticated: false,
    });
    track.mockRestore();
  });
});
