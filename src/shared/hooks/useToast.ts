import { useContext } from 'react'
import { ToastContext } from '@/src/shared/providers/ToastProvider'

export function useToast() {
  return useContext(ToastContext)
}
