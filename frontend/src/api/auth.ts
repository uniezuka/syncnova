import { api } from "./client";
import type { AuthResult } from "../types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResult>("/auth/login", { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post<AuthResult>("/auth/register", { email, password, name }),
};
