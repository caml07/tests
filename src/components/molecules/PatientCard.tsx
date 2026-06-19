import { View, Text, StyleSheet } from 'react-native'
import { Icon } from '@/src/components/atoms/Icon'
import { PressableScale } from '@/src/components/atoms/PressableScale'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, BorderRadius, space, shadow } from '@/src/utils/tokens'
import { Patient } from '@/src/types'

interface PatientCardProps {
  patient: Patient & { dietaNombre: string; dietaSimbolo?: string }
  onPress?: () => void
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function CardInner({ patient, colors }: { patient: Patient & { dietaNombre: string; dietaSimbolo?: string }; colors: any }) {
  return (
    <View style={[styles.card, shadow.sm, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials(patient.nombre)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>
              {patient.nombre}
            </Text>
            <View style={styles.ubicacion}>
              <Icon name="bed.double.fill" tintColor={colors.textTertiary} size={12} />
              <Text style={[styles.ubicacionText, { color: colors.textSecondary }]}>
                {' Hab. '}{patient.habitacion} · Cama {patient.cama}
              </Text>
            </View>
            <View style={[styles.dietaBadge, { backgroundColor: colors.primaryLight }]}>
              <Icon name={patient.dietaSimbolo || 'questionmark.circle'} tintColor={colors.primary} size={12} />
              <Text style={[styles.dieta, { color: colors.primary }]}>
                {patient.dietaNombre}
              </Text>
            </View>
          </View>
          <Icon name="chevron.right" tintColor={colors.textTertiary} size={14} />
        </View>

        {patient.alergias.length > 0 && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.tagsRow}>
              <Icon name="exclamationmark.triangle.fill" tintColor={colors.warning} size={14} />
              {patient.alergias.map((alergia, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: colors.warningLight }]}>
                  <Text style={[styles.tagText, { color: colors.warning }]}>{alergia}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {patient.notas ? (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.notasRow}>
              <Icon name="note.text" tintColor={colors.textTertiary} size={14} />
              <Text style={[styles.notas, { color: colors.textSecondary }]}>
                {patient.notas}
              </Text>
            </View>
          </>
        ) : null}
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
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: {
    height: 3,
  },
  content: {
    padding: space[4],
    gap: space[2],
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
  avatarText: {
    ...Typography.headline,
  },
  info: {
    flex: 1,
    gap: space[1],
  },
  nombre: {
    ...Typography.headline,
  },
  ubicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  ubicacionText: {
    ...Typography.footnote,
  },
  dietaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space[1],
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  dieta: {
    ...Typography.caption2,
    fontWeight: '600',
  },
  divider: {
    height: 1,
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
    ...Typography.italic,
    flex: 1,
  },
})
