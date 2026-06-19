import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native'
import { Icon } from '@/src/components/atoms/Icon'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heightPercentageToDP as hp } from 'react-native-responsive-screen'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { Button, Input, Checkbox } from '@/src/components/atoms'
import { useAuth } from '@/src/hooks/useAuth'
import { loginSchema, LoginFormData } from '@/src/utils/validation'
import { space, Typography, BorderRadius, shadow } from '@/src/utils/tokens'

export function LoginScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()
  const { login, isLoading, error, clearError } = useAuth()
  const [rememberMe, setRememberMe] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usuario: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    await login({ usuario: data.usuario, password: data.password }, rememberMe)
  }

  return (
    <KeyboardAvoidingView
      style={[styles.wrapper, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + hp('6%') }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={[styles.logoWrapper, shadow.lg]}>
            <Image
              source={require('@/assets/images/hospital_vivian_pellas.png')}
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

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Controller
            control={control}
            name="usuario"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Usuario"
                leftIcon="person.fill"
                value={value}
                onChangeText={onChange}
                onBlur={() => { onBlur(); clearError() }}
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
                onBlur={() => { onBlur(); clearError() }}
                secureTextEntry
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
            <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
              <View style={styles.errorRow}>
                <Icon name="exclamationmark.circle.fill" tintColor={colors.error} size={16} />
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: space[6],
    alignItems: 'center',
  },
  hero: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[6],
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    ...Typography.display,
    marginBottom: space[1],
  },
  subtitle: {
    ...Typography.title3,
    marginBottom: space[0],
  },
  desc: {
    ...Typography.body,
    marginBottom: space[8],
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: space[6],
    gap: space[4],
  },
  submit: {
    width: '100%',
    borderRadius: BorderRadius.full,
    marginTop: space[1],
  },
  errorBox: {
    padding: space[3],
    borderRadius: BorderRadius.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  errorText: {
    ...Typography.footnote,
    flex: 1,
    fontWeight: '600',
  },
})
