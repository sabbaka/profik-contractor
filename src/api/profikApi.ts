import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  AuthResponse,
  OtpRequestResponse,
  RequestOtpParams,
  UploadAvatarParams,
  VerifyOtpParams,
} from "../features/auth/types";
import { logout } from "../store/authSlice";
import type {
  GetOfferedJobsParams,
  Job,
  Offer,
  OfferedJobItem,
  OfferMessage,
} from "./types";

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
  tagTypes: ["Jobs", "OfferMessages", "Offers"],
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
    getOpenJobs: builder.query<Job[], void>({
      query: () => ({ url: "/jobs/open", method: "GET" }),
      providesTags: ["Jobs"],
    }),
    getOfferedJobs: builder.query<OfferedJobItem[], GetOfferedJobsParams>({
      query: ({ status }) => ({
        url: `/jobs/offered?status=${status}`,
        method: "GET",
      }),
      providesTags: ["Jobs", "Offers"],
    }),
    getJobById: builder.query<Job, string>({
      query: (id) => ({ url: `/jobs/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Jobs", id } as any],
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
    registerPushToken: builder.mutation<void, string>({
      query: (pushToken) => ({
        url: "/users/me/push-token",
        method: "PATCH",
        body: { pushToken },
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
        dispatch(profikApi.util.updateQueryData("me", undefined, () => data));
      },
    }),
    uploadAvatar: builder.mutation<MeResponse, UploadAvatarParams>({
      query: ({ uri, fileName, mimeType }) => {
        const inferredMime = mimeType ?? guessMimeFromUri(uri);
        const inferredName =
          fileName ?? `avatar.${inferredMime.split("/")[1] ?? "jpg"}`;
        const formData = new FormData();
        formData.append("file", {
          uri,
          name: inferredName,
          type: inferredMime,
        } as any);
        return {
          url: "/users/me/avatar",
          method: "POST",
          body: formData,
          formData: true,
        };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(profikApi.util.updateQueryData("me", undefined, () => data));
      },
    }),
  }),
});

export const {
  useRequestOtpCodeMutation,
  useVerifyOtpCodeMutation,
  useMeQuery,
  useGetOpenJobsQuery,
  useGetOfferedJobsQuery,
  useGetJobByIdQuery,
  useCreateOfferMutation,
  useHasOfferedQuery,
  useGetMyOfferForJobQuery,
  useGetOfferMessagesQuery,
  useSendOfferMessageMutation,
  useTopupBalanceMutation,
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
  useDeleteAccountMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} = profikApi;
