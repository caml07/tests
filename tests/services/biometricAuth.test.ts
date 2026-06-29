import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as LocalAuthentication from 'expo-local-authentication';
import { authenticateWithBiometrics } from '@/src/shared/services/biometricAuth';

vi.mock('expo-local-authentication', () => ({
  hasHardwareAsync: vi.fn(),
  isEnrolledAsync: vi.fn(),
  authenticateAsync: vi.fn(),
}));

describe('authenticateWithBiometrics', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fails when device has no biometric hardware', async () => {
    (LocalAuthentication.hasHardwareAsync as any).mockResolvedValue(false);
    const result = await authenticateWithBiometrics();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Biometría no disponible');
  });

  it('fails when no biometrics are enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as any).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as any).mockResolvedValue(false);
    const result = await authenticateWithBiometrics();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Biometría no disponible');
  });

  it('returns success when authentication succeeds', async () => {
    (LocalAuthentication.hasHardwareAsync as any).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as any).mockResolvedValue(true);
    (LocalAuthentication.authenticateAsync as any).mockResolvedValue({
      success: true,
      error: undefined,
    });
    const result = await authenticateWithBiometrics();
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns failure when authentication is rejected', async () => {
    (LocalAuthentication.hasHardwareAsync as any).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as any).mockResolvedValue(true);
    (LocalAuthentication.authenticateAsync as any).mockResolvedValue({
      success: false,
      error: 'User cancelled',
    });
    const result = await authenticateWithBiometrics();
    expect(result.success).toBe(false);
    expect(result.error).toBe('User cancelled');
  });
});
