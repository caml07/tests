import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Pressable,
  Alert,
  InteractionManager,
} from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { Icon } from "@/src/shared/atoms/Icon";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { Button, Input, Checkbox } from "@/src/shared/atoms";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { loginSchema, LoginFormData } from "@/src/shared/utils/validation";
import {
  space,
  Typography,
  BorderRadius,
  shadow,
} from "@/src/shared/utils/tokens";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { authenticateWithBiometrics } from "@/src/shared/services/biometricAuth";
import { mmkv } from "@/src/shared/services/mmkvStorage";

export function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { login, isLoading, error, clearError } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);

  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT,
    ).catch(() => {});
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usuario: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    await login({ usuario: data.usuario, password: data.password }, rememberMe);
    const store = useAuthStore.getState();
    if (store.isAuthenticated && rememberMe && !mmkv.getBoolean('biometric-offered')) {
      mmkv.set('biometric-offered', true)
      InteractionManager.runAfterInteractions(() => {
        Alert.alert(
          "Activar acceso biométrico",
          "¿Deseas usar tu huella/Face ID para iniciar sesión?",
          [
            { text: "No", onPress: () => {} },
            {
              text: "Sí",
              onPress: async () => {
                const res = await authenticateWithBiometrics();
                if (res.success) {
                  await store.setBiometricEnabled(true);
                }
              },
            },
          ],
        );
      })
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.wrapper, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.container,
          {
            flexGrow: 1,
            paddingTop: insets.top + space[12],
            paddingBottom: insets.bottom + space[4],
          },
        ]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={[styles.logoWrapper, shadow.lg]}>
            <Image
              source={require("@/assets/images/hospital_vivian_pellas.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Logo Hospital Vivian Pellas"
            />
          </View>
        </View>

        <Text style={[styles.appName, { color: colors.text }]}>Dietas</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Hospital Vivian Pellas
        </Text>
        <Text style={[styles.desc, { color: colors.textTertiary }]}>
          Comanda de dietas para enfermería
        </Text>

        <View
          style={[styles.formCard, { backgroundColor: colors.card }, shadow.sm]}
        >
          <Controller
            control={control}
            name="usuario"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Usuario"
                leftIcon="person.fill"
                value={value}
                onChangeText={onChange}
                onBlur={() => {
                  onBlur();
                  clearError();
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                error={errors.usuario?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Contraseña"
                leftIcon="lock.fill"
                value={value}
                onChangeText={onChange}
                onBlur={() => {
                  onBlur();
                  clearError();
                }}
                secureTextEntry
                autoComplete="off"
                textContentType="password"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                error={errors.password?.message}
              />
            )}
          />

          <Checkbox
            checked={rememberMe}
            onValueChange={setRememberMe}
            label="Recordarme"
          />

          {error ? (
            <View
              style={[styles.errorBox, { backgroundColor: colors.errorLight }]}
            >
              <View style={styles.errorRow}>
                <Icon
                  name="exclamationmark.circle.fill"
                  tintColor={colors.error}
                  size={16}
                />
                <Text
                  style={[styles.errorText, { color: colors.error }]}
                  accessibilityLiveRegion="polite"
                >
                  {error}
                </Text>
              </View>
            </View>
          ) : null}

          <Button
            title="Ingresar"
            icon="arrow.right"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            style={styles.submit}
            accessibilityLabel="Iniciar sesión"
          />

          {biometricEnabled && (
            <Pressable
              onPress={async () => {
              const res = await authenticateWithBiometrics();
                if (res.success) {
                  const token = mmkv.getString("biometric-auth-token");
                  if (token) {
                    useAuthStore.setState({ token, isAuthenticated: true });
                  }
                }
              }}
              style={{ marginTop: space[2], alignItems: "center" }}
              accessibilityLabel="Iniciar sesión con biometría"
            >
              <Icon name="fingerprint" size={24} tintColor={colors.text} />
              <Text
                style={{
                  color: colors.text,
                  marginTop: space[1],
                  ...Typography.footnote,
                }}
              >
                Ingresar con biometría
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    justifyContent: "center",
    paddingHorizontal: space[8],
    alignItems: "center",
  },
  hero: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space[8],
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    ...Typography.loraItalic,
    fontSize: 34,
    lineHeight: 44,
    paddingBottom: 4,
    marginBottom: space[1],
  },
  subtitle: {
    ...Typography.title3,
    marginBottom: space[0],
  },
  desc: {
    ...Typography.body,
    marginBottom: space[10],
  },
  formCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: space[6],
    gap: space[5],
  },
  submit: {
    width: "100%",
    borderRadius: BorderRadius.full,
    marginTop: space[2],
  },
  errorBox: {
    padding: space[3],
    borderRadius: BorderRadius.md,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  errorText: {
    ...Typography.footnote,
    flex: 1,
    fontWeight: "600",
  },
});
