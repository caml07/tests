import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Patient, Dieta } from '@/src/shared/types'
import { api } from '@/src/shared/services/api'

interface PatientWithDieta extends Patient {
  dietaNombre: string
  dietaSimbolo: string
  alergias: string[]
}

export function usePatients(stationId: string, searchQuery: string) {
  const pacientesQuery = useQuery<Patient[]>({
    queryKey: ['pacientes', stationId],
    queryFn: () => api.getPacientes(stationId),
    enabled: !!stationId,
  })

  const dietasQuery = useQuery<Dieta[]>({
    queryKey: ['dietas'],
    queryFn: () => api.getDietas(),
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
      const alergias = Array.isArray(p.alergias) ? p.alergias
        : typeof p.alergias === 'string' ? [p.alergias]
        : []
      return {
        ...p,
        alergias,
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
