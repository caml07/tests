import { View, StyleSheet } from 'react-native'
import { Sidebar } from '@/src/features/layout/molecules/Sidebar'

interface TabletHomeShellProps {
  children: React.ReactNode
}

export function TabletHomeShell({ children }: TabletHomeShellProps) {
  return (
    <View style={styles.container}>
      <Sidebar />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    marginLeft: 8,
  },
})
