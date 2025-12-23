import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: string;
  balance: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginParams {
  phone: string;
  password: string;
}

export interface SignupParams {
  email: string;
  password: string;
  name: string;
  role: string;
}

export type SmsPurpose = "register";

export interface RequestSmsCodeParams {
  phone: string;
  purpose: SmsPurpose;
}

export interface SmsRequestResponse {
  success: boolean;
}

export interface VerifySmsCodeParams {
  phone: string;
  code: string;
  email?: string;
  password: string;
  name: string;
  role: "contractor";
}

export type AuthResult = { success: true } | { success: false; error: string };

export type ApiError =
  | (FetchBaseQueryError & { data?: { message?: string } })
  | SerializedError;

export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    if ("data" in error && error.data && typeof error.data === "object") {
      if ("message" in error.data && typeof error.data.message === "string") {
        return error.data.message;
      }
    }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "An unknown error occurred";
}
