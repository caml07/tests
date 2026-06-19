import { View, Text, StyleSheet } from 'react-native'
import { Icon } from '@/src/components/atoms/Icon'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { PressableScale } from '@/src/components/atoms/PressableScale'
import { BorderRadius, Typography, space, color } from '@/src/utils/tokens'

interface CheckboxProps {
  checked: boolean
  onValueChange: (value: boolean) => void
  label: string
}

export function Checkbox({ checked, onValueChange, label }: CheckboxProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  return (
    <PressableScale
      onPress={() => onValueChange(!checked)}
      accessibilityLabel={label}
    >
      <View
        style={styles.row}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <View
          style={[
            styles.box,
            {
              backgroundColor: checked ? colors.primary : color.transparent,
              borderColor: checked ? colors.primary : colors.textTertiary,
            },
          ]}
        >
          {checked && <Icon name="checkmark" tintColor={colors.white} size={14} />}
        </View>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: space[2],
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.body,
  },
})
