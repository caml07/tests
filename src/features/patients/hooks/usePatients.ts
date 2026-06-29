import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Patient, Dieta } from '@/src/shared/types'
import { api } from '@/src/shared/services/api'
import { getAllRows, getDbSync } from '@/src/shared/services/database'

interface PatientWithDieta extends Patient {
  dietaNombre: string
  dietaSimbolo: string
}

async function fetchPacientes(stationId: string): Promise<Patient[]> {
  try {
    return await api.getPacientes(stationId)
  } catch {
    const db = getDbSync()
    if (!db) return []
    const rows = await getAllRows<Patient>(db, 'patients', 'stationId = ?', [stationId])
    return rows
  }
}

async function fetchDietas(): Promise<Dieta[]> {
  try {
    return await api.getDietas()
  } catch {
    const db = getDbSync()
    if (!db) return []
    return getAllRows<Dieta>(db, 'dietas')
  }
}

export function usePatients(stationId: string, searchQuery: string) {
  const pacientesQuery = useQuery<Patient[]>({
    queryKey: ['pacientes', stationId],
    queryFn: () => fetchPacientes(stationId),
    enabled: !!stationId,
  })

  const dietasQuery = useQuery<Dieta[]>({
    queryKey: ['dietas'],
    queryFn: fetchDietas,
  })

  const filtered = useMemo<PatientWithDieta[]>(() => {
    const q = searchQuery.toLowerCase().trim()
    const pacientes = pacientesQuery.data ?? []
    const dietas = dietasQuery.data ?? []
    const dietaMap: Record<string, { nombre: string; simbolo: string }> = {}
    for (const d of dietas) {
      dietaMap[d.id] = { nombre: d.nombre, simbolo: d.simbolo }
    }
    let list = pacientes
    if (q) {
      list = list.filter(p => p.nombre.toLowerCase().includes(q))
    }
    return list.map(p => {
      const info = dietaMap[p.dietaId]
      return {
        ...p,
        dietaNombre: info?.nombre || 'Sin especificar',
        dietaSimbolo: info?.simbolo || 'questionmark.circle',
      }
    })
  }, [pacientesQuery.data, dietasQuery.data, searchQuery])

  const isLoading = pacientesQuery.isLoading || dietasQuery.isLoading
  const error = pacientesQuery.error?.message ?? dietasQuery.error?.message ?? null
  const refetch = () => {
    pacientesQuery.refetch()
    dietasQuery.refetch()
  }

  return { patients: filtered, isLoading, error, refetch }
}
