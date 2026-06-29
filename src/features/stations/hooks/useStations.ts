import { useQuery } from '@tanstack/react-query'
import type { Station } from '@/src/shared/types'
import { api } from '@/src/shared/services/api'

function fetchStations(): Promise<Station[]> {
  return api.getEstaciones()
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
