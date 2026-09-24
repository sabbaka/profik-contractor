import { useSendAppFeedbackMutation } from "@/src/api/profikApi";
import { track } from "@/src/utils/analytics";
import { zodResolver } from "@hookform/resolvers/zod";
import Constants from "expo-constants";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { classifyAppFeedbackError } from "../errors";
import type { AppFeedbackErrorKind } from "../types";

const appFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// `POST /feedback/app` is shared with profik_client — CreateAppFeedbackDto
// has no field to say which app a submission came from, only `appVersion`
// (a plain semver string, e.g. "1.1.8"). Prefixing it with "contractor" is
// the only place left to carry that, so whoever reads the feedback table can
// tell the two apps' submissions apart without cross-referencing anything.
function appVersionLabel(): string {
  const version = Constants.expoConfig?.version ?? "unknown";
  return `contractor ${version}`;
}

export type AppFeedbackFormValues = z.infer<typeof appFeedbackSchema>;

export type AppFeedbackResult =
  { success: true } | { success: false; kind: AppFeedbackErrorKind };

interface UseAppFeedbackFormOptions {
  onSuccess: () => void;
}

export function useAppFeedbackForm({ onSuccess }: UseAppFeedbackFormOptions) {
  const [sendAppFeedback, { isLoading }] = useSendAppFeedbackMutation();
  const { i18n } = useTranslation();

  const form = useForm<AppFeedbackFormValues>({
    resolver: zodResolver(appFeedbackSchema),
    defaultValues: { rating: 0, comment: "" },
  });

  const submit = (): Promise<AppFeedbackResult> =>
    new Promise((resolve) => {
      form.handleSubmit(
        async (data) => {
          try {
            await sendAppFeedback({
              rating: data.rating,
              comment: data.comment?.trim() || undefined,
              appVersion: appVersionLabel(),
              locale: i18n.language,
            }).unwrap();
            // No job id: the survey rates the app, and the offer that opened
            // it is not what is being scored.
            track("app_rating_sent", { rating: data.rating });
            onSuccess();
            resolve({ success: true });
          } catch (error: unknown) {
            resolve({ success: false, kind: classifyAppFeedbackError(error) });
          }
        },
        () => resolve({ success: false, kind: "validation" }),
      )();
    });

  return {
    form,
    isLoading,
    submit,
    setValue: form.setValue,
    watch: form.watch,
    reset: form.reset,
  };
}
