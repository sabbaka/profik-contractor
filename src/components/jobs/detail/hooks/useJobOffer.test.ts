import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useJobOffer } from "./useJobOffer";

const mockCreateOffer = jest.fn();
const mockWithName = jest.fn();
let mockMe: Record<string, unknown> | undefined;
let mockMyOffer: Record<string, unknown> | null | undefined;
let mockIsGuest = false;
let mockQueryArgs: unknown[] = [];

jest.mock("@/src/api/profikApi", () => ({
  useMeQuery: () => ({ data: mockMe }),
  useCreateOfferMutation: () => [mockCreateOffer, { isLoading: false }],
  useGetMyOfferForJobQuery: (...args: unknown[]) => {
    mockQueryArgs = args;
    return { data: mockMyOffer };
  },
}));

jest.mock("@/src/features/auth/hooks/useIsGuest", () => ({
  useIsGuest: () => mockIsGuest,
}));

jest.mock("@/src/features/auth/hooks/useNameGate", () => ({
  useNameGate: () => ({ withName: mockWithName, nameSheetProps: {} }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const CONTRACTOR = { id: "u1", role: "contractor", balance: 100 };
type JobOptions = { jobId: string; jobPrice: number; clientId?: string | null };

const JOB: JobOptions = { jobId: "j1", jobPrice: 1200, clientId: "u2" };

const setUp = async (options: Partial<JobOptions> = {}) =>
  (await renderHook(() => useJobOffer({ ...JOB, ...options }))).result;

/** The name gate normally runs its callback; a nameless account is the case
 *  where it does not, and nothing past it should have happened either way. */
const nameGateRuns = (runs: boolean) =>
  mockWithName.mockImplementation((fn: () => void) => {
    if (runs) fn();
  });

/** The last Alert raised, as its title — every guard reports through one. */
const lastAlertTitle = () => (Alert.alert as jest.Mock).mock.calls.at(-1)?.[0];

beforeEach(() => {
  mockMe = { ...CONTRACTOR };
  mockMyOffer = null;
  mockIsGuest = false;
  mockQueryArgs = [];
  nameGateRuns(true);
  mockCreateOffer.mockReturnValue({ unwrap: async () => ({ id: "o1" }) });
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

/**
 * One phone is one account, so the person reading this screen may be the
 * client who posted the job. The feed hides it and the backend refuses the
 * offer, but a direct link still lands here — and a button that can only fail
 * is worse than no button.
 */
describe("offering on your own job", () => {
  it("is refused when the job is the reader's own", async () => {
    const result = await setUp({ clientId: CONTRACTOR.id });

    expect(result.current.isOwnJob).toBe(true);
    expect(result.current.canOffer).toBe(false);
  });

  it("is allowed on somebody else's", async () => {
    const result = await setUp();

    expect(result.current.isOwnJob).toBe(false);
    expect(result.current.canOffer).toBe(true);
  });

  it("does not mistake a missing owner for a match", async () => {
    const result = await setUp({ clientId: null });
    expect(result.current.isOwnJob).toBe(false);
  });

  it("sends nothing when the reader may not offer", async () => {
    const result = await setUp({ clientId: CONTRACTOR.id });

    await act(async () => {
      result.current.acceptClientPrice();
    });

    expect(mockCreateOffer).not.toHaveBeenCalled();
    expect(lastAlertTitle()).toBe("offer.unauthorizedTitle");
  });

  // The other side of the same gate: signing in from the client app gives a
  // session whose role is not "contractor".
  it("is refused for a session that is not a contractor's", async () => {
    mockMe = { ...CONTRACTOR, role: "client" };
    const result = await setUp();

    expect(result.current.isContractor).toBe(false);
    expect(result.current.canOffer).toBe(false);
  });
});

describe("sending at the client's price", () => {
  it("offers exactly what the client asked for", async () => {
    const result = await setUp();

    await act(async () => {
      result.current.acceptClientPrice();
    });

    expect(mockCreateOffer).toHaveBeenCalledWith({ jobId: "j1", price: 1200 });
  });
});

describe("countering with your own price", () => {
  it("seeds the field with the client's price and clears it again", async () => {
    const result = await setUp();

    await act(async () => result.current.setMode("counter"));
    expect(result.current.price).toBe("1200");

    await act(async () => result.current.setMode("idle"));
    expect(result.current.price).toBe("");
  });

  it("sends the typed price and message", async () => {
    const result = await setUp();

    await act(async () => result.current.setMode("counter"));
    await act(async () => {
      result.current.setPrice("900");
      result.current.setMessage("I can do Thursday");
    });
    await act(async () => {
      result.current.submitOffer();
    });

    expect(mockCreateOffer).toHaveBeenCalledWith({
      jobId: "j1",
      price: 900,
      message: "I can do Thursday",
    });
  });

  it.each([
    ["nothing typed", "", "offer.validation.priceRequired"],
    ["only spaces", "   ", "offer.validation.priceRequired"],
    ["zero", "0", "offer.validation.pricePositive"],
    ["a negative", "-50", "offer.validation.pricePositive"],
    ["not a number", "abc", "offer.validation.pricePositive"],
  ])("refuses %s as a price", async (_label, typed, _key) => {
    const result = await setUp();

    await act(async () => result.current.setMode("counter"));
    await act(async () => result.current.setPrice(typed));
    await act(async () => {
      result.current.submitOffer();
    });

    expect(mockCreateOffer).not.toHaveBeenCalled();
  });

  it("asks for a reason when the price is not the client's", async () => {
    const result = await setUp();

    await act(async () => result.current.setMode("counter"));
    await act(async () => result.current.setPrice("900"));
    await act(async () => {
      result.current.submitOffer();
    });

    expect(mockCreateOffer).not.toHaveBeenCalled();
    expect(lastAlertTitle()).toBe("common.validation");
  });

  // Being asked for your name and only then told the price is missing is the
  // wrong order to learn it in, so validation runs before the sheet can open.
  it("checks the offer before it asks who is sending it", async () => {
    const result = await setUp();

    await act(async () => result.current.setMode("counter"));
    await act(async () => {
      result.current.submitOffer();
    });

    expect(mockWithName).not.toHaveBeenCalled();
  });

  it("sends nothing when the account has no name to send it under", async () => {
    nameGateRuns(false);
    const result = await setUp();

    await act(async () => result.current.setMode("counter"));
    await act(async () => {
      result.current.setPrice("900");
      result.current.setMessage("I can do Thursday");
    });
    await act(async () => {
      result.current.submitOffer();
    });

    expect(mockWithName).toHaveBeenCalled();
    expect(mockCreateOffer).not.toHaveBeenCalled();
  });

  it("clears the form once the offer is away", async () => {
    const result = await setUp();

    await act(async () => result.current.setMode("counter"));
    await act(async () => {
      result.current.setPrice("900");
      result.current.setMessage("I can do Thursday");
    });
    await act(async () => {
      result.current.submitOffer();
    });

    expect(result.current.mode).toBe("idle");
    expect(result.current.price).toBe("");
    expect(result.current.message).toBe("");
  });

  it("keeps the form when the server refuses, and says why", async () => {
    mockCreateOffer.mockReturnValue({
      unwrap: async () => {
        throw { data: { message: "Not enough balance" } };
      },
    });
    const result = await setUp();

    await act(async () => result.current.setMode("counter"));
    await act(async () => {
      result.current.setPrice("900");
      result.current.setMessage("I can do Thursday");
    });
    await act(async () => {
      result.current.submitOffer();
    });

    expect(result.current.price).toBe("900");
    expect((Alert.alert as jest.Mock).mock.calls.at(-1)).toEqual([
      "common.error",
      "Not enough balance",
    ]);
  });
});

/**
 * The fee comes out of the balance, and the backend answers a short one with a
 * 403 that reads like any other failure — so the screen has to know before the
 * button is pressed.
 */
describe("affording the fee", () => {
  it.each([
    [100, true],
    [5, true],
    [4, false],
    [0, false],
  ])("balance of %s can afford an offer: %s", async (balance, expected) => {
    mockMe = { ...CONTRACTOR, balance };
    const result = await setUp();

    expect(result.current.canAffordOffer).toBe(expected);
  });

  it("treats a missing balance as nothing rather than as unknown", async () => {
    mockMe = { id: "u1", role: "contractor" };
    const result = await setUp();

    expect(result.current.balance).toBe(0);
    expect(result.current.canAffordOffer).toBe(false);
  });
});

/**
 * One request answers both "have I offered" and "what was it". The status used
 * to be a hardcoded "pending" alongside a local copy of the offer, which is
 * what let a stale cache show the wrong thing.
 */
describe("an offer already sent", () => {
  it("reads the status off the server rather than assuming one", async () => {
    mockMyOffer = {
      id: "o1",
      price: 900,
      message: "I can do Thursday",
      status: "accepted",
    };
    const result = await setUp();

    expect(result.current.hasOffered).toBe(true);
    expect(result.current.myOfferStatus).toBe("accepted");
    expect(result.current.myOfferPrice).toBe(900);
    expect(result.current.offerIdForChat).toBe("o1");
  });

  it("reads null as no offer yet, not as a failed request", async () => {
    mockMyOffer = null;
    const result = await setUp();

    expect(result.current.hasOffered).toBe(false);
    expect(result.current.offerIdForChat).toBeNull();
  });

  it("does not ask at all for someone who could not have offered", async () => {
    mockIsGuest = true;
    mockMe = undefined;
    await setUp();

    expect(mockQueryArgs[1]).toMatchObject({ skip: true });
  });
});
