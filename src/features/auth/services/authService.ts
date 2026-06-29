import { LoginCredentials, AuthResponse } from "@/src/shared/types";
import { api } from "@/src/shared/services/api";

const MOCK_NURSES = [
  {
    id: "1",
    nombre: "Enfermera andrea",
    usuario: "andrea",
    password: "1234",
    estaciones: ["1"],
  },
  {
    id: "2",
    nombre: "Enfermero carlos",
    usuario: "carlos",
    password: "1234",
    estaciones: ["1", "2"],
  },
];

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  if (__DEV__) {
    const nurse = MOCK_NURSES.find(
      (n) =>
        n.usuario === credentials.usuario &&
        n.password === credentials.password,
    );
    if (!nurse) throw new Error("Credenciales inválidas");
    return {
      user: {
        id: nurse.id,
        nombre: nurse.nombre,
        estaciones: nurse.estaciones,
      },
      token: `mock-token-${nurse.id}-${Date.now()}`,
    };
  }

  return api.login(credentials);
}
