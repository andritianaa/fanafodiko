import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react-native';
import { authApi, ApiError } from '../../src/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../../src/store/useStore';
import { fullSync } from '../../src/sync/syncService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors, spacing, radius } from '../../src/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useStore((s) => s.setAuth);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Prénom requis';
    if (!form.lastName.trim()) e.lastName = 'Nom requis';
    if (!form.email.trim()) e.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
    if (!form.password) e.password = 'Mot de passe requis';
    else if (form.password.length < 8) e.password = 'Minimum 8 caractères';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await authApi.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      const { token } = await authApi.login(form.email.trim(), form.password);
      await AsyncStorage.setItem('auth_token', token);
      const me = await authApi.me();
      setAuth(me, token);
      fullSync().catch(() => {});
      router.replace('/(app)');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) setErrors({ general: 'Un compte existe déjà avec cet email' });
        else if (err.status === 0) setErrors({ general: 'Serveur inaccessible' });
        else setErrors({ general: err.message });
      } else {
        setErrors({ general: 'Une erreur est survenue' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.primary} />
          </TouchableOpacity>

          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez Fanafodiko pour gérer vos médicaments</Text>

          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Input
              label="Prénom"
              placeholder="Jean"
              value={form.firstName}
              onChangeText={update('firstName')}
              autoCapitalize="words"
              error={errors.firstName}
              required
              containerStyle={styles.halfInput}
              leftIcon={<User size={16} color={colors.textMuted} />}
            />
            <Input
              label="Nom"
              placeholder="Dupont"
              value={form.lastName}
              onChangeText={update('lastName')}
              autoCapitalize="words"
              error={errors.lastName}
              required
              containerStyle={styles.halfInput}
            />
          </View>

          <Input
            label="Email"
            placeholder="jean@exemple.com"
            value={form.email}
            onChangeText={update('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            required
            leftIcon={<Mail size={18} color={colors.textMuted} />}
          />

          <Input
            label="Mot de passe"
            placeholder="Minimum 8 caractères"
            value={form.password}
            onChangeText={update('password')}
            secureTextEntry
            error={errors.password}
            required
            leftIcon={<Lock size={18} color={colors.textMuted} />}
          />

          <Input
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChangeText={update('confirmPassword')}
            secureTextEntry
            error={errors.confirmPassword}
            required
            leftIcon={<Lock size={18} color={colors.textMuted} />}
          />

          <Button
            label="Créer mon compte"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
          />

          <TouchableOpacity onPress={() => router.back()} style={styles.switchLink}>
            <Text style={styles.switchText}>
              Déjà un compte ?{' '}
              <Text style={styles.switchAction}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 26,
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  switchLink: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  switchText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  switchAction: {
    fontFamily: 'Nunito_700Bold',
    color: colors.primary,
  },
});
