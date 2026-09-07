#!/usr/bin/env node
/**
 * Fails when user-facing copy is written straight into a component instead of
 * going through i18n.
 *
 * Deliberately a small script rather than an ESLint plugin: the off-the-shelf
 * rules (i18next/no-literal-string, react-native/no-raw-text) would each be a
 * new dependency and both are noisy on icon names, style tokens and numbers.
 * Kept in step with the same script in the client app; fix a false positive in
 * both or they drift apart.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCOPE = ["src", "app"];

const UI_PROPS =
  "title|subtitle|label|placeholder|description|message|header|cta|buttonText|emptyText";

const ALLOWED = [
  /^Promise$/, // TypeScript generics, not markup
  /^Profik( Pro)?$/, // brand
  /^[\d\s]*Kč$/, // currency suffix and mock amounts, not copy
  /^[a-z]+:[a-z]+$/, // `logError` context tags in `domain:action` form
  /^Reset onboarding$/, // __DEV__-only row on the Profile screen; nobody outside the team sees it
];

// The locale files themselves, and the developer-facing crash screen.
const SKIP_FILES = [/\/i18n\//, /\/ErrorBoundary\.tsx$/];

const NOT_COPY = new RegExp(
  String.raw`^(\s*|[$#/@.].*|https?:.*|[a-z0-9_-]+(\.[a-z0-9_]+)+` +
    String.raw`|[A-Za-z0-9_-]{1,3}|\d+[a-z%]*|[A-Z_]{2,}` +
    String.raw`|(?:row|column|center|flex-\w+|space-\w+|none|auto|hidden|visible|contain|cover|stretch|solid|dashed|bold|normal|italic|small|medium|large|default|primary|secondary|outline|ghost|danger|caption|body\w*|h[1-6]|sm|md|lg|xl)` +
    String.raw`|(?:Inter_\w+|padding|margin|absolute|relative|handled|always|never|on-drag|words|sentences|characters|numeric|email-address|phone-pad|done|next|search|send|go))$`,
);

const isCopy = (raw) => {
  const s = raw.trim();
  if (!s || NOT_COPY.test(s)) return false;
  if (ALLOWED.some((re) => re.test(s))) return false;
  if (!/[A-Za-zА-Яа-я]/.test(s)) return false;
  return /[ ?!.,—:]/.test(s) || /^[A-ZА-Я]/.test(s);
};

/**
 * Labels inside a `__DEV__` block stay English on purpose — see
 * .claude/rules/components.md. Dropping those blocks, along with comments, is
 * a cheap approximation of parsing the file.
 */
const clean = (src) =>
  src
    .replace(/\{__DEV__ \?[\s\S]*?\n\s*\) : null\}/g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

const walk = (dir, out = []) => {
  if (statSync(dir).isFile()) return /\.tsx?$/.test(dir) ? [dir] : out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
};

const findings = [];
for (const scope of SCOPE) {
  for (const file of walk(join(ROOT, scope))) {
    const rel = relative(ROOT, file);
    if (SKIP_FILES.some((re) => re.test(rel))) continue;

    const src = clean(readFileSync(file, "utf8"));
    const hits = [
      // JSX text, including the multi-line form prettier produces. The
      // closing `</` is required: without it every TypeScript generic
      // (`Control<...>`, `Omit<...>`) reads as markup.
      ...src.matchAll(/>\s*([^<>{}]{3,}?)\s*<\//g),
      ...src.matchAll(new RegExp(`\\b(?:${UI_PROPS})="([^"]{2,})"`, "g")),
      ...src.matchAll(/Alert\.alert\(\s*"([^"]{3,})"/g),
      // Copy assembled in a ternary — `{done ? "Saved" : "Save"}`. The JSX
      // rule above cannot see it, because the braces hide it. Both branches
      // are matched; anchoring on `? … :` keeps plain `key: "value"` out.
      ...src.matchAll(/\?\s*"([^"]{3,})"\s*:/g),
      ...src.matchAll(/\?\s*"[^"]*"\s*:\s*"([^"]{3,})"/g),
      // A screen-reader label is copy too, and it is the one kind nobody
      // notices in review — it never shows on screen.
      ...src.matchAll(/accessibilityLabel=\{?\s*[`"]([^`"]{3,})[`"]/g),
      ...src.matchAll(
        /^\s*(?:label|title|description|subtitle):\s*"([^"]{2,})"/gm,
      ),
    ];

    for (const m of hits) {
      const text = m[1].replace(/\s+/g, " ").trim();
      if (!isCopy(text)) continue;
      const line = src.slice(0, m.index).split("\n").length;
      findings.push(`${rel}:${line}  ${text}`);
    }
  }
}

if (findings.length) {
  console.error(
    `Hardcoded user-facing strings (${findings.length}). Move them into src/i18n/locales/{en,cs}.json:\n`,
  );
  for (const f of findings) console.error("  " + f);
  process.exit(1);
}
console.log("i18n check: no hardcoded user-facing strings.");
