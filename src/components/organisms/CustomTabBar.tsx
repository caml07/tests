import { Text, Pressable, View, StyleSheet } from 'react-native'
import type { ReactNode } from 'react'
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, space, BorderRadius, spring } from '@/src/utils/tokens'

function TabItem({
  route,
  isFocused,
  options,
  onPress,
}: {
  route: { key: string; name: string }
  isFocused: boolean
  options: {
    title?: string
    tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => ReactNode
    tabBarLabel?: string | ReactNode
  }
  onPress: () => void
}) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = () => {
    scale.value = withSpring(0.85, spring.snappy)
    setTimeout(() => { scale.value = withSpring(1, spring.gentle) }, 100)
    onPress()
  }

  const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title || route.name

  return (
    <Pressable onPress={handlePress} style={styles.tab}>
      <Animated.View
        style={[
          styles.tabInner,
          isFocused && { backgroundColor: colors.primaryLight },
          animStyle,
        ]}
      >
        {options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? colors.primary : colors.textTertiary,
          size: 24,
        })}
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color: isFocused ? colors.primary : colors.textTertiary },
          isFocused && styles.labelActive,
        ]}
      >
        {label}
      </Text>
      {isFocused && <View style={[styles.activeBar, { backgroundColor: colors.primary }]} />}
    </Pressable>
  )
}

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      ]}
    >
      {state.routes.map((route: { key: string; name: string }, i: number) => {
        const isFocused = state.index === i
        const { options } = descriptors[route.key]
        return (
          <TabItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            options={options}
            onPress={() => {
              if (!isFocused) navigation.navigate(route.name)
            }}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: space[1],
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: space[0],
    paddingTop: space[1],
    position: 'relative',
  },
  tabInner: {
    width: 48,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.tab,
    marginBottom: space[1],
  },
  labelActive: {
    fontWeight: '600',
  },
  activeBar: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 3,
    borderRadius: BorderRadius.full,
  },
})
