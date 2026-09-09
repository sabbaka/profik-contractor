import { useGetJobReviewsQuery, useMeQuery } from "@/src/api/profikApi";
import type { JobStatus, Review } from "@/src/api/types";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import { useMemo } from "react";

interface UseJobReviewOptions {
  jobId: string;
  jobStatus: JobStatus;
  /** `job.contractorId` — whoever's offer was accepted, null until one is. */
  contractorId: string | null;
}

/**
 * The review a client left about this contractor for one finished job.
 *
 * Only the contractor who actually did the work has a review to see, so the
 * gate is the job's own `contractorId` rather than `hasOffered` — somebody
 * whose offer was declined would otherwise query the endpoint and be told
 * there is no review yet, which reads as "the client hasn't got round to it"
 * for work they never did.
 *
 * `GET /jobs/:id/reviews` returns both directions and filters by nothing, so
 * the one addressed to us is picked off `targetId` here.
 */
export const useJobReview = ({
  jobId,
  jobStatus,
  contractorId,
}: UseJobReviewOptions) => {
  const isGuest = useIsGuest();
  const { data: me } = useMeQuery(undefined, { skip: isGuest });

  const isReviewable =
    jobStatus === "completed" && !!me && contractorId === me.id;

  // Refetched on mount like the job itself: a client typically rates the work
  // some time after finishing it, and the cached "not yet" would otherwise
  // outlive the review.
  const { data: reviews, isLoading } = useGetJobReviewsQuery(jobId, {
    skip: !isReviewable,
    refetchOnMountOrArgChange: true,
  });

  const review = useMemo<Review | null>(
    () => reviews?.find((r) => r.targetId === me?.id) ?? null,
    [reviews, me?.id],
  );

  return { isReviewable, review, isLoading };
};
