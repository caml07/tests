import { describe, it, expect } from 'vitest'
import { queryClient } from '@/src/shared/services/queryClient'

describe('queryClient', () => {
  it('tiene staleTime de 5 minutos', () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(300000)
  })

  it('tiene retry: 1', () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1)
  })

  it('tiene gcTime de 24 horas', () => {
    expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(86400000)
  })

  it('tiene networkMode offlineFirst en queries', () => {
    expect(queryClient.getDefaultOptions().queries?.networkMode).toBe('offlineFirst')
  })

  it('tiene networkMode offlineFirst en mutations', () => {
    expect(queryClient.getDefaultOptions().mutations?.networkMode).toBe('offlineFirst')
  })
})
