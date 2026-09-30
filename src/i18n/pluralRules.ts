/**
 * `Intl.PluralRules` for the three languages the app ships, installed only
 * where the engine has none.
 *
 * Hermes ships `Intl` without `PluralRules`. i18next asks for one to choose
 * between `_one`, `_few`, `_many` and `_other`, and when the constructor
 * throws it falls back silently to "1 is one, everything else is other" — so
 * on a phone Czech and Ukrainian got the English rule: "3 nepřečtených zpráv",
 * "17 замовлення". Node has the real thing, so no test saw it.
 *
 * The rules are CLDR's cardinal rules for en, cs and uk, which is all
 * i18next needs here (the apps use no ordinal plurals). `pluralRules.test.ts`
 * checks them against Node's ICU over a wide range of numbers, so a mistake
 * here fails the suite rather than a screen. A fourth language needs its rule
 * added below; until then it gets the English one, which is what it got
 * before this file existed.
 *
 * Both apps carry this file byte for byte; `shared-modules.json` holds them
 * to it.
 */

type Category = "zero" | "one" | "two" | "few" | "many" | "other";

interface Operands {
  /** Integer digits of the absolute value. */
  i: number;
  /** Number of visible fraction digits. */
  v: number;
}

function operands(value: number): Operands {
  const [integer, fraction = ""] = String(Math.abs(value)).split(".");
  return { i: Number(integer), v: fraction.length };
}

interface Rule {
  categories: Category[];
  select(op: Operands): Category;
}

const RULES: Record<string, Rule> = {
  en: {
    categories: ["one", "other"],
    select: ({ i, v }) => (i === 1 && v === 0 ? "one" : "other"),
  },
  cs: {
    categories: ["one", "few", "many", "other"],
    select: ({ i, v }) => {
      if (v !== 0) return "many";
      if (i === 1) return "one";
      if (i >= 2 && i <= 4) return "few";
      return "other";
    },
  },
  uk: {
    categories: ["one", "few", "many", "other"],
    select: ({ i, v }) => {
      if (v !== 0) return "other";
      const mod10 = i % 10;
      const mod100 = i % 100;
      if (mod10 === 1 && mod100 !== 11) return "one";
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return "few";
      }
      return "many";
    },
  },
};

export class FallbackPluralRules {
  private readonly locale: string;
  private readonly rule: Rule;

  constructor(
    locales?: string | readonly string[],
    options?: { type?: "cardinal" | "ordinal" },
  ) {
    // Ordinal rules differ ("1st", "2nd") and nothing here asks for them.
    // Throwing puts i18next back on its own fallback, as before this file.
    if (options?.type === "ordinal") {
      throw new RangeError("Ordinal plural rules are not provided");
    }
    const requested = (Array.isArray(locales) ? locales[0] : locales) ?? "en";
    const language = String(requested).split(/[-_]/)[0].toLowerCase();
    this.locale = RULES[language] ? language : "en";
    this.rule = RULES[this.locale];
  }

  select(value: number): Category {
    const n = Number(value);
    // ICU answers "other" for NaN and Infinity in every language here. A count
    // is a plain number; exponent notation (1e-7) is not handled.
    if (!Number.isFinite(n)) return "other";
    return this.rule.select(operands(n));
  }

  resolvedOptions() {
    return {
      locale: this.locale,
      type: "cardinal" as const,
      pluralCategories: [...this.rule.categories],
    };
  }

  static supportedLocalesOf(locales?: string | readonly string[]): string[] {
    if (locales === undefined) return [];
    const list = typeof locales === "string" ? [locales] : [...locales];
    return list.filter(
      (locale) => !!RULES[locale.split(/[-_]/)[0].toLowerCase()],
    );
  }
}

/** Installs the fallback when the engine has no `Intl.PluralRules`. */
export function ensurePluralRules(): void {
  if (typeof Intl === "undefined" || typeof Intl.PluralRules === "function") {
    return;
  }
  (Intl as { PluralRules: unknown }).PluralRules = FallbackPluralRules;
}
