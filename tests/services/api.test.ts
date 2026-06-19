import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/src/services/api'

vi.mock('@/src/utils/config', () => ({
  API_BASE: 'http://localhost:3001',
}))

const mockNurse = {
  id: '1',
  nombre: 'Enfermera Andrea',
  usuario: 'andrea',
  password: '1234',
  estaciones: ['1', '2'],
}

const allNurses = [
  mockNurse,
  { id: '2', nombre: 'Enfermero Carlos', usuario: 'carlos', password: '1234', estaciones: ['2', '3'] },
  { id: '3', nombre: 'Enfermera Maria', usuario: 'maria', password: '1234', estaciones: ['1', '3'] },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('api.login', () => {
  it('devuelve token y user con credenciales válidas', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(allNurses),
    })

    const res = await api.login({ usuario: 'andrea', password: '1234' })

    expect(res.user.nombre).toBe('Enfermera Andrea')
    expect(res.user.id).toBe('1')
    expect(res.user.estaciones).toEqual(['1', '2'])
    expect(res.token).toContain('mock-token-')
  })

  it('lanza error con password incorrecto', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(allNurses),
    })

    await expect(api.login({ usuario: 'andrea', password: 'wrong' })).rejects.toThrow('incorrectos')
  })

  it('lanza error con usuario inexistente', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(allNurses),
    })

    await expect(api.login({ usuario: 'x', password: 'y' })).rejects.toThrow('incorrectos')
  })

  it('lanza error si la API responde con error HTTP', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Error interno' }),
    })

    await expect(api.login({ usuario: 'x', password: 'y' })).rejects.toThrow('Error interno')
  })

  it('lanza error de conexión si fetch falla', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Network request failed'))

    await expect(api.login({ usuario: 'x', password: 'y' })).rejects.toThrow('Network request failed')
  })

  it('hace fetch a /nurses sin query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(allNurses),
    })
    global.fetch = fetchMock

    await api.login({ usuario: 'andrea', password: '1234' })

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('/nurses')
    expect(url).not.toContain('?')
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
