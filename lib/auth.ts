import { api } from "@/lib/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER";
  hasOrganization: boolean;
};

export type AuthResult = {
  hasOrganization: boolean;
};

export const currentUserQueryKey = ["auth", "me"] as const;

export function fetchCurrentUser(): Promise<AuthUser> {
  return api<AuthUser>("/api/auth/me");
}

export function signupAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  return api<AuthResult>("/api/auth/signup", {
    method: "POST",
    body: input,
  });
}

export function loginAccount(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  return api<AuthResult>("/api/auth/login", {
    method: "POST",
    body: input,
  });
}

export function logoutAccount(): Promise<void> {
  return api<void>("/api/auth/logout", { method: "POST" });
}

export function createOrganization(input: { name: string }): Promise<{
  id: string;
  name: string;
  slug: string;
}> {
  return api("/api/organizations", {
    method: "POST",
    body: input,
  });
}

export function googleSignInUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  return `${base}/api/auth/google`;
}
