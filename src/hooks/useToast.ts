import { useContext } from 'react'
import { ToastContext } from '@/src/providers/ToastProvider'

export function useToast() {
  return useContext(ToastContext)
}
