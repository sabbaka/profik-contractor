import { useGetJobReviewsQuery, useMeQuery } from "@/src/api/profikApi";
import type { JobStatus, Review } from "@/src/api/types";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import { useCallback, useMemo, useState } from "react";

interface UseJobReviewOptions {
  jobId: string;
  jobStatus: JobStatus;
  /** `job.contractorId` — whoever's offer was accepted, null until one is. */
  contractorId: string | null;
}

/**
 * Both directions of a finished job's reviews: the one the client left about
 * this contractor, and the one the contractor leaves about the client.
 *
 * Only the contractor who actually did the work has either, so the gate is the
 * job's own `contractorId` rather than `hasOffered` — somebody whose offer was
 * declined would otherwise query the endpoint and be told there is no review
 * yet, which reads as "the client hasn't got round to it" for work they never
 * did.
 *
 * `GET /jobs/:id/reviews` returns both directions and filters by nothing, so
 * they are picked apart here: `targetId` is the one addressed to us, `authorId`
 * the one we wrote. Re-rating edits that second one — the endpoint upserts —
 * so the sheet opens pre-filled with it.
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

  const myReview = useMemo<Review | null>(
    () => reviews?.find((r) => r.authorId === me?.id) ?? null,
    [reviews, me?.id],
  );

  const [isSheetOpen, setSheetOpen] = useState(false);
  // The star that was tapped, so the sheet opens on that rating rather than
  // making the contractor pick it a second time.
  const [pendingRating, setPendingRating] = useState(0);

  const openSheetAt = useCallback((star: number) => {
    setPendingRating(star);
    setSheetOpen(true);
  }, []);

  return {
    isReviewable,
    review,
    myReview,
    isLoading,
    reviewSheetProps: {
      open: isSheetOpen,
      onOpenChange: setSheetOpen,
      jobId,
      initialRating: pendingRating,
    },
    openSheetAt,
  };
};
