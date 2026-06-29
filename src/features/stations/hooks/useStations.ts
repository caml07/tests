import { useQuery } from '@tanstack/react-query'
import type { Station } from '@/src/shared/types'
import { api } from '@/src/shared/services/api'
import { getAllRows, getDbSync } from '@/src/shared/services/database'

async function fetchStations(): Promise<Station[]> {
  try {
    return await api.getEstaciones()
  } catch {
    const db = getDbSync()
    if (!db) return []
    return getAllRows<Station>(db, 'stations')
  }
}

export function useStations() {
  const { data: stations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
  })

  return {
    stations,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar estaciones') : null,
    refetch,
  }
}
