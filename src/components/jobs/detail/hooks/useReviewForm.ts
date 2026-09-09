import { useCreateReviewMutation } from "@/src/api/profikApi";
import { extractErrorMessage } from "@/src/features/auth/types";
import { logError } from "@/src/utils/logger";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { z } from "zod";

export type ReviewFormValues = {
  rating: number;
  comment?: string;
};

interface UseReviewFormOptions {
  jobId: string;
  /** The rating already given, so re-opening the sheet edits rather than restarts. */
  initialRating?: number;
  onSuccess: () => void;
}

/**
 * The contractor's review of the client on a finished job.
 *
 * The endpoint upserts, so this hook has no separate edit path — submitting a
 * second time rewrites the first review. Zero stars is the only thing it
 * refuses locally; everything else the backend can object to comes back as a
 * code `extractErrorMessage` resolves out of `errors.review.*`.
 */
export const useReviewForm = ({
  jobId,
  initialRating = 0,
  onSuccess,
}: UseReviewFormOptions) => {
  const { t } = useTranslation();
  const [createReview, { isLoading }] = useCreateReviewMutation();

  const reviewSchema = z.object({
    rating: z.number().min(1, t("errors.review.ratingRequired")),
    comment: z.string().optional(),
  });

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: initialRating, comment: "" },
  });

  const submit = form.handleSubmit(async (data) => {
    try {
      await createReview({
        jobId,
        rating: data.rating,
        comment: data.comment?.trim() || undefined,
      }).unwrap();

      Alert.alert(t("review.thankYou"), t("review.submitted"));
      onSuccess();
    } catch (err: unknown) {
      logError(err, "review:submit", { jobId });
      Alert.alert(t("common.error"), extractErrorMessage(err, t));
    }
  });

  return {
    form,
    submit,
    isLoading,
    setValue: form.setValue,
    watch: form.watch,
    reset: form.reset,
  };
};
