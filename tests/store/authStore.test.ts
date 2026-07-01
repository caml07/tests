import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/src/features/auth/store/authStore'

const mockAuthLogin = vi.hoisted(() => vi.fn())

vi.mock('@/src/features/auth/services/authService', () => ({
  login: mockAuthLogin,
}))

vi.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    set: vi.fn(),
    getString: vi.fn(() => null),
    remove: vi.fn(),
  }),
}))

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

beforeEach(async () => {
  vi.clearAllMocks()
  useAuthStore.setState(initialState)
  await useAuthStore.persist.clearStorage()
})

describe('authStore', () => {
  it('login con nuevo AuthResponse asigna strU como user.id y user.nombre', async () => {
    mockAuthLogin.mockResolvedValue({
      strTokenTransaccion: 'B97E4FA3-3E8B',
      strU: 'andrea',
    })

    const { login } = useAuthStore.getState()
    await login({ usuario: 'andrea', password: '1234' })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.user?.id).toBe('andrea')
    expect(state.user?.nombre).toBe('andrea')
    expect(state.user?.estaciones).toBeUndefined()
    expect(state.token).toBe('B97E4FA3-3E8B')
  })

  it('login fallido setea error y no autentica', async () => {
    mockAuthLogin.mockRejectedValue(new Error('Credenciales inválidas'))

    const { login } = useAuthStore.getState()
    await login({ usuario: 'x', password: 'y' })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.error).toContain('inválidas')
    expect(state.isLoading).toBe(false)
  })

  it('logout limpia user, token y isAuthenticated', async () => {
    useAuthStore.setState({
      user: { id: 'andrea', nombre: 'andrea' },
      token: 'B97E4FA3',
      isAuthenticated: true,
    })

    const { logout } = useAuthStore.getState()
    await logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it('clearError limpia el error', () => {
    useAuthStore.setState({ error: 'Algo salio mal' })
    useAuthStore.getState().clearError()
    expect(useAuthStore.getState().error).toBeNull()
  })
})
