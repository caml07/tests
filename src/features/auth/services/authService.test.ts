import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login } from './authService'
import { api } from '@/src/shared/services/api'

vi.mock('@/src/shared/services/api', () => ({
  api: {
    login: vi.fn(),
  },
}))

const mockApiLogin = vi.mocked(api.login)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authService.login', () => {
  it('llama api.login con usuario y password', async () => {
    mockApiLogin.mockResolvedValue({
      strTokenTransaccion: 'B97E4FA3',
      strU: 'andrea',
    })

    const result = await login({ usuario: 'andrea', password: '1234' })

    expect(mockApiLogin).toHaveBeenCalledWith('andrea', '1234')
    expect(result.strTokenTransaccion).toBe('B97E4FA3')
  })

  it('propaga errores de api.login', async () => {
    mockApiLogin.mockRejectedValue(new Error('Credenciales inválidas'))

    await expect(login({ usuario: 'x', password: 'y' })).rejects.toThrow('Credenciales inválidas')
  })

  it('no usa mock local — siempre llama a la API real', async () => {
    mockApiLogin.mockResolvedValue({
      strTokenTransaccion: 'TOKEN',
      strU: 'carlos',
    })

    const result = await login({ usuario: 'carlos', password: '1234' })

    expect(result.strU).toBe('carlos')
    expect(mockApiLogin).toHaveBeenCalledTimes(1)
  })
})
