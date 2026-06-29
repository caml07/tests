import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushQueue } from '@/src/shared/services/sync'
import type { SQLiteDatabase } from 'expo-sqlite'

const mockRunAsync = vi.fn()
const mockDb = { runAsync: mockRunAsync } as unknown as SQLiteDatabase

vi.mock('@/src/shared/services/database', () => ({
  getAllRows: vi.fn(),
  deleteWhere: vi.fn(),
  serializeArray: vi.fn((arr: unknown[]) => JSON.stringify(arr)),
}))

vi.mock('@/src/shared/services/api', () => ({
  api: {
    postPedido: vi.fn(),
  },
}))

import { getAllRows, deleteWhere } from '@/src/shared/services/database'
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

describe('flushQueue', () => {
  it('retorna ok=0, failed=0 si no hay items pendientes', async () => {
    vi.mocked(getAllRows).mockResolvedValue([])

    const result = await flushQueue(mockDb)

    expect(result).toEqual({ ok: 0, failed: 0 })
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

  it('incrementa failed_attempts y mantiene PENDING con backoff si POST falla (attempts < 5)', async () => {
    vi.mocked(getAllRows).mockResolvedValue([makeEntry({ failed_attempts: 0 })])
    vi.mocked(api.postPedido).mockRejectedValue(new Error('Network error'))

    const before = Date.now()
    await flushQueue(mockDb)
    const after = Date.now()

    const updateCall = mockRunAsync.mock.calls.find(
      ([sql]: unknown[]) => typeof sql === 'string' && sql.includes("status = 'PENDING'"),
    )
    expect(updateCall).toBeDefined()
    const attempts = updateCall![1] as number
    const nextAttemptAt = updateCall![2] as string
    expect(attempts).toBe(1)
    expect(new Date(nextAttemptAt).getTime()).toBeGreaterThanOrEqual(before + 1000)
    expect(new Date(nextAttemptAt).getTime()).toBeLessThanOrEqual(after + 3000)
  })

  it('marca como DEAD_LETTER si failed_attempts >= 5', async () => {
    vi.mocked(getAllRows).mockResolvedValue([makeEntry({ failed_attempts: 4 })])
    vi.mocked(api.postPedido).mockRejectedValue(new Error('Network error'))

    await flushQueue(mockDb)

    expect(vi.mocked(mockDb.runAsync)).toHaveBeenCalledWith(
      expect.stringContaining("status = 'DEAD_LETTER'"),
      5,
      'q1',
    )
  })

  it('filtra por status PENDING y next_attempt_at vencido en la query SQL', async () => {
    vi.mocked(getAllRows).mockResolvedValue([])

    await flushQueue(mockDb)

    expect(getAllRows).toHaveBeenCalledWith(
      mockDb,
      'pedidos_queue',
      expect.stringContaining("status = 'PENDING'"),
      expect.any(Array),
    )
  })

  it('procesa items con next_attempt_at en pasado', async () => {
    const past = new Date(Date.now() - 60000).toISOString()
    vi.mocked(getAllRows).mockResolvedValue([makeEntry({ next_attempt_at: past })])
    vi.mocked(api.postPedido).mockResolvedValue({} as never)

    await flushQueue(mockDb)

    expect(api.postPedido).toHaveBeenCalledTimes(1)
  })

  it('retorna conteo correcto de ok y failed con multiples items', async () => {
    vi.mocked(getAllRows).mockResolvedValue([
      makeEntry({ id: 'q1' }),
      makeEntry({ id: 'q2' }),
      makeEntry({ id: 'q3' }),
    ])
    vi.mocked(api.postPedido)
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({} as never)

    const result = await flushQueue(mockDb)

    expect(result).toEqual({ ok: 2, failed: 1 })
  })
})
