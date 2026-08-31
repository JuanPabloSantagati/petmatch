import { api } from "./api";
import type { User } from "../types/user";

export const TOKEN_STORAGE_KEY = "petmatch_token";

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", input);
  return data;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", input);
  return data;
}

export async function me(): Promise<{ user: User }> {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data;
}
