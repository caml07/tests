import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('expo-file-system', () => ({
  documentDirectory: '/mock/',
  writeAsStringAsync: vi.fn(),
  readAsStringAsync: vi.fn(),
  getInfoAsync: vi.fn(),
}))
vi.mock('react-native-mmkv', () => ({
  createMMKV: vi.fn(() => ({ getString: vi.fn(), set: vi.fn() })),
}))
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  QueryClient: vi.fn(),
  QueryClientProvider: vi.fn(),
}))

import { syncAll, parseCenso, flushQueue } from '@/src/shared/services/sync'

const mockRunAsync = vi.fn()
const mockExecAsync = vi.fn()
const mockDb = { runAsync: mockRunAsync, execAsync: mockExecAsync } as any

vi.mock('@/src/shared/services/database', () => ({
  upsertRows: vi.fn(),
  getAllRows: vi.fn(),
  deleteWhere: vi.fn(),
  serializeArray: vi.fn((arr: unknown[]) => JSON.stringify(arr)),
}))

vi.mock('@/src/shared/services/api', () => ({
  api: {
    getCenso: vi.fn(),
    postPedido: vi.fn(),
  },
}))

import { upsertRows, getAllRows, deleteWhere } from '@/src/shared/services/database'
import { api } from '@/src/shared/services/api'

const makeEntry = (overrides: Record<string, unknown> = {}) => ({
  id: 'q1',
  items: JSON.stringify([{ id: 'i1', comidaId: 'c1', comidaNombre: 'Arroz', pacienteId: 'p1', pacienteNombre: 'Juan', flagHoy: true, nota: '', createdAt: new Date().toISOString() }]),
  pacienteId: 'p1',
  pacienteNombre: 'Juan',
  timestamp: new Date().toISOString(),
  failed_attempts: 0,
  status: 'PENDING',
  next_attempt_at: null,
  idempotency_key: 'key-1',
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('parseCenso', () => {
  it('transforma CensoPatient[] en agrupaciones, stations, patients', () => {
    const censoList = [
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
        strMotivoConsulta: 'Dolor abdominal',
      },
      {
        decPaciente: 1234567,
        decCuenta: 888999,
        strPaciente: 'JUAN PEREZ',
        strPacienteNombresApellidos: 'JUAN PEREZ',
        strAreaServicio: 'EGY',
        intHabitacion: 4,
        intCama: 1,
        strAlergias: 'Penicilina',
        strAgrupacion: 'EMERGENCIA',
        intAgrupacion: 1,
        strSexo: 'M',
        strEdad: '45 años',
        strMotivoConsulta: 'Fiebre',
      },
    ]

    const result = parseCenso(censoList)

    expect(result.agrupaciones).toEqual([
      { id: '1', nombre: 'EMERGENCIA', icon: 'cross.case' },
    ])

    expect(result.stations).toEqual([
      { id: 'EGY', nombre: 'EGY', agrupacionId: '1' },
    ])

    expect(result.patients).toHaveLength(2)
    expect(result.patients[0]).toEqual({
      id: '207453',
      decPaciente: 4656906,
      nombre: 'MR VICHAI SERMTHAVISUB',
      stationId: 'EGY',
      habitacion: '3',
      cama: '5',
      alergias: [],
      notas: 'Dolor abdominal',
      dietaId: '',
      sexo: 'M',
      edad: '59 años',
    })
  })

  it('maneja lista vacía', () => {
    const result = parseCenso([])

    expect(result.agrupaciones).toEqual([])
    expect(result.stations).toEqual([])
    expect(result.patients).toEqual([])
  })

  it('deduplica agrupaciones y stations', () => {
    const censoList = [
      {
        decPaciente: 1, decCuenta: 100, strPaciente: 'A', strPacienteNombresApellidos: 'A',
        strAreaServicio: 'EGY', intHabitacion: 1, intCama: 1,
        strAlergias: '', strAgrupacion: 'EMERGENCIA', intAgrupacion: 1,
        strSexo: 'M', strEdad: '', strMotivoConsulta: '',
      },
      {
        decPaciente: 2, decCuenta: 200, strPaciente: 'B', strPacienteNombresApellidos: 'B',
        strAreaServicio: 'EGY', intHabitacion: 2, intCama: 2,
        strAlergias: '', strAgrupacion: 'EMERGENCIA', intAgrupacion: 1,
        strSexo: 'M', strEdad: '', strMotivoConsulta: '',
      },
    ]

    const result = parseCenso(censoList)

    expect(result.agrupaciones).toHaveLength(1)
    expect(result.stations).toHaveLength(1)
    expect(result.patients).toHaveLength(2)
  })

  it('deriva icono de agrupacion segun tipo', () => {
    const censoList = [
      {
        decPaciente: 1, decCuenta: 100, strPaciente: 'A', strPacienteNombresApellidos: 'A',
        strAreaServicio: 'HOS', intHabitacion: 1, intCama: 1,
        strAlergias: '', strAgrupacion: 'HOSPITALIZACION', intAgrupacion: 2,
        strSexo: 'M', strEdad: '', strMotivoConsulta: '',
      },
    ]

    const result = parseCenso(censoList)

    expect(result.agrupaciones[0].icon).toBe('building.2.fill')
  })
})

describe('syncAll', () => {
  it('llama api.getCenso una vez y upsertea resultados', async () => {
    vi.mocked(api.getCenso).mockResolvedValue([{
      strMsg: 'Lista Censo!',
      strMsgType: 'success',
      intMsgError: 0,
      listCenso: [
        {
          decPaciente: 4656906, decCuenta: 207453,
          strPaciente: 'MR VICHAI SERMTHAVISUB',
          strPacienteNombresApellidos: 'MR VICHAI SERMTHAVISUB',
          strAreaServicio: 'EGY', intHabitacion: 3, intCama: 5,
          strAlergias: 'No Refiere Alergias',
          strAgrupacion: 'EMERGENCIA', intAgrupacion: 1,
          strSexo: 'M', strEdad: '59 años', strMotivoConsulta: '',
        },
      ],
    }])

    const result = await syncAll(mockDb)

    expect(api.getCenso).toHaveBeenCalledTimes(1)
    expect(mockRunAsync.mock.calls[0][0]).toContain('DELETE FROM agrupaciones')
    expect(mockRunAsync.mock.calls[1][0]).toContain('INSERT OR REPLACE INTO agrupaciones')
    expect(mockRunAsync.mock.calls[2][0]).toContain('DELETE FROM stations')
    expect(mockRunAsync.mock.calls[3][0]).toContain('INSERT OR REPLACE INTO stations')
    expect(mockRunAsync.mock.calls[4][0]).toContain('DELETE FROM patients')
    expect(mockRunAsync.mock.calls[5][0]).toContain('INSERT OR REPLACE INTO patients')
    expect(mockExecAsync).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('retorna false si getCenso falla', async () => {
    vi.mocked(api.getCenso).mockRejectedValue(new Error('API error'))

    const result = await syncAll(mockDb)

    expect(result).toBe(false)
  })

  it('invalida query cache si se pasa queryClient', async () => {
    const invalidateQueries = vi.fn()
    const queryClient = { invalidateQueries } as any

    vi.mocked(api.getCenso).mockResolvedValue([{
      strMsg: 'Lista Censo!',
      strMsgType: 'success',
      intMsgError: 0,
      listCenso: [
        {
          decPaciente: 1, decCuenta: 100,
          strPaciente: 'A',
          strPacienteNombresApellidos: 'A',
          strAreaServicio: 'EGY', intHabitacion: 1, intCama: 1,
          strAlergias: '', strAgrupacion: 'EMERGENCIA', intAgrupacion: 1,
          strSexo: 'M', strEdad: '', strMotivoConsulta: '',
        },
      ],
    }])

    await syncAll(mockDb, queryClient)

    expect(invalidateQueries).toHaveBeenCalled()
  })
})

describe('flushQueue', () => {
  it('retorna ok=0, failed=0 si no hay items pendientes', async () => {
    vi.mocked(getAllRows).mockResolvedValue([])

    const result = await flushQueue(mockDb)

    expect(result).toEqual({ ok: 0, items: 0, failed: 0 })
  })

  it('marca item como IN_FLIGHT antes de POST', async () => {
    vi.mocked(getAllRows).mockResolvedValue([makeEntry()])
    vi.mocked(api.postPedido).mockResolvedValue({} as never)

    await flushQueue(mockDb)

    expect(vi.mocked(mockDb.runAsync)).toHaveBeenCalledWith(
      expect.stringContaining("status = 'IN_FLIGHT'"),
      'q1',
    )
  })

  it('elimina item si POST es exitoso', async () => {
    vi.mocked(getAllRows).mockResolvedValue([makeEntry()])
    vi.mocked(api.postPedido).mockResolvedValue({} as never)

    await flushQueue(mockDb)

    expect(deleteWhere).toHaveBeenCalledWith(mockDb, 'pedidos_queue', 'id = ?', ['q1'])
  })

  it('incrementa failed_attempts con backoff si POST falla', async () => {
    vi.mocked(getAllRows).mockResolvedValue([makeEntry({ failed_attempts: 0 })])
    vi.mocked(api.postPedido).mockRejectedValue(new Error('Network error'))

    await flushQueue(mockDb)

    const updateCall = mockRunAsync.mock.calls.find(
      ([sql]: unknown[]) => typeof sql === 'string' && sql.includes("status = 'PENDING'"),
    )
    expect(updateCall).toBeDefined()
    expect(updateCall![1]).toBe(1)
  })

  it('marca DEAD_LETTER si failed_attempts >= 5', async () => {
    vi.mocked(getAllRows).mockResolvedValue([makeEntry({ failed_attempts: 4 })])
    vi.mocked(api.postPedido).mockRejectedValue(new Error('Network error'))

    await flushQueue(mockDb)

    expect(vi.mocked(mockDb.runAsync)).toHaveBeenCalledWith(
      expect.stringContaining("status = 'DEAD_LETTER'"),
      5,
      'q1',
    )
  })
})
