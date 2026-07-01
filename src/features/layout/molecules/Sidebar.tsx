import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import { BlurWrapper } from '@/src/shared/atoms/BlurWrapper'
import { Icon, type IconName } from '@/src/shared/atoms/Icon'
import { useResponsive } from '@/src/shared/hooks/useResponsive'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { space, Typography, BorderRadius, shadow } from '@/src/shared/utils/tokens'

interface NavItem {
  icon: IconName
  label: string
  route: string
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'building.2.fill', label: 'Estaciones', route: '/(app)/(tabs)' },
  { icon: 'clock.fill', label: 'Historial', route: '/(app)/(tabs)/history' },
]

const SIDEBAR_EXPANDED = 260
const SIDEBAR_COLLAPSED = 80

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { isCollapsed } = useResponsive()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  const targetWidth = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  const animatedWidth = useAnimatedStyle(() => ({
    width: withTiming(targetWidth, { duration: 300 }),
  }))

  const isActive = (item: NavItem) => {
    if (item.route === '/(app)/(tabs)') {
      return pathname === '/(app)/(tabs)' || pathname.startsWith('/(app)/paciente')
    }
    return pathname.startsWith(item.route)
  }

  return (
    <Animated.View style={[styles.outerShell, animatedWidth, shadow.md]}>
      <BlurWrapper
        intensity={80}
        tint={colorScheme === 'dark' ? 'dark' : 'default'}
        style={styles.blurFill}
      >
        <View style={StyleSheet.absoluteFill} />
      </BlurWrapper>

      <View style={styles.logoContainer}>
        <Icon
          name="building.2"
          tintColor={colors.primary}
          size={isCollapsed ? 28 : 32}
        />
      </View>

      <View style={styles.navContainer}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item)

          return (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as any)}
              style={[
                styles.navItem,
                active && { backgroundColor: colors.primary + '18' },
                isCollapsed && styles.navItemCompact,
              ]}
            >
              <Icon
                name={item.icon}
                tintColor={active ? colors.primary : colors.textTertiary}
                size={24}
              />
              {!isCollapsed && (
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: active ? colors.primary : colors.textSecondary,
                      fontWeight: active ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              )}
            </Pressable>
          )
        })}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  outerShell: {
    height: '100%',
    zIndex: 10,
    position: 'relative',
  },
  blurFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  logoContainer: {
    paddingVertical: space[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  navContainer: {
    flex: 1,
    gap: space[2],
    paddingHorizontal: space[3],
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[3],
    borderRadius: BorderRadius.md,
    gap: space[3],
  },
  navItemCompact: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navLabel: {
    ...Typography.callout,
  },
})
