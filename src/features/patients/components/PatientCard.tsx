import { View, Text, StyleSheet } from 'react-native'
import { Icon, type IconName } from '@/src/shared/atoms/Icon'
import { PressableScale } from '@/src/shared/atoms/PressableScale'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, BorderRadius, space, shadow } from '@/src/shared/utils/tokens'
import { Patient, ParsedAlergia } from '@/src/shared/types'

interface PatientCardProps {
  patient: Patient & { dietaNombre: string; dietaSimbolo?: string; alergias: ParsedAlergia[] }
  onPress?: () => void
}

const SEXO_ICON: Record<string, IconName> = {
  M: 'mars.fill',
  F: 'venus.fill',
}

function CardInner({ patient, colors }: { patient: Patient & { dietaNombre: string; dietaSimbolo?: string; alergias: ParsedAlergia[] }; colors: typeof Colors.light | typeof Colors.dark }) {
  const showAlergias = (patient.alergias?.length ?? 0) > 0
  const showNotas = !!patient.notas
  const sexoIcon = SEXO_ICON[patient.sexo ?? ''] || null

  return (
    <View style={[styles.card, shadow.sm, { backgroundColor: colors.card }]}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.roomBadge, { backgroundColor: colors.primary }]}>
            <Icon name="bed.double.fill" tintColor={colors.white} size={14} />
            <Text style={styles.roomBadgeText}>
              {patient.habitacion} · {patient.cama}
            </Text>
          </View>
          <Icon name="chevron.right" tintColor={colors.textTertiary} size={14} />
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            {sexoIcon ? (
              <Icon name={sexoIcon} tintColor={colors.primary} size={22} />
            ) : (
              <Icon name="person.fill" tintColor={colors.primary} size={22} />
            )}
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>
              {patient.nombre}
            </Text>
            {(patient.sexo || patient.edad) && (
              <View style={styles.metaRow}>
                {sexoIcon && <Icon name={sexoIcon} tintColor={colors.textTertiary} size={11} />}
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {[patient.sexo === 'M' ? 'Masculino' : patient.sexo === 'F' ? 'Femenino' : null, patient.edad].filter(Boolean).join(' · ')}
                </Text>
              </View>
            )}
            <View style={styles.dietaRow}>
              <Icon name={(patient.dietaSimbolo || 'questionmark.circle') as IconName} tintColor={colors.textTertiary} size={12} />
              <Text style={[styles.dieta, { color: colors.textSecondary }]}>
                {patient.dietaNombre}
              </Text>
            </View>
          </View>
        </View>
        {showAlergias && (
          <View style={styles.alergiaBubble}>
            <View style={styles.alergiaHeader}>
              <Icon name="exclamationmark.triangle.fill" tintColor={colors.warning} size={14} />
              <Text style={[styles.alergiaLabel, { color: colors.warning }]}>ALERGIAS</Text>
            </View>
            {patient.alergias?.map((alergia, i) => (
              <Text key={i} style={styles.alergiaText} numberOfLines={0}>
                {alergia.lines.map((line, li) => (li > 0 ? '\n' : '') + line).join('')}
              </Text>
            ))}
          </View>
        )}
        {showNotas && (
          <View style={styles.notasRow}>
            <Icon name="note.text" tintColor={colors.textTertiary} size={14} />
            <Text style={[styles.notas, { color: colors.textSecondary }]} numberOfLines={2}>
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
  },
  content: {
    padding: space[5],
    gap: space[3],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: BorderRadius.full,
  },
  roomBadgeText: {
    ...Typography.subhead,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoRow: {
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
  infoContent: {
    flex: 1,
    gap: space[1],
  },
  nombre: {
    ...Typography.headline,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  metaText: {
    ...Typography.footnote,
  },
  dietaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  dieta: {
    ...Typography.footnote,
  },
  alergiaBubble: {
    backgroundColor: '#FFF4E5',
    borderRadius: BorderRadius.md,
    padding: space[3],
    gap: space[1],
    borderWidth: 1,
    borderColor: '#FFB347',
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