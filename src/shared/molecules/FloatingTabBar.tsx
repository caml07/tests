import { View, Text, Pressable, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Icon, type IconName } from "@/src/shared/atoms/Icon";
import { BlurWrapper } from "@/src/shared/atoms/BlurWrapper";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BorderRadius, spring, space, Spacing } from "@/src/shared/utils/tokens";
import { useEffect, useRef } from "react";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs/types";

const VISIBLE_NAMES = ["index", "history"] as const;

const TAB_ICON_CONFIG: Record<string, { icon: IconName; label: string }> = {
  index: { icon: "building.2.fill", label: "Estación" },
  history: { icon: "clock.fill", label: "Historial" },
};

const INDICATOR_W = 42;
const INDICATOR_H = 28;
const TAB_BAR_H = 64;

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const visible = state.routes.filter((r) =>
    VISIBLE_NAMES.includes(r.name as any),
  );
  const tabW = (width - 32) / visible.length;

  const indicatorX = useSharedValue(0);
  const mounted = useRef(true);

  useEffect(() => {
    const idx = visible.findIndex(
      (r) => r.key === state.routes[state.index]?.key,
    );
    if (idx === -1) return;

    const x = idx * tabW + (tabW - INDICATOR_W) / 2;

    if (mounted.current) {
      indicatorX.value = x;
      mounted.current = false;
    } else {
      indicatorX.value = withSpring(x, { damping: 60, stiffness: 300 });
    }
  }, [state.index, tabW, visible]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const activeKey = state.routes[state.index]?.key;

  return (
    <BlurWrapper
      intensity={80}
      tint={colorScheme === 'dark' ? 'dark' : 'default'}
      style={{
        position: "absolute",
        bottom: space[6] + insets.bottom,
        left: Spacing.md,
        right: Spacing.md,
        height: TAB_BAR_H,
        borderRadius: BorderRadius.xl,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.surfaceAlt,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 10,
            width: INDICATOR_W,
            height: INDICATOR_H,
            borderRadius: 8,
            backgroundColor: colors.primary + "18",
          },
          indicatorStyle,
        ]}
      />

      <View style={{ flex: 1, flexDirection: "row" }}>
        {visible.map((route) => {
          const cfg =
            TAB_ICON_CONFIG[route.name as keyof typeof TAB_ICON_CONFIG];
          const active = route.key === activeKey;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                navigation.navigate(route.name);
              }}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <Icon
                name={cfg.icon}
                tintColor={active ? colors.primary : colors.textTertiary}
                size={24}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: active ? "600" : "500",
                  color: active ? colors.primary : colors.textSecondary,
                }}
              >
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BlurWrapper>
  );
}
