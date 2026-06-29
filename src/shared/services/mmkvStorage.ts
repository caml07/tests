import { createMMKV } from 'react-native-mmkv'

export const mmkv = createMMKV({
  id: 'dietas-auth',
  encryptionKey: 'dietas-app-v1',
})

export const zustandStorage = {
  setItem: (name: string, value: string) => mmkv.set(name, value),
  getItem: (name: string) => mmkv.getString(name) ?? null,
  removeItem: (name: string) => mmkv.remove(name),
}

export const queryPersisterStorage = {
  setItem: (key: string, value: string) => mmkv.set(key, value),
  getItem: (key: string) => mmkv.getString(key) ?? null,
  removeItem: (key: string) => mmkv.remove(key),
}
