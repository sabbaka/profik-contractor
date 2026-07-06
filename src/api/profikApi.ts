import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  AuthResponse,
  ForgotPasswordRequestParams,
  ForgotPasswordVerifyParams,
  SmsRequestResponse,
} from '../features/auth/types';
import { logout } from '../store/authSlice';
import type { GetOfferedJobsParams, OfferedJobItem } from './types';

// Base query with auth header
const API_URL = process.env.EXPO_PUBLIC_API_URL as string;
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result && 'error' in result && (result as any).error?.status === 401) {
    api.dispatch(logout());
  }
  return result as any;
};

export const profikApi = createApi({
  reducerPath: 'profikApi',
  tagTypes: ['Jobs', 'OfferMessages', 'Offers'],
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    signup: builder.mutation<{ token: string }, { email: string; password: string; role: string; name?: string; phone?: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<{ user: { id: string; role: string; name: string; phone: string; email: string | null; balance: number; createdAt: string }; token: string }, { phone: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    requestSmsCode: builder.mutation<{ success: boolean }, { phone: string; purpose: 'register' }>({
      query: (body) => ({ url: '/auth/sms/request-code', method: 'POST', body }),
    }),
    verifySmsCode: builder.mutation<
      { token: string },
      { phone: string; code: string; email?: string; password: string; name: string; role: 'client' | 'contractor' }
    >({
      query: (body) => ({ url: '/auth/sms/verify', method: 'POST', body }),
    }),
    forgotPasswordRequestCode: builder.mutation<SmsRequestResponse, ForgotPasswordRequestParams>({
      query: (body) => ({ url: '/auth/forgot-password/request-code', method: 'POST', body }),
    }),
    forgotPasswordVerify: builder.mutation<AuthResponse, ForgotPasswordVerifyParams>({
      query: (body) => ({ url: '/auth/forgot-password/verify', method: 'POST', body }),
    }),
    me: builder.query<{ id: string; email: string; role: string; name: string; balance: number }, void>({
      query: () => ({ url: '/auth/me', method: 'GET' }),
    }),
    getOpenJobs: builder.query<any[], void>({
      query: () => ({ url: '/jobs/open', method: 'GET' }),
      providesTags: ['Jobs'],
    }),
    getOfferedJobs: builder.query<OfferedJobItem[], GetOfferedJobsParams>({
      query: ({ status }) => ({ url: `/jobs/offered?status=${status}`, method: 'GET' }),
      providesTags: ['Jobs', 'Offers'],
    }),
    getJobById: builder.query<any, string>({
      query: (id) => ({ url: `/jobs/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Jobs', id } as any],
    }),
    hasOffered: builder.query<{ hasOffered: boolean }, string>({
      query: (jobId) => ({ url: `/offers/job/${jobId}/has-offered`, method: 'GET' }),
    }),
    getMyOfferForJob: builder.query<any, string>({
      query: (jobId) => ({ url: `/offers/job/${jobId}/my`, method: 'GET' }),
      providesTags: (_result, _error, jobId) => [{ type: 'Offers', id: jobId } as any],
    }),
    createOffer: builder.mutation<{ id: string }, { jobId: string; price: number; message?: string }>({
      query: (body) => ({ url: '/offers', method: 'POST', body }),
      invalidatesTags: (_result, _error, { jobId }) => [{ type: 'Offers', id: jobId } as any],
    }),
    getOfferMessages: builder.query<any[], string>({
      query: (offerId) => ({
        url: `/offers/${offerId}/messages`,
        method: 'GET',
      }),
      providesTags: (_result, _error, offerId) => [{ type: 'OfferMessages', id: offerId } as any],
    }),
    sendOfferMessage: builder.mutation<any, { offerId: string; content: string }>({
      query: ({ offerId, content }) => ({
        url: `/offers/${offerId}/messages`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (_result, _error, { offerId }) => [{ type: 'OfferMessages', id: offerId } as any],
    }),
    topupBalance: builder.mutation<{ url: string }, { amount: number; returnUrl?: string }>({
      query: ({ amount, returnUrl }) => ({ url: '/payments/topup', method: 'POST', body: { amount, returnUrl } }),
    }),
    registerPushToken: builder.mutation<void, string>({
      query: (pushToken) => ({
        url: '/users/me/push-token',
        method: 'PATCH',
        body: { pushToken },
      }),
    }),
    deleteAccount: builder.mutation<void, void>({
      query: () => ({ url: '/users/me', method: 'DELETE' }),
    }),
    updateProfile: builder.mutation<
      { id: string; email: string; role: string; name: string; balance: number },
      { name?: string; email?: string }
    >({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(profikApi.util.updateQueryData('me', undefined, () => data));
      },
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useRequestSmsCodeMutation,
  useVerifySmsCodeMutation,
  useForgotPasswordRequestCodeMutation,
  useForgotPasswordVerifyMutation,
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
  useDeleteAccountMutation,
  useUpdateProfileMutation,
} = profikApi;
