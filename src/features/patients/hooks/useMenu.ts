import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Comida } from '@/src/shared/types'
import { api } from '@/src/shared/services/api'

interface DietaInfo {
  id: string
  nombre: string
  tiempos: string[]
  simbolo: string
}

export function useMenu(dietaId: string) {
  const query = useQuery({
    queryKey: ['menu', dietaId],
    queryFn: async () => {
      const [comidas, dietas] = await Promise.all([
        api.getMenuByDieta(dietaId),
        api.getDietas(),
      ])
      const diet = dietas.find((d) => d.id === dietaId) ?? null
      const dietaInfo: DietaInfo | null = diet
        ? { id: diet.id, nombre: diet.nombre, tiempos: diet.tiempos, simbolo: diet.simbolo }
        : null
      return { comidas, dietaInfo }
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!dietaId,
  })

  const menuByTiempo = useMemo(() => {
    const grouped: Record<string, Comida[]> = {}
    for (const c of query.data?.comidas ?? []) {
      if (!grouped[c.tiempo]) {
        grouped[c.tiempo] = []
      }
      grouped[c.tiempo].push(c)
    }
    return grouped
  }, [query.data?.comidas])

  const tiemposDisponibles = query.data?.dietaInfo?.tiempos ?? []
  const dietaNombre = query.data?.dietaInfo?.nombre ?? ''
  const dietaSimbolo = query.data?.dietaInfo?.simbolo ?? 'questionmark.circle'

  return {
    menuByTiempo,
    tiemposDisponibles,
    dietaNombre,
    dietaSimbolo,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  }
}
