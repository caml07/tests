import { View, Text, StyleSheet } from 'react-native'
import { Icon } from '@/src/components/atoms/Icon'
import { Skeleton } from '@/src/components/atoms'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, BorderRadius, space, Spacing } from '@/src/utils/tokens'

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

interface PatientMenuHeaderProps {
  nombre: string
  habitacion: string
  cama: string
  dietaNombre: string
  dietaSimbolo: string
}

export function PatientMenuHeader({ nombre, habitacion, cama, dietaNombre, dietaSimbolo }: PatientMenuHeaderProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  return (
    <>
      <View style={[styles.header, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.initials, { color: colors.primary }]}>
            {getInitials(nombre)}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>
            {nombre}
          </Text>
          <Text style={[styles.room, { color: colors.textSecondary }]}>
            Hab. {habitacion} · Cama {cama}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
            <Icon name={dietaSimbolo} tintColor={colors.primary} size={12} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {dietaNombre}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.accentLine, { backgroundColor: colors.primary }]} />
    </>
  )
}

PatientMenuHeader.Skeleton = function PatientMenuHeaderSkeleton() {
  return (
    <>
      <View style={styles.header}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ gap: space[1], flex: 1 }}>
          <Skeleton width="60%" height={18} borderRadius={4} />
          <Skeleton width="40%" height={14} borderRadius={4} />
        </View>
      </View>
      <View style={[styles.accentLineSkeleton, { backgroundColor: 'transparent' }]} />
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: Spacing.screen,
    paddingVertical: space[4],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...Typography.headline,
  },
  info: {
    flex: 1,
    gap: space[1],
  },
  nombre: {
    ...Typography.headline,
  },
  room: {
    ...Typography.footnote,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space[1],
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    ...Typography.caption2,
    fontWeight: '600',
  },
  accentLine: {
    height: 2,
  },
  accentLineSkeleton: {
    height: 2,
  },
})
