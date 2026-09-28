import { api } from "./client";
import type { PublicUser } from "../types";

export const usersApi = {
  list: () => api.get<PublicUser[]>("/users"),
};
