import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout } from '../store/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
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
  tagTypes: ['Jobs'],
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    signup: builder.mutation<void, { email: string; password: string; role: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<{ token: string }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    me: builder.query<{ id: string; email: string; role: string; name: string; balance: number }, void>({
      query: () => ({ url: '/auth/me', method: 'GET' }),
    }),
    getOpenJobs: builder.query<any[], void>({
      query: () => ({ url: '/jobs/open', method: 'GET' }),
      providesTags: ['Jobs'],
    }),
    getJobById: builder.query<any, string>({
      query: (id) => ({ url: `/jobs/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Jobs', id } as any],
    }),
    hasOffered: builder.query<{ hasOffered: boolean }, string>({
      query: (jobId) => ({ url: `/offers/job/${jobId}/has-offered`, method: 'GET' }),
    }),
    createOffer: builder.mutation<{ id: string }, { jobId: string; price: number; message?: string }>({
      query: (body) => ({ url: '/offers', method: 'POST', body }),
    }),
    topupBalance: builder.mutation<{ url: string }, { amount: number; returnUrl?: string }>({
      query: ({ amount, returnUrl }) => ({ url: '/payments/topup', method: 'POST', body: { amount, returnUrl } }),
    }),
  }),
});

export const { useSignupMutation, useLoginMutation, useMeQuery, useGetOpenJobsQuery, useGetJobByIdQuery, useCreateOfferMutation, useHasOfferedQuery, useTopupBalanceMutation } = profikApi;
