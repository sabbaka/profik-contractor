import type { i18n as I18n } from "i18next";
import { FallbackPluralRules, ensurePluralRules } from "./pluralRules";

/**
 * Hermes, the engine the app runs on, ships `Intl` without `PluralRules`.
 * i18next asks for one to choose between `_one`, `_few`, `_many` and
 * `_other`; when the constructor throws it falls back silently to "1 is one,
 * everything else is other", so Czech and Ukrainian read "17 замовлення" and
 * "3 nepřečtených zpráv" on a phone while every test here — running on Node,
 * which has the real thing — stayed green.
 *
 * These tests take `Intl.PluralRules` away to put jest where the phone is.
 */
const nativePluralRules = Intl.PluralRules;
const writableIntl = Intl as { PluralRules?: unknown };

async function withoutNativePluralRules(run: () => Promise<void>) {
  delete writableIntl.PluralRules;
  try {
    await run();
  } finally {
    writableIntl.PluralRules = nativePluralRules;
  }
}

/** The app's own i18n module, loaded fresh as it would be on a phone. */
async function loadAppI18n(): Promise<I18n> {
  let i18n!: I18n;
  jest.isolateModules(() => {
    i18n = jest.requireActual<{ default: I18n }>("./index").default;
  });
  if (!i18n.isInitialized) {
    await new Promise<void>((resolve) =>
      i18n.on("initialized", () => resolve()),
    );
  }
  return i18n;
}

describe("plurals on an engine without Intl.PluralRules", () => {
  it.each([
    ["uk", 1, "1 непрочитане повідомлення"],
    ["uk", 3, "3 непрочитані повідомлення"],
    ["uk", 17, "17 непрочитаних повідомлень"],
    ["uk", 21, "21 непрочитане повідомлення"],
    ["uk", 22, "22 непрочитані повідомлення"],
    ["uk", 111, "111 непрочитаних повідомлень"],
    ["cs", 1, "1 nepřečtená zpráva"],
    ["cs", 3, "3 nepřečtené zprávy"],
    ["cs", 5, "5 nepřečtených zpráv"],
    ["en", 1, "1 unread message"],
    ["en", 2, "2 unread messages"],
  ])("%s picks the right form for %d", async (language, count, expected) => {
    await withoutNativePluralRules(async () => {
      const i18n = await loadAppI18n();
      await i18n.changeLanguage(language);
      expect(i18n.t("messages.unreadSubtitle", { count })).toBe(expected);
    });
  });
});

/**
 * The fallback is only as good as its rules, and Node's ICU is the reference:
 * every whole number up to 10 000 and a spread of fractions must land in the
 * same category it does. A wrong boundary (11–14 in Ukrainian, 2–4 in Czech)
 * fails here instead of on a screen.
 */
describe("FallbackPluralRules against ICU", () => {
  const WHOLE = Array.from({ length: 10_001 }, (_, n) => n);
  const FRACTIONS = [0.5, 1.5, 2.5, 4.5, 5.5, 11.5, 21.5, 0.1, 1.1, 2.25];

  it.each(["en", "cs", "uk"])("%s matches ICU", (language) => {
    const icu = new Intl.PluralRules(language);
    const ours = new FallbackPluralRules(language);
    const mismatches = [...WHOLE, ...FRACTIONS]
      .map((n) => ({ n, icu: icu.select(n), ours: ours.select(n) }))
      .filter((row) => row.icu !== row.ours);
    expect(mismatches).toEqual([]);
  });

  it.each(["en", "cs", "uk"])(
    "%s lists the categories ICU does",
    (language) => {
      const icu = new Intl.PluralRules(language).resolvedOptions();
      const ours = new FallbackPluralRules(language).resolvedOptions();
      expect([...ours.pluralCategories].sort()).toEqual(
        [...icu.pluralCategories].sort(),
      );
    },
  );

  it.each(["en", "cs", "uk"])(
    "%s calls NaN and Infinity other, as ICU does",
    (language) => {
      const icu = new Intl.PluralRules(language);
      const ours = new FallbackPluralRules(language);
      for (const n of [NaN, Infinity, -Infinity]) {
        expect(ours.select(n)).toBe(icu.select(n));
      }
    },
  );

  it("reads a regional tag by its language", () => {
    expect(new FallbackPluralRules("uk-UA").select(3)).toBe("few");
    expect(new FallbackPluralRules(["cs-CZ"]).select(3)).toBe("few");
  });

  // i18next treats a throw as "no rules here" and uses its own fallback.
  it("refuses ordinal rules rather than answering with cardinal ones", () => {
    expect(() => new FallbackPluralRules("en", { type: "ordinal" })).toThrow(
      RangeError,
    );
  });
});

describe("ensurePluralRules", () => {
  it("leaves an engine's own PluralRules alone", () => {
    ensurePluralRules();
    expect(Intl.PluralRules).toBe(nativePluralRules);
  });

  it("installs the fallback where there is none", async () => {
    await withoutNativePluralRules(async () => {
      ensurePluralRules();
      expect(Intl.PluralRules).toBe(FallbackPluralRules);
    });
  });
});
