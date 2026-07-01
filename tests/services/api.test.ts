import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/src/shared/services/api'

vi.mock('@/src/shared/utils/config', () => ({
  API_BASE: 'http://localhost:3001',
  STATIC_TOKEN: 'test-static-token',
  INTERFACE_URL: 'https://test.portal.com/Interface/HIS',
  INTERFACE_SYSTEM: 'TestApp',
}))

vi.mock('@/src/shared/services/mmkvStorage', () => ({
  mmkv: {
    getString: vi.fn(() => null),
    set: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/src/shared/services/database', () => ({
  getDb: vi.fn(),
  tryDeserialize: vi.fn((r: unknown) => r),
  serializeArray: vi.fn((arr: unknown[]) => JSON.stringify(arr)),
}))

vi.mock('@react-native-community/netinfo', () => ({
  fetch: () => Promise.resolve({ isConnected: true }),
  default: { fetch: () => Promise.resolve({ isConnected: true }) },
}))

import { getDb } from '@/src/shared/services/database'

const mockDb = {
  getAllAsync: vi.fn(),
  getFirstAsync: vi.fn(),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.mocked(getDb).mockResolvedValue(mockDb as never)
})

describe('api.login', () => {
  it('POSTea al INTERFACE_URL con comando login', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ strTokenTransaccion: 'B97E4FA3-3E8B', strMsgType: 'success', intMsgError: 0 }]),
    })
    global.fetch = fetchMock

    const res = await api.login('andrea', '1234')

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('TestApp')

    const options = fetchMock.mock.calls[0][1] as RequestInit
    const body = JSON.parse(options.body as string)
    expect(body[0].strInterfaceMsg).toBe('login')
    expect(body[0].strToken).toBe('test-static-token')
    expect(body[0].strU).toBe('andrea')
    expect(body[0].strP).toBe('1234')

    expect(res.strTokenTransaccion).toBe('B97E4FA3-3E8B')
  })

  it('lanza error si la API responde con error HTTP', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    await expect(api.login('x', 'y')).rejects.toThrow('Error HTTP 500')
  })

  it('lanza error de conexión si fetch falla', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Network request failed'))

    await expect(api.login('x', 'y')).rejects.toThrow('Network request failed')
  })
})

describe('api.getCenso', () => {
  it('POSTea al INTERFACE_URL con comando censo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{
        strMsg: 'Lista Censo!',
        strMsgType: 'success',
        intMsgError: 0,
        listCenso: [
          {
            decPaciente: 4656906,
            decCuenta: 207453,
            strPaciente: 'MR VICHAI SERMTHAVISUB',
            strPacienteNombresApellidos: 'MR VICHAI SERMTHAVISUB',
            strAreaServicio: 'EGY',
            intHabitacion: 3,
            intCama: 5,
            strAlergias: 'No Refiere Alergias',
            strAgrupacion: 'EMERGENCIA',
            intAgrupacion: 1,
            strSexo: 'M',
            strEdad: '59 años',
            strMotivoConsulta: '...',
          },
        ],
      }]),
    })
    global.fetch = fetchMock

    const res = await api.getCenso()

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body[0].strInterfaceMsg).toBe('censo')
    expect(body[0].strToken).toBe('test-static-token')

    expect(res[0].listCenso).toHaveLength(1)
    expect(res[0].listCenso![0].strPacienteNombresApellidos).toBe('MR VICHAI SERMTHAVISUB')
  })
})

describe('api.getAgrupaciones', () => {
  it('lee desde SQLite directamente', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: '1', nombre: 'EMERGENCIA', icon: 'cross.case' },
    ])

    const result = await api.getAgrupaciones()

    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM agrupaciones')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('EMERGENCIA')
  })
})

describe('api.getEstaciones', () => {
  it('lee desde SQLite directamente', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: 'EGY', nombre: 'EGY', agrupacionId: '1' },
    ])

    const result = await api.getEstaciones()

    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM stations')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('EGY')
  })
})

describe('api.getDietas', () => {
  it('lee desde SQLite directamente', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: '1', nombre: 'Hiposódica', tiempos: '["desayuno","almuerzo","cena"]', simbolo: 'heart.fill' },
    ])

    const result = await api.getDietas()

    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM dietas')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Hiposódica')
  })
})

describe('api.getComidas', () => {
  it('lee desde SQLite directamente', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: '101', dietaId: '1', nombre: 'Caldo de pollo', tiempo: 'desayuno', subcomidas: '[]' },
    ])

    const result = await api.getComidas()

    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM comidas')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Caldo de pollo')
  })
})

describe('api.getMenu', () => {
  it('filtra por dietaId y tiempo desde SQLite', async () => {
    mockDb.getAllAsync.mockImplementation(async (_sql: string, ...params: string[]) => {
      if (params[0] === '1' && params[1] === 'desayuno') {
        return [{ id: '101', dietaId: '1', nombre: 'Caldo de pollo', tiempo: 'desayuno', subcomidas: '[]' }]
      }
      return []
    })

    const result = await api.getMenu('1', 'desayuno')

    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM comidas WHERE dietaId = ? AND tiempo = ?', '1', 'desayuno')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Caldo de pollo')
  })
})

describe('api.getMenuByDieta', () => {
  it('filtra por dietaId desde SQLite', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: '101', dietaId: '1', nombre: 'Caldo de pollo', tiempo: 'desayuno', subcomidas: '[]' },
      { id: '102', dietaId: '1', nombre: 'Pollo al horno', tiempo: 'almuerzo', subcomidas: '[]' },
    ])

    const result = await api.getMenuByDieta('1')

    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM comidas WHERE dietaId = ?', '1')
    expect(result).toHaveLength(2)
  })
})

describe('api.getAllPatients', () => {
  it('lee desde SQLite directamente', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: '207453', nombre: 'MR VICHAI SERMTHAVISUB', stationId: 'EGY', habitacion: '3', cama: '5', dietaId: '', alergias: 'No Refiere Alergias', notas: '...', decPaciente: 4656906 },
    ])

    const result = await api.getAllPatients()

    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM patients')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('MR VICHAI SERMTHAVISUB')
  })
})

describe('api.getPacientes', () => {
  it('filtra por stationId desde SQLite', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: '1', nombre: 'Juan', stationId: '1', habitacion: '101', cama: 'A', dietaId: '1', alergias: [], notas: '' },
      { id: '2', nombre: 'Maria', stationId: '1', habitacion: '102', cama: 'B', dietaId: '2', alergias: [], notas: '' },
    ])

    const result = await api.getPacientes('1')

    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM patients WHERE stationId = ?', '1')
    expect(result).toHaveLength(2)
  })
})

describe('api.getPatient', () => {
  it('busca por id desde SQLite', async () => {
    mockDb.getFirstAsync.mockResolvedValue(
      { id: '207453', nombre: 'Test', stationId: 'EGY', habitacion: '3', cama: '5', dietaId: '', alergias: '', notas: '' },
    )

    const result = await api.getPatient('207453')

    expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT * FROM patients WHERE id = ?', '207453')
    expect(result?.nombre).toBe('Test')
  })

  it('retorna null si no existe', async () => {
    mockDb.getFirstAsync.mockResolvedValue(null)

    const result = await api.getPatient('no-existe')

    expect(result).toBeNull()
  })
})

describe('api.postPedido', () => {
  it('envia status sent', async () => {
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
})
