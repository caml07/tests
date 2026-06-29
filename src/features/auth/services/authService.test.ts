import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login } from './authService'
import { api } from '@/src/shared/services/api'

vi.mock('@/src/shared/services/api', () => ({
  api: {
    login: vi.fn(),
  },
}))

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('react-native-mmkv', () => ({
  MMKV: function () {
    return {
      set: vi.fn(),
      getString: vi.fn(() => null),
      delete: vi.fn(),
    }
  },
}))

const mockApiLogin = vi.mocked(api.login)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authService.login (DEV mode)', () => {
  it('devuelve user y token con credenciales demo válidas', async () => {
    const res = await login({ usuario: 'andrea', password: '1234' })

    expect(res.user.nombre).toBe('Enfermera andrea')
    expect(res.user.estaciones).toEqual(['1'])
    expect(res.token).toBeTruthy()
    expect(res.token).toContain('mock-token-')
  })

  it('rechaza password incorrecto', async () => {
    await expect(
      login({ usuario: 'andrea', password: 'wrong' })
    ).rejects.toThrow('Credenciales inválidas')
  })

  it('rechaza usuario inexistente', async () => {
    await expect(
      login({ usuario: 'nobody', password: 'x' })
    ).rejects.toThrow('Credenciales inválidas')
  })

  it('nunca llama a la API real en DEV', async () => {
    await login({ usuario: 'andrea', password: '1234' })
    expect(mockApiLogin).not.toHaveBeenCalled()
  })
})
