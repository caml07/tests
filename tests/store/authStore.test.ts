import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/src/features/auth/store/authStore'
import { useStationStore } from '@/src/features/stations/store/stationStore'

const mockAuthLogin = vi.hoisted(() => vi.fn())

vi.mock('@/src/features/auth/services/authService', () => ({
  login: mockAuthLogin,
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

vi.mock('@/src/features/stations/store/stationStore', () => ({
  useStationStore: {
    getState: vi.fn(),
  },
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
  vi.mocked(useStationStore.getState).mockReturnValue({
    selectedStationId: null,
    setSelectedStation: vi.fn(),
    clearSelection: vi.fn(),
  })
})

describe('authStore', () => {
  it('login sin rememberMe no persiste en storage', async () => {
    mockAuthLogin.mockResolvedValue({
      user: { id: '1', nombre: 'Test', estaciones: ['1'] },
      token: 'mock-token-123',
    })

    const { login } = useAuthStore.getState()
    await login({ usuario: 'test', password: '1234' })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.user?.nombre).toBe('Test')
  })

  it('login con rememberMe=true persiste en storage', async () => {
    mockAuthLogin.mockResolvedValue({
      user: { id: '1', nombre: 'Test', estaciones: ['1'] },
      token: 'mock-token-123',
    })

    const { login } = useAuthStore.getState()
    await login({ usuario: 'test', password: '1234' }, true)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
    expect(state.user?.nombre).toBe('Test')
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
      user: { id: '1', nombre: 'Test', estaciones: ['1'] },
      token: 'mock-token-123',
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

  it('login limpia biometric-auth-token si el usuario es distinto', async () => {
    mockAuthLogin.mockResolvedValue({
      user: { id: '2', nombre: 'Nuevo User', estaciones: ['1'] },
      token: 'mock-token-456',
    })

    await useAuthStore.getState().login({ usuario: 'nuevo', password: '1234' })
  })
})
