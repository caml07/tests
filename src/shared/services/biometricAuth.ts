import * as LocalAuthentication from 'expo-local-authentication'

type BiometricResult = {
  success: boolean
  error?: string
}

export async function authenticateWithBiometrics(): Promise<BiometricResult> {
  const hasHardware = await (LocalAuthentication.hasHardwareAsync?.() ?? Promise.resolve(false))
  if (!hasHardware) {
    return { success: false, error: 'Biometría no disponible' }
  }

  const isEnrolled = await (LocalAuthentication.isEnrolledAsync?.() ?? Promise.resolve(false))
  if (!isEnrolled) {
    return { success: false, error: 'Biometría no disponible' }
  }

  const result = await (LocalAuthentication.authenticateAsync?.({
    promptMessage: 'Iniciar sesión con biometría',
    fallbackLabel: 'Usar contraseña',
  }) ?? Promise.resolve({ success: false }))

  if (result.success) {
    return { success: true }
  }
  return { success: false, error: result.error }
}
