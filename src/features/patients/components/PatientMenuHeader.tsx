import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Icon, type IconName } from '@/src/shared/atoms/Icon'
import { Skeleton } from '@/src/shared/atoms'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, BorderRadius, space, Spacing } from '@/src/shared/utils/tokens'
import { ParsedAlergia } from '@/src/shared/types'

const SEXO_ICON: Record<string, IconName> = {
  M: 'mars.fill',
  F: 'venus.fill',
}

interface PatientMenuHeaderProps {
  nombre: string
  habitacion: string
  cama: string
  dietaNombre: string
  dietaSimbolo: IconName
  sexo?: string
  edad?: string
  alergias?: ParsedAlergia[]
  showBack?: boolean
  onBackPress?: () => void
  cartCount?: number
  onCartPress?: () => void
  onHistoryPress?: () => void
}

export function PatientMenuHeader({ nombre, habitacion, cama, dietaNombre, dietaSimbolo, sexo, edad, alergias, showBack, onBackPress, cartCount, onCartPress, onHistoryPress }: PatientMenuHeaderProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const sexoIcon = sexo ? SEXO_ICON[sexo] ?? 'person.fill' : 'person.fill'
  const showAlergias = (alergias?.length ?? 0) > 0

  return (
    <View style={[styles.header, { backgroundColor: colors.surfaceAlt }]}>
      {showBack && onBackPress && (
        <Pressable
          onPress={onBackPress}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Icon name="chevron.left" tintColor={colors.text} size={20} />
        </Pressable>
      )}
      <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
        <Icon name={sexoIcon} tintColor={colors.primary} size={22} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>
          {nombre}
        </Text>
        {(sexo || edad) && (
          <Text style={[styles.room, { color: colors.textSecondary }]}>
            {[sexo === 'M' ? 'Masculino' : sexo === 'F' ? 'Femenino' : null, edad].filter(Boolean).join(' · ')}
          </Text>
        )}
        <Text style={[styles.room, { color: colors.textSecondary }]}>
          Hab. {habitacion} · Cama {cama}
        </Text>
        <View style={styles.dietaRow}>
          <Icon name={dietaSimbolo} tintColor={colors.textTertiary} size={12} />
          <Text style={[styles.dietaText, { color: colors.textSecondary }]}>
            {dietaNombre}
          </Text>
        </View>
        {showAlergias && (
          <View style={[styles.alergiaBubble, { borderColor: colors.warning }]}>
            <View style={styles.alergiaHeader}>
              <Icon name="exclamationmark.triangle.fill" tintColor={colors.warning} size={14} />
              <Text style={[styles.alergiaLabel, { color: colors.warning }]}>ALERGIAS</Text>
            </View>
            {alergias?.map((alergia, i) => (
              <Text key={i} style={styles.alergiaText} numberOfLines={0}>
                {alergia.lines.map((line, li) => (li > 0 ? '\n' : '') + line).join('')}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {onHistoryPress && (
          <Pressable onPress={onHistoryPress} style={styles.actionBtn} hitSlop={8}>
            <Icon name="clock.fill" tintColor={colors.textSecondary} size={22} />
          </Pressable>
        )}
        {onCartPress && (
          <Pressable onPress={onCartPress} style={styles.actionBtn} hitSlop={8}>
            <View>
              <Icon name="cart.fill" tintColor={colors.textSecondary} size={22} />
              {cartCount != null && cartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      </View>
    </View>
  )
}

PatientMenuHeader.Skeleton = function PatientMenuHeaderSkeleton() {
  return (
    <View style={styles.header}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={{ gap: space[1], flex: 1 }}>
        <Skeleton width="60%" height={18} borderRadius={4} />
        <Skeleton width="40%" height={14} borderRadius={4} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: Spacing.screen,
    paddingVertical: space[5],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  dietaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  dietaText: {
    ...Typography.footnote,
  },
  alergiaBubble: {
    backgroundColor: '#FFF4E5',
    borderRadius: BorderRadius.md,
    padding: space[3],
    gap: space[1],
    borderWidth: 1,
  },
  alergiaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  alergiaLabel: {
    ...Typography.caption2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alergiaText: {
    ...Typography.footnote,
    color: '#8B4500',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
})