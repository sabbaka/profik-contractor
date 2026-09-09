import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { File as ExpoFile } from "expo-file-system";
import type {
  AuthResponse,
  OtpRequestResponse,
  RequestOtpParams,
  UploadAvatarParams,
  VerifyOtpParams,
} from "../features/auth/types";
import i18n from "../i18n";
import { logout } from "../store/authSlice";
import { forwardIdCursor } from "./pagination";
import type {
  ConversationBucket,
  ConversationList,
  GetOfferedJobsParams,
  Job,
  Offer,
  OfferedJobItem,
  OfferMessage,
  Review,
  UnreadSummary,
} from "./types";

/** Conversations fetched per page by the Messages tab. */
export const CONVERSATIONS_PAGE_SIZE = 20;

/** Open jobs fetched per page by the Open tab. */
export const OPEN_JOBS_PAGE_SIZE = 20;

/** Offered jobs fetched per page by the My jobs tab. */
export const OFFERED_JOBS_PAGE_SIZE = 20;

// Shape returned by GET /auth/me and PATCH /users/me.
export interface MeResponse {
  id: string;
  /** Null until the user sets one — an OTP account starts without an email. */
  email: string | null;
  role: string;
  /** Null until the user sets one. Render a fallback, never the raw value. */
  name: string | null;
  phone: string;
  balance: number;
  avatarUrl?: string | null;
  /**
   * Unread offer messages across every conversation. Only `GET /auth/me`
   * populates it — it rides along so a cold start can render the Messages
   * badge without a second request. Absent from the login/signup responses.
   */
  unreadMessages?: number;
}

// Best-effort MIME inference for image URIs returned by expo-image-picker
// (we always have a local file:// URI, so the extension is reliable).
function guessMimeFromUri(uri: string): string {
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
    case "heif":
      return "image/heic";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

// Base query with auth header
const API_URL = process.env.EXPO_PUBLIC_API_URL as string;
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // Read off the i18next singleton rather than a hook: prepareHeaders runs
    // outside the React tree. The server needs this for the one thing it sends
    // before an account exists — the SMS carrying the sign-in code.
    headers.set("Accept-Language", i18n.language);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  // Only force a logout when there is a token to invalidate — guests may
  // legitimately receive 401s from protected endpoints while browsing.
  const hasToken = !!(api.getState() as any).auth?.token;
  if (
    result &&
    "error" in result &&
    (result as any).error?.status === 401 &&
    hasToken
  ) {
    api.dispatch(logout());
    // Without this the previous user's cached /auth/me — name, email, balance —
    // survives the expiry and is rendered to whoever signs in next.
    api.dispatch(profikApi.util.resetApiState());
  }
  return result as any;
};

export const profikApi = createApi({
  reducerPath: "profikApi",
  tagTypes: [
    "Jobs",
    "OfferMessages",
    "Offers",
    "Conversations",
    "Unread",
    "Reviews",
  ],
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    // Passwordless sign-in. One pair of endpoints serves both login and
    // registration: an unknown phone creates the account on verify, a known
    // one signs in. The request answers identically either way, so it cannot
    // be used to probe which numbers are registered.
    requestOtpCode: builder.mutation<OtpRequestResponse, RequestOtpParams>({
      query: (body) => ({
        url: "/auth/otp/request-code",
        method: "POST",
        body,
      }),
    }),
    verifyOtpCode: builder.mutation<AuthResponse, VerifyOtpParams>({
      query: (body) => ({ url: "/auth/otp/verify", method: "POST", body }),
    }),
    me: builder.query<MeResponse, void>({
      query: () => ({ url: "/auth/me", method: "GET" }),
    }),
    /**
     * The Open tab's feed, paged as the contractor scrolls.
     *
     * The endpoint answers with a plain array rather than a `{ items,
     * nextCursor }` envelope, so the cursor is the last job's own `id` and the
     * end of the list is a page shorter than `OPEN_JOBS_PAGE_SIZE` — see
     * `forwardIdCursor`. An `infiniteQuery` rather than a hand-rolled merge for
     * the same reason as `getConversations` below: anything that invalidates
     * "Jobs" must refetch every loaded page, not just the current cursor's.
     */
    getOpenJobs: builder.infiniteQuery<Job[], void, string | null>({
      infiniteQueryOptions: forwardIdCursor<Job>(
        OPEN_JOBS_PAGE_SIZE,
        (job) => job.id,
      ),
      query: ({ pageParam }) => {
        const params = new URLSearchParams({
          limit: String(OPEN_JOBS_PAGE_SIZE),
        });
        if (pageParam) params.set("cursor", pageParam);
        return { url: `/jobs/open?${params.toString()}`, method: "GET" };
      },
      providesTags: ["Jobs"],
    }),
    /**
     * The My jobs tab, one cache entry per filter, paged as the list scrolls.
     *
     * The backend pages over the *jobs*, so the cursor is `item.job.id` — not
     * an id on the wrapper. As with `/jobs/open` the response is a plain array
     * rather than a `{ items, nextCursor }` envelope, so the end of the list
     * is a page shorter than `OFFERED_JOBS_PAGE_SIZE`.
     */
    getOfferedJobs: builder.infiniteQuery<
      OfferedJobItem[],
      GetOfferedJobsParams,
      string | null
    >({
      infiniteQueryOptions: forwardIdCursor<OfferedJobItem>(
        OFFERED_JOBS_PAGE_SIZE,
        (item) => item.job.id,
      ),
      query: ({ queryArg, pageParam }) => {
        const params = new URLSearchParams({
          filter: queryArg.filter,
          limit: String(OFFERED_JOBS_PAGE_SIZE),
        });
        if (pageParam) params.set("cursor", pageParam);
        return { url: `/jobs/offered?${params.toString()}`, method: "GET" };
      },
      providesTags: ["Jobs", "Offers"],
    }),
    getJobById: builder.query<Job, string>({
      query: (id) => ({ url: `/jobs/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Jobs", id } as any],
    }),
    // Both directions of a completed job's reviews, newest last. The endpoint
    // does not filter by participant, so the caller picks the one addressed to
    // them off `targetId`.
    getJobReviews: builder.query<Review[], string>({
      query: (jobId) => ({ url: `/jobs/${jobId}/reviews`, method: "GET" }),
      providesTags: (_result, _error, jobId) => [
        { type: "Reviews", id: jobId } as any,
      ],
    }),
    /**
     * Leave — or edit — the review this contractor writes about the client.
     *
     * The backend upserts: submitting again for the same job rewrites the
     * previous rating instead of failing, so the sheet doubles as the edit
     * screen. `targetId` is derived from the job server-side, which is why
     * only the rating and comment go up.
     *
     * The response is typed without `author` on purpose: the spec promises a
     * full `JobReviewResponseDto`, but the service returns the bare row
     * without the author include that `GET /jobs/:id/reviews` has. Nothing
     * reads it anyway — the list is refetched through the invalidated tag.
     */
    createReview: builder.mutation<
      Omit<Review, "author">,
      { jobId: string; rating: number; comment?: string }
    >({
      query: ({ jobId, rating, comment }) => ({
        url: `/jobs/${jobId}/reviews`,
        method: "POST",
        body: { rating, comment },
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        { type: "Reviews", id: jobId } as any,
        { type: "Jobs", id: jobId } as any,
      ],
    }),
    hasOffered: builder.query<{ hasOffered: boolean }, string>({
      query: (jobId) => ({
        url: `/offers/job/${jobId}/has-offered`,
        method: "GET",
      }),
    }),
    getMyOfferForJob: builder.query<Offer, string>({
      query: (jobId) => ({ url: `/offers/job/${jobId}/my`, method: "GET" }),
      providesTags: (_result, _error, jobId) => [
        { type: "Offers", id: jobId } as any,
      ],
    }),
    createOffer: builder.mutation<
      { id: string },
      { jobId: string; price: number; message?: string }
    >({
      query: (body) => ({ url: "/offers", method: "POST", body }),
      invalidatesTags: (_result, _error, { jobId }) => [
        { type: "Offers", id: jobId } as any,
        "Conversations",
      ],
    }),
    getOfferMessages: builder.query<OfferMessage[], string>({
      query: (offerId) => ({
        url: `/offers/${offerId}/messages`,
        method: "GET",
      }),
      providesTags: (_result, _error, offerId) => [
        { type: "OfferMessages", id: offerId } as any,
      ],
    }),
    /**
     * The Messages list, one cache entry per bucket.
     *
     * An `infiniteQuery` rather than a plain query with a merged cursor: the
     * list is invalidated whenever a chat is read, and the hand-rolled merge
     * pattern refetches only the page matching the *current* cursor — the
     * earlier pages keep their stale unread counts and the refetched page is
     * appended a second time. `infiniteQuery` refetches every loaded page.
     */
    getConversations: builder.infiniteQuery<
      ConversationList,
      { bucket?: ConversationBucket },
      string | null
    >({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
      query: ({ queryArg, pageParam }) => {
        const params = new URLSearchParams({ limit: String(CONVERSATIONS_PAGE_SIZE) });
        if (queryArg.bucket) params.set("bucket", queryArg.bucket);
        if (pageParam) params.set("cursor", pageParam);
        return {
          url: `/offers/conversations?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Conversations"],
    }),
    getUnreadCount: builder.query<UnreadSummary, void>({
      query: () => ({ url: "/offers/unread-count", method: "GET" }),
      providesTags: ["Unread"],
    }),
    markConversationRead: builder.mutation<
      void,
      { offerId: string; lastReadMessageId: string }
    >({
      query: ({ offerId, lastReadMessageId }) => ({
        url: `/offers/${offerId}/messages/read`,
        method: "POST",
        body: { lastReadMessageId },
      }),
      invalidatesTags: ["Conversations", "Unread"],
    }),
    markAllRead: builder.mutation<void, { bucket?: string } | void>({
      query: (args) => ({
        url: "/offers/messages/read-all",
        method: "POST",
        body: args?.bucket ? { bucket: args.bucket } : {},
      }),
      invalidatesTags: ["Conversations", "Unread"],
    }),
    sendOfferMessage: builder.mutation<
      OfferMessage,
      { offerId: string; content: string }
    >({
      query: ({ offerId, content }) => ({
        url: `/offers/${offerId}/messages`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_result, _error, { offerId }) => [
        { type: "OfferMessages", id: offerId } as any,
        "Conversations",
      ],
    }),
    topupBalance: builder.mutation<
      { url: string },
      { amount: number; returnUrl?: string }
    >({
      query: ({ amount, returnUrl }) => ({
        url: "/payments/topup",
        method: "POST",
        body: { amount, returnUrl },
      }),
    }),
    registerPushToken: builder.mutation<
      void,
      { pushToken: string; language: string }
    >({
      query: ({ pushToken, language }) => ({
        url: "/users/me/push-token",
        method: "PATCH",
        body: { pushToken, language },
      }),
    }),
    unregisterPushToken: builder.mutation<void, void>({
      query: () => ({
        url: "/users/me/push-token",
        method: "DELETE",
      }),
    }),
    deleteAccount: builder.mutation<void, void>({
      query: () => ({ url: "/users/me", method: "DELETE" }),
    }),
    updateProfile: builder.mutation<
      MeResponse,
      { name?: string; email?: string }
    >({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        // Merge, never replace. This answers with a UserResponseDto, which is
        // not the shape GET /auth/me returns — `unreadMessages` rides along
        // with /auth/me only. Overwriting the whole cache entry drops it, and
        // anything else /auth/me grows later.
        dispatch(
          profikApi.util.updateQueryData("me", undefined, (draft) => {
            Object.assign(draft, data);
          }),
        );
      },
    }),
    uploadAvatar: builder.mutation<MeResponse, UploadAvatarParams>({
      query: ({ uri, fileName, mimeType }) => {
        const inferredMime = mimeType ?? guessMimeFromUri(uri);
        const inferredName =
          fileName ?? `avatar.${inferredMime.split("/")[1] ?? "jpg"}`;
        const formData = new FormData();
        // Expo's fetch polyfill (the global `fetch` since SDK 57) only
        // accepts a string, a real Blob, or a Blob-like object with
        // `.bytes()` as a FormData part — the classic React Native
        // `{ uri, name, type }` pseudo-blob throws "Unsupported
        // FormDataPart implementation". expo-file-system's `File`
        // implements the Blob interface and is the supported way to
        // attach a local file without reading it into memory first.
        const file = new ExpoFile(uri);
        formData.append("file", file as unknown as Blob, inferredName);
        return {
          url: "/users/me/avatar",
          method: "POST",
          body: formData,
          formData: true,
        };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        // Merged for the same reason as updateProfile above — and this is
        // where it was caught: replacing the entry sent the phone number on
        // the profile screen to "—" the moment the avatar changed.
        dispatch(
          profikApi.util.updateQueryData("me", undefined, (draft) => {
            Object.assign(draft, data);
          }),
        );
      },
    }),
  }),
});

export const {
  useRequestOtpCodeMutation,
  useVerifyOtpCodeMutation,
  useMeQuery,
  useGetOpenJobsInfiniteQuery,
  useGetOfferedJobsInfiniteQuery,
  useGetJobByIdQuery,
  useGetJobReviewsQuery,
  useCreateReviewMutation,
  useCreateOfferMutation,
  useHasOfferedQuery,
  useGetMyOfferForJobQuery,
  useGetOfferMessagesQuery,
  useSendOfferMessageMutation,
  useGetConversationsInfiniteQuery,
  useGetUnreadCountQuery,
  useMarkConversationReadMutation,
  useMarkAllReadMutation,
  useTopupBalanceMutation,
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
  useDeleteAccountMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} = profikApi;
