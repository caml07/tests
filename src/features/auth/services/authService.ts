import { LoginCredentials, AuthResponse } from "@/src/shared/types";
import { api } from "@/src/shared/services/api";

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  return api.login(credentials.usuario, credentials.password);
}
