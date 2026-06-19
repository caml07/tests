import { useState, useEffect, useCallback, useMemo } from 'react'
import { Patient } from '@/src/types'
import { api } from '@/src/services/api'

interface PatientWithDieta extends Patient {
  dietaNombre: string
  dietaSimbolo: string
}

export function usePatients(stationId: string, searchQuery: string) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [dietaMap, setDietaMap] = useState<Record<string, { nombre: string; simbolo: string }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [pacientes, dietas] = await Promise.all([
        api.getPacientes(stationId),
        api.getDietas(),
      ])
      setPatients(pacientes)
      const map: Record<string, { nombre: string; simbolo: string }> = {}
      for (const d of dietas) {
        map[d.id] = { nombre: d.nombre, simbolo: d.simbolo }
      }
      setDietaMap(map)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar pacientes')
    } finally {
      setIsLoading(false)
    }
  }, [stationId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const filtered = useMemo<PatientWithDieta[]>(() => {
    const q = searchQuery.toLowerCase().trim()
    let list = patients
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
  }, [patients, dietaMap, searchQuery])

  return { patients: filtered, isLoading, error, refetch: fetch }
}
