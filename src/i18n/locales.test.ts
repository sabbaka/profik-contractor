import cs from "./locales/cs.json";
import en from "./locales/en.json";
import uk from "./locales/uk.json";

/**
 * A key present in one locale file and not the others is a bug, not a to-do —
 * i18next falls back to the key itself, so the reader gets `job.dateFlexible`
 * where a sentence should be. Nothing else checks this: `i18n:check` reads
 * source files for hardcoded copy and never opens the locale files.
 *
 * Counting raw keys would be wrong here, and the counts genuinely disagree:
 * English needs two plural forms, Czech three and Ukrainian four. So the
 * comparison is over base keys with the CLDR suffix stripped, and plural
 * completeness is asserted separately, per language.
 */
type Tree = { [key: string]: string | Tree };

const flatten = (tree: Tree, prefix = ""): string[] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? flatten(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const baseKeys = (tree: Tree) =>
  new Set(flatten(tree).map((key) => key.replace(PLURAL_SUFFIX, "")));

const LOCALES = { en, cs, uk } as unknown as Record<string, Tree>;

/** The plural categories each language's CLDR rules actually use. */
const PLURAL_FORMS: Record<string, string[]> = {
  en: ["one", "other"],
  cs: ["one", "few", "other"],
  uk: ["one", "few", "many"],
};

describe("locale files", () => {
  const english = baseKeys(LOCALES.en);

  it.each(["cs", "uk"])("%s translates every key English has", (language) => {
    const missing = [...english].filter(
      (key) => !baseKeys(LOCALES[language]).has(key),
    );
    expect(missing).toEqual([]);
  });

  // The other direction: a key left behind after English dropped it is copy
  // nobody can reach, and it hides the fact that the screen is gone.
  it.each(["cs", "uk"])("%s carries no key English has lost", (language) => {
    const orphaned = [...baseKeys(LOCALES[language])].filter(
      (key) => !english.has(key),
    );
    expect(orphaned).toEqual([]);
  });

  // "1 nabídek" is the failure mode: a Czech or Ukrainian plural that falls
  // back to `_other` because the form its grammar needs was never written.
  it.each(Object.keys(PLURAL_FORMS))(
    "%s carries every plural form its own grammar needs",
    (language) => {
      const keys = new Set(flatten(LOCALES[language]));
      const counted = flatten(LOCALES.en)
        .filter((key) => key.endsWith("_one"))
        .map((key) => key.replace(/_one$/, ""));

      expect(counted.length).toBeGreaterThan(0);

      const incomplete = counted.filter((base) =>
        PLURAL_FORMS[language].some((form) => !keys.has(`${base}_${form}`)),
      );
      expect(incomplete).toEqual([]);
    },
  );

  it("leaves no key with an empty translation", () => {
    for (const [language, tree] of Object.entries(LOCALES)) {
      const blank = flatten(tree).filter((key) => {
        const value = key
          .split(".")
          .reduce<unknown>((node, part) => (node as Tree)?.[part], tree);
        return typeof value === "string" && value.trim() === "";
      });
      expect({ language, blank }).toEqual({ language, blank: [] });
    }
  });
});
