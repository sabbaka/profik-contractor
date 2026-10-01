import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * Formats a conversation's last-activity timestamp the way a chat list does:
 * a clock time today, "Yesterday", a weekday within the last week, a date
 * beyond that.
 *
 * A hook rather than a plain formatter because "Yesterday" is copy and has to
 * go through `t`, and because the locale has to follow `i18n.language` rather
 * than the device. The clock itself is 24-hour in every language — see below.
 */
export function useConversationTime() {
  const { t, i18n } = useTranslation();

  return useCallback(
    (iso: string): string => {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return "";

      const startOf = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const days = Math.round(
        (startOf(new Date()) - startOf(date)) / 86_400_000,
      );

      if (days <= 0) {
        return date.toLocaleTimeString(i18n.language, {
          hour: "2-digit",
          minute: "2-digit",
          // 24-hour whatever the language. Czech and Ukrainian are already
          // written this way, and English would otherwise be the one locale
          // showing "2:32 PM" in a list read at a glance against the others.
          hour12: false,
        });
      }
      if (days === 1) return t("messages.yesterday");
      if (days < 7) {
        return date.toLocaleDateString(i18n.language, { weekday: "short" });
      }
      return date.toLocaleDateString(i18n.language, {
        day: "numeric",
        month: "short",
      });
    },
    [t, i18n.language],
  );
}
