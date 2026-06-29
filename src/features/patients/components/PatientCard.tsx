import { View, Text, StyleSheet } from 'react-native'
import { Icon, type IconName } from '@/src/shared/atoms/Icon'
import { PressableScale } from '@/src/shared/atoms/PressableScale'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, BorderRadius, space, shadow } from '@/src/shared/utils/tokens'
import { Patient } from '@/src/shared/types'

interface PatientCardProps {
  patient: Patient & { dietaNombre: string; dietaSimbolo?: string }
  onPress?: () => void
}

function CardInner({ patient, colors }: { patient: Patient & { dietaNombre: string; dietaSimbolo?: string }; colors: typeof Colors.light | typeof Colors.dark }) {
  const showAlergias = patient.alergias.length > 0
  const showNotas = !!patient.notas

  return (
    <View style={[styles.card, shadow.sm, { backgroundColor: colors.card }]}>
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Icon name="person.fill" tintColor={colors.primary} size={22} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>
              {patient.nombre}
            </Text>
            <View style={[styles.roomChip, { backgroundColor: colors.primaryLight }]}>
              <Icon name="bed.double.fill" tintColor={colors.primary} size={12} />
              <Text style={[styles.roomText, { color: colors.primary }]}>
                {'Hab. '}{patient.habitacion}{' · Cama '}{patient.cama}
              </Text>
            </View>
            <View style={styles.dietaRow}>
              <Icon name={(patient.dietaSimbolo || 'questionmark.circle') as IconName} tintColor={colors.textTertiary} size={12} />
              <Text style={[styles.dieta, { color: colors.textSecondary }]}>
                {patient.dietaNombre}
              </Text>
            </View>
          </View>
          <Icon name="chevron.right" tintColor={colors.textTertiary} size={14} />
        </View>
        {showAlergias && (
          <View style={styles.tagsRow}>
            <Icon name="exclamationmark.triangle.fill" tintColor={colors.warning} size={14} />
            {patient.alergias.map((alergia, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: colors.warningLight }]}>
                <Text style={[styles.tagText, { color: colors.warning }]}>{alergia}</Text>
              </View>
            ))}
          </View>
        )}
        {showNotas && (
          <View style={styles.notasRow}>
            <Icon name="note.text" tintColor={colors.textTertiary} size={14} />
            <Text style={[styles.notas, { color: colors.textSecondary }]}>
              {patient.notas}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

export function PatientCard({ patient, onPress }: PatientCardProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  if (onPress) {
    return (
      <PressableScale onPress={onPress}>
        <CardInner patient={patient} colors={colors} />
      </PressableScale>
    )
  }

  return <CardInner patient={patient} colors={colors} />
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  content: {
    padding: space[5],
    gap: space[3],
  },
  row: {
    flexDirection: 'row',
    gap: space[3],
    alignItems: 'center',
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
  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  roomText: {
    ...Typography.footnote,
    fontWeight: '700',
  },
  dietaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  dieta: {
    ...Typography.footnote,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: space[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    ...Typography.caption2,
    fontWeight: '500',
  },
  notasRow: {
    flexDirection: 'row',
    gap: space[1],
    alignItems: 'flex-start',
  },
  notas: {
    ...Typography.footnote,
    flex: 1,
  },
})
