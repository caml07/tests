if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256)
        return arr
      },
    },
    writable: false,
    configurable: false,
  })
}

import { useEffect, useRef, useState, useMemo } from 'react'
import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { queryPersisterStorage } from '@/src/shared/services/mmkvStorage'
import { SQLiteProvider } from 'expo-sqlite'
import { useNetInfo } from '@react-native-community/netinfo'
import { useAuthStore } from '@/src/features/auth/store/authStore'
import { useScreenOrientation } from '@/src/shared/hooks/useScreenOrientation'
import { authenticateWithBiometrics } from '@/src/shared/services/biometricAuth'
import { useToast } from '@/src/shared/hooks/useToast'
import { ToastProvider } from '@/src/shared/providers/ToastProvider'
import { SplashScreen } from '@/src/shared/organisms/SplashScreen'
import { migrateDbIfNeeded, setDb, getDb } from '@/src/shared/services/database'
import { flushQueue, syncAll } from '@/src/shared/services/sync'
import { mmkv } from '@/src/shared/services/mmkvStorage'
import { queryClient } from '@/src/shared/services/queryClient'

export { ErrorBoundary } from 'expo-router'

function DatabaseSync() {
  const toast = useToast()
  const wasOffline = useRef(false)
  const netInfo = useNetInfo()
  const isConnected = netInfo.isConnected ?? false

  useEffect(() => {
    if (netInfo.isConnected === null) return
    if (isConnected && wasOffline.current) {
      ;(async () => {
        try {
          const result = await flushQueue(await getDb())
          if (result.ok > 0) {
            queryClient.invalidateQueries({ queryKey: ['pedidos'] })
            toast.show({ message: `✓ ${result.ok} pedido${result.ok > 1 ? 's' : ''} enviado${result.ok > 1 ? 's' : ''} a cocina`, icon: 'checkmark.circle.fill' })
          }
          if (result.failed > 0) {
            toast.show({ message: `Error al enviar ${result.failed} pedido${result.failed > 1 ? 's' : ''}`, icon: 'exclamationmark.triangle.fill' })
          }
        } catch {}
      })()
    }
    wasOffline.current = !isConnected
  }, [isConnected, netInfo.isConnected, toast])

  return null
}

export default function RootLayout() {
  useScreenOrientation();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [fontsLoaded] = useFonts({
    PlusJakartaSans: require('@/assets/fonts/PlusJakartaSans[wght].ttf'),
    'PlusJakartaSans-Italic': require('@/assets/fonts/PlusJakartaSans-Italic[wght].ttf'),
    'Lora-Italic': require('@/assets/fonts/Lora-Italic[wght].ttf'),
  })
  const [isHydrated, setIsHydrated] = useState(() => useAuthStore.persist.hasHydrated())

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true))
    return unsub
  }, [])

  useEffect(() => {
    if (!isHydrated || !fontsLoaded) return
    const { biometricEnabled } = useAuthStore.getState()
    if (!biometricEnabled) return

    ;(async () => {
      const res = await authenticateWithBiometrics()
      if (!res.success) return
      const token = mmkv.getString('biometric-auth-token')
      if (token) {
        useAuthStore.setState({ token, isAuthenticated: true })
      }
    })()
  }, [isHydrated, fontsLoaded])

  useEffect(() => {
    if (!isAuthenticated) return
    getDb().then((db) => syncAll(db).then(() => {
      queryClient.invalidateQueries()
    })).catch(() => {})
  }, [isAuthenticated])

  const persister = useMemo(
    () => createSyncStoragePersister({ storage: queryPersisterStorage }),
    []
  )

  if (!isHydrated || !fontsLoaded) return <SplashScreen />

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        queryClient.resumePausedMutations()
      }}
    >
      <SQLiteProvider databaseName="nutricion.db" onInit={async (db) => { await migrateDbIfNeeded(db); setDb(db) }}>
        <ToastProvider>
          <DatabaseSync />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={isAuthenticated}>
              <Stack.Screen name="(app)" />
            </Stack.Protected>
            <Stack.Protected guard={!isAuthenticated}>
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        </ToastProvider>
      </SQLiteProvider>
    </PersistQueryClientProvider>
  )
}
