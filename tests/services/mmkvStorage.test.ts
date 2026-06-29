import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockMmkv = vi.hoisted(() => ({
  set: vi.fn(),
  getString: vi.fn(() => null),
  delete: vi.fn(),
}))

vi.mock('react-native-mmkv', () => ({
  MMKV: function () { return mockMmkv },
}))

import { zustandStorage, queryPersisterStorage } from '@/src/shared/services/mmkvStorage'

describe('zustandStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('removeItem calls mmkv.delete', () => {
    zustandStorage.removeItem('test-key')
    expect(mockMmkv.delete).toHaveBeenCalledWith('test-key')
  })

  it('getItem calls mmkv.getString', () => {
    zustandStorage.getItem('test-key')
    expect(mockMmkv.getString).toHaveBeenCalledWith('test-key')
  })

  it('setItem calls mmkv.set', () => {
    zustandStorage.setItem('test-key', 'test-value')
    expect(mockMmkv.set).toHaveBeenCalledWith('test-key', 'test-value')
  })
})

describe('queryPersisterStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('removeItem calls mmkv.delete', () => {
    queryPersisterStorage.removeItem('test-key')
    expect(mockMmkv.delete).toHaveBeenCalledWith('test-key')
  })

  it('getItem calls mmkv.getString', () => {
    queryPersisterStorage.getItem('test-key')
    expect(mockMmkv.getString).toHaveBeenCalledWith('test-key')
  })

  it('setItem calls mmkv.set', () => {
    queryPersisterStorage.setItem('test-key', 'test-value')
    expect(mockMmkv.set).toHaveBeenCalledWith('test-key', 'test-value')
  })
})
