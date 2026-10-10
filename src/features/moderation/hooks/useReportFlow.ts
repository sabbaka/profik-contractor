import { useCreateReportMutation } from "@/src/api/profikApi";
import { extractErrorMessage } from "@/src/features/auth/types";
import { logError } from "@/src/utils/logger";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Alert } from "react-native";
import type { ReportReason, ReportTarget } from "../types";

/**
 * Everything a screen needs to let someone report something: which thing is
 * being reported, the sheet that asks why, and the thank-you afterwards.
 *
 * The screen calls `startReport` from wherever the action lives — a chat
 * menu, a review, the job itself — and renders `ReportSheet` with `sheet` and
 * a `Snackbar` with `thanks`. Nothing is hidden or removed on this side after
 * a report: the team acts on it, and the server drops a reported job from the
 * reporter's feed on its own.
 */
export function useReportFlow() {
  const { t } = useTranslation();
  const [target, setTarget] = useState<ReportTarget | null>(null);
  // What the sheet is titled after. Kept past `target` going null, so the
  // sheet does not retitle itself to the default while it animates out.
  const [lastType, setLastType] = useState<ReportTarget["type"]>("user");
  const [thanksVisible, setThanksVisible] = useState(false);
  const [createReport, { isLoading }] = useCreateReportMutation();

  const startReport = useCallback((next: ReportTarget) => {
    setLastType(next.type);
    setTarget(next);
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    if (!open) setTarget(null);
  }, []);

  const onSubmit = useCallback(
    async (reason: ReportReason, comment: string) => {
      if (!target) return;
      const details = comment.trim();
      try {
        await createReport({
          targetType: target.type,
          targetId: target.id,
          reason,
          ...(details ? { comment: details } : {}),
        }).unwrap();
        setTarget(null);
        setThanksVisible(true);
        // The snackbar is a plain view a screen reader never reaches before it
        // hides, so the thank-you is announced as well.
        AccessibilityInfo.announceForAccessibility(t("report.thanks"));
      } catch (err) {
        logError(err);
        Alert.alert(
          t("report.failedTitle"),
          extractErrorMessage(err, t, "report.failedBody"),
        );
      }
    },
    [target, createReport, t],
  );

  const dismissThanks = useCallback(() => setThanksVisible(false), []);

  return {
    startReport,
    sheet: {
      open: target !== null,
      targetType: lastType,
      onOpenChange,
      onSubmit,
      isSubmitting: isLoading,
    },
    thanks: { visible: thanksVisible, onDismiss: dismissThanks },
  };
}
