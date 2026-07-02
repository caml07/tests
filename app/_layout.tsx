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
import * as ExpoSplash from 'expo-splash-screen'

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { queryPersisterStorage } from '@/src/shared/services/mmkvStorage'

import { useNetInfo } from '@react-native-community/netinfo'
import { useAuthStore } from '@/src/features/auth/store/authStore'
import { useScreenOrientation } from '@/src/shared/hooks/useScreenOrientation'
import { authenticateWithBiometrics } from '@/src/shared/services/biometricAuth'
import { useToast } from '@/src/shared/hooks/useToast'
import { ToastProvider } from '@/src/shared/providers/ToastProvider'
import { SplashScreen as Splash } from '@/src/shared/organisms/SplashScreen'
import { getDb, getDbSync, invalidateDb } from '@/src/shared/services/database'
import { flushQueue, syncAll } from '@/src/shared/services/sync'
import { mmkv } from '@/src/shared/services/mmkvStorage'
import { queryClient } from '@/src/shared/services/queryClient'
import { log, warn as logWarn, error as logError } from '@/src/shared/services/appLogger'

ExpoSplash.preventAutoHideAsync()

export { ErrorBoundary } from 'expo-router'

function DatabaseSync() {
  const toast = useToast()
  const wasOffline = useRef(false)
  const isConnected = useNetInfo().isConnected ?? false
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return
    log('DB-SYNC', 'User authenticated, initializing sync')
    const strU = useAuthStore.getState().user?.id ?? undefined
    ;(async () => {
      try {
        log('DB-SYNC', 'Getting DB for initial sync...')
        const db = await getDb()
        log('DB-SYNC', 'DB obtained, starting syncAll...')
        const ok = await syncAll(db, queryClient, strU)
        log('DB-SYNC', `Initial sync result: ${ok}`)
        if (!ok) toast.show({ message: 'No se pudo sincronizar, mostrando datos locales', icon: 'exclamationmark.triangle.fill' })
      } catch (e) {
        logError('DB-SYNC', 'Initial sync threw exception', (e as Error)?.message)
        invalidateDb()
        toast.show({ message: 'Error de sincronización', icon: 'exclamationmark.triangle.fill' })
      }
    })()
    const interval = setInterval(async () => {
      try {
        log('DB-SYNC', 'Interval sync starting...')
        const db = await getDb()
        const ok = await syncAll(db, queryClient, strU)
        log('DB-SYNC', `Interval sync result: ${ok}`)
        if (!ok) toast.show({ message: 'No se pudo sincronizar', icon: 'exclamationmark.triangle.fill' })
      } catch (e) {
        logError('DB-SYNC', 'Interval sync threw exception', (e as Error)?.message)
        invalidateDb()
        toast.show({ message: 'Error de sincronización', icon: 'exclamationmark.triangle.fill' })
      }
    }, 5 * 60 * 1000)
    return () => {
      log('DB-SYNC', 'Clearing sync interval')
      clearInterval(interval)
    }
  }, [isAuthenticated, toast])

  useEffect(() => {
    if (isConnected && wasOffline.current) {
      log('DB-SYNC', 'Reconnected, flushing queue...')
      ;(async () => {
        try {
          const db = getDbSync()
          if (!db) { logWarn('DB-SYNC', 'No DB available for flushQueue'); return }
          const result = await flushQueue(db)
          log('DB-SYNC', `flushQueue result: ${JSON.stringify(result)}`)
          if (result.ok > 0) {
            queryClient.invalidateQueries({ queryKey: ['pedidos'] })
            toast.show({ message: `✓ ${result.ok} pedido${result.ok > 1 ? 's' : ''} (${result.items} item${result.items > 1 ? 's' : ''}) enviado${result.ok > 1 ? 's' : ''} a cocina`, icon: 'checkmark.circle.fill' })
          }
          if (result.failed > 0) {
            toast.show({ message: `Error al enviar ${result.failed} pedido${result.failed > 1 ? 's' : ''}`, icon: 'exclamationmark.triangle.fill' })
          }
        } catch (e) {
          logError('DB-SYNC', 'flushQueue threw', (e as Error)?.message)
          invalidateDb()
        }
      })()
    }
    wasOffline.current = !isConnected
  }, [isConnected, toast])

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
  const [ready, setReady] = useState(false)
  const [isHydrated, setIsHydrated] = useState(() => useAuthStore.persist.hasHydrated())

  useEffect(() => { log('ROOT', 'App started, fonts=' + fontsLoaded + ' hydrated=' + isHydrated) }, [fontsLoaded, isHydrated])

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true)
      return
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      const { user } = useAuthStore.getState()
      if (user?.id) mmkv.set('session-user', user.id)
      setIsHydrated(true)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!isHydrated || !fontsLoaded) return
    ExpoSplash.hideAsync()
    setReady(true)
  }, [isHydrated, fontsLoaded])

  useEffect(() => {
    if (!ready) return
    const { biometricEnabled } = useAuthStore.getState()
    if (!biometricEnabled) return

    ;(async () => {
      const res = await authenticateWithBiometrics()
      if (!res.success) return
      const token = mmkv.getString('biometric-auth-token')
      if (token) {
        mmkv.set('session-token', token)
        useAuthStore.setState({ token, isAuthenticated: true })
      }
    })()
  }, [ready])

  const persister = useMemo(
    () => createSyncStoragePersister({ storage: queryPersisterStorage }),
    []
  )

  if (!ready) return <Splash />

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        queryClient.resumePausedMutations()
      }}
    >
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
    </PersistQueryClientProvider>
  )
}
