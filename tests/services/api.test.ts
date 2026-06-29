import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/src/shared/services/api'

vi.mock('@/src/shared/utils/config', () => ({
  API_BASE: 'http://localhost:3001',
}))

vi.mock('@/src/shared/services/mmkvStorage', () => ({
  mmkv: {
    getString: vi.fn(() => null),
    set: vi.fn(),
    delete: vi.fn(),
  },
}))

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('api.login', () => {
  it('hace POST a /auth/login con credenciales', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: { id: '1', nombre: 'Test', estaciones: ['1'] }, token: 'real-token-abc' }),
    })
    global.fetch = fetchMock

    const res = await api.login({ usuario: 'test', password: '1234' })

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('/auth/login')

    const options = fetchMock.mock.calls[0][1] as RequestInit
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body as string)).toEqual({ usuario: 'test', password: '1234' })

    expect(res.user.nombre).toBe('Test')
    expect(res.token).toBe('real-token-abc')
  })

  it('lanza error si la API responde con error HTTP', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Credenciales inválidas' }),
    })

    await expect(api.login({ usuario: 'x', password: 'y' })).rejects.toThrow('Credenciales inválidas')
  })

  it('lanza error de conexión si fetch falla', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Network request failed'))

    await expect(api.login({ usuario: 'x', password: 'y' })).rejects.toThrow('Network request failed')
  })

  it('postPedido envia status sent', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1', items: [], pacienteId: 'p1', timestamp: new Date().toISOString(), status: 'sent' }),
    })
    global.fetch = mockFetch

    await api.postPedido([{
      id: '1', comidaId: 'c1', comidaNombre: 'Arroz', pacienteId: 'p1',
      pacienteNombre: 'Juan', flagHoy: true, nota: '', createdAt: new Date().toISOString(),
    }])

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.status).toBe('sent')
  })

  it('getPacientes filtra localmente por stationId', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: '1', nombre: 'Juan', stationId: '1', habitacion: '101', cama: 'A', dietaId: '1', alergias: [], notas: '' },
        { id: '2', nombre: 'Maria', stationId: '1', habitacion: '102', cama: 'B', dietaId: '2', alergias: [], notas: '' },
        { id: '3', nombre: 'Carlos', stationId: '2', habitacion: '201', cama: 'A', dietaId: '3', alergias: [], notas: '' },
      ]),
    })

    const pacientes = await api.getPacientes('1')
    expect(pacientes).toHaveLength(2)
    expect(pacientes[0].nombre).toBe('Juan')
    expect(pacientes[1].nombre).toBe('Maria')
  })
})
