import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/src/store/authStore'
import { api } from '@/src/services/api'
import { storage } from '@/src/services/storage'

vi.mock('@/src/services/api', () => ({
  api: {
    login: vi.fn(),
  },
}))

vi.mock('@/src/services/storage', () => ({
  storage: {
    saveAuth: vi.fn(),
    getAuth: vi.fn(),
    clearAuth: vi.fn(),
  },
}))

const mockApi = vi.mocked(api)
const mockStorage = vi.mocked(storage)

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isHydrated: false,
    isLoading: false,
    error: null,
  })
})

describe('authStore', () => {
  it('login sin rememberMe no guarda en storage', async () => {
    mockApi.login.mockResolvedValue({
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
    expect(mockStorage.saveAuth).not.toHaveBeenCalled()
  })

  it('login con rememberMe=true guarda en storage', async () => {
    mockApi.login.mockResolvedValue({
      user: { id: '1', nombre: 'Test', estaciones: ['1'] },
      token: 'mock-token-123',
    })

    const { login } = useAuthStore.getState()
    await login({ usuario: 'test', password: '1234' }, true)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(mockStorage.saveAuth).toHaveBeenCalledWith('mock-token-123', {
      id: '1', nombre: 'Test', estaciones: ['1'],
    })
  })

  it('login fallido setea error y no autentica', async () => {
    mockApi.login.mockRejectedValue(new Error('Usuario o contraseña incorrectos'))

    const { login } = useAuthStore.getState()
    await login({ usuario: 'x', password: 'y' })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.error).toContain('incorrectos')
    expect(state.isLoading).toBe(false)
  })

  it('logout limpia user, token y isAuthenticated', async () => {
    useAuthStore.setState({
      user: { id: '1', nombre: 'Test', estaciones: ['1'] },
      token: 'mock-token-123',
      isAuthenticated: true,
      isHydrated: true,
    })

    const { logout } = useAuthStore.getState()
    await logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(mockStorage.clearAuth).toHaveBeenCalled()
  })

  it('hydrate desde storage setea isAuthenticated', async () => {
    mockStorage.getAuth.mockResolvedValue({
      user: { id: '1', nombre: 'Test', estaciones: ['1'] },
      token: 'mock-token-123',
    })

    const { hydrate } = useAuthStore.getState()
    await hydrate()

    const state = useAuthStore.getState()
    expect(state.isHydrated).toBe(true)
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.nombre).toBe('Test')
  })

  it('hydrate sin auth guardado no autentica', async () => {
    mockStorage.getAuth.mockResolvedValue(null)

    const { hydrate } = useAuthStore.getState()
    await hydrate()

    const state = useAuthStore.getState()
    expect(state.isHydrated).toBe(true)
    expect(state.isAuthenticated).toBe(false)
  })

  it('clearError limpia el error', () => {
    useAuthStore.setState({ error: 'Algo salió mal' })
    useAuthStore.getState().clearError()
    expect(useAuthStore.getState().error).toBeNull()
  })
})
