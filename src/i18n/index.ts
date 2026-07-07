import * as Localization from "expo-localization";
import baseI18n from "i18next";
import { initReactI18next } from "react-i18next";

import { getStoredLanguage } from "../utils/languageStorage";
import cs from "./locales/cs.json";
import en from "./locales/en.json";

const resources = {
  en: { translation: en },
  cs: { translation: cs },
} as const;

const i18n = baseI18n;
const locale = (Localization.getLocales?.()[0]?.languageCode ||
  "en") as keyof typeof resources;

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: "v4",
      resources,
      lng: resources[locale] ? locale : "en",
      fallbackLng: "en",
      defaultNS: "translation",
      ns: ["translation"],
      interpolation: {
        escapeValue: false,
      },
    })
    .catch(() => {});

  // A user-picked language (set from the Profile screen) overrides the
  // device locale once loaded from storage.
  getStoredLanguage().then((stored) => {
    if (stored && stored !== i18n.language) {
      i18n.changeLanguage(stored).catch(() => {});
    }
  });
}

export default i18n;
