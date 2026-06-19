import { useState, useEffect, useCallback } from 'react'
import { Station } from '@/src/types'
import { api } from '@/src/services/api'

export function useStations() {
  const [stations, setStations] = useState<Station[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getEstaciones()
      setStations(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar estaciones')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { stations, isLoading, error, refetch: fetch }
}
