import { useState, useEffect, useCallback, useMemo } from 'react'
import { Comida } from '@/src/types'
import { api } from '@/src/services/api'

interface DietaInfo {
  id: string
  nombre: string
  tiempos: string[]
  simbolo: string
}

export function useMenu(dietaId: string) {
  const [comidas, setComidas] = useState<Comida[]>([])
  const [dietaInfo, setDietaInfo] = useState<DietaInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [comidasData, dietas] = await Promise.all([
        api.getMenuByDieta(dietaId),
        api.getDietas(),
      ])
      setComidas(comidasData)
      const diet = dietas.find(d => d.id === dietaId)
      if (diet) {
        setDietaInfo({ id: diet.id, nombre: diet.nombre, tiempos: diet.tiempos, simbolo: diet.simbolo })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar menú')
    } finally {
      setIsLoading(false)
    }
  }, [dietaId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const menuByTiempo = useMemo(() => {
    const grouped: Record<string, Comida[]> = {}
    for (const c of comidas) {
      if (!grouped[c.tiempo]) {
        grouped[c.tiempo] = []
      }
      grouped[c.tiempo].push(c)
    }
    return grouped
  }, [comidas])

  const tiemposDisponibles = dietaInfo?.tiempos || []

  return { menuByTiempo, tiemposDisponibles, dietaNombre: dietaInfo?.nombre || '', dietaSimbolo: dietaInfo?.simbolo || 'questionmark.circle', isLoading, error, refetch: fetch }
}
