import { create } from 'zustand'

interface StationState {
  selectedStationId: string | null
  setSelectedStation: (id: string) => void
  clearSelection: () => void
}

export const useStationStore = create<StationState>((set) => ({
  selectedStationId: null,
  setSelectedStation: (id: string) => set({ selectedStationId: id }),
  clearSelection: () => set({ selectedStationId: null }),
}))
