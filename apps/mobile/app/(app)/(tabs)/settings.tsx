import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Server, Bell, LogOut, RefreshCw, ChevronRight, Info, WifiOff, Database, Mail,
} from 'lucide-react-native';
import { useStore, selectAppState } from '../../../src/store/useStore';
import { fullSync } from '../../../src/sync/syncService';
import { scheduleAllNotifications, requestNotificationPermissions } from '../../../src/notifications/scheduler';
import { setApiUrl as saveApiUrl } from '../../../src/api/client';
import { authApi, preferencesApi } from '../../../src/api/client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { colors, spacing, radius, shadows } from '../../../src/theme';
import type { NotificationPreferences } from '../../../src/types';

function SettingRow({ icon, label, subtitle, onPress, right }: {
  icon: React.ReactNode; label: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      {right ?? (onPress ? <ChevronRight size={18} color={colors.textMuted} /> : null)}
    </Wrapper>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const appState = useStore(selectAppState);
  const apiUrl = useStore((s) => s.apiUrl);
  const notifEnabled = useStore((s) => s.notificationsEnabled);
  const setStoreApiUrl = useStore((s) => s.setApiUrl);
  const setNotifEnabled = useStore((s) => s.setNotificationsEnabled);
  const clearAuth = useStore((s) => s.clearAuth);

  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(apiUrl);
  const [syncing, setSyncing] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);

  useEffect(() => {
    if (!appState.isOnline) return;
    preferencesApi.get()
      .then(setEmailPrefs)
      .catch(() => {});
  }, [appState.isOnline]);

  const handleTogglePref = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!emailPrefs || !appState.isOnline) return;
    const updated = { ...emailPrefs, [key]: value };
    setEmailPrefs(updated);
    setPrefsLoading(true);
    try {
      const saved = await preferencesApi.update({ [key]: value });
      setEmailPrefs(saved);
    } catch {
      setEmailPrefs(emailPrefs); // Revert
    } finally {
      setPrefsLoading(false);
    }
  };

  const handleSaveUrl = async () => {
    const cleaned = urlInput.replace(/\/$/, '');
    setStoreApiUrl(cleaned);
    await saveApiUrl(cleaned);
    setEditingUrl(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try { await fullSync(); } catch {}
    setSyncing(false);
  };

  const handleReschedule = async () => {
    const ok = await requestNotificationPermissions();
    if (!ok) { Alert.alert('Permissions', 'Activez les notifications dans les réglages de l\'appareil.'); return; }
    const count = await scheduleAllNotifications();
    Alert.alert('Planifié', `${count} notifications programmées pour les 30 prochains jours.`);
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter', style: 'destructive',
        onPress: async () => {
          // Supprimer le push token avant de déconnecter
          try {
            const token = await AsyncStorage.getItem('expo_push_token');
            if (token) await authApi.removePushToken(token).catch(() => {});
          } catch {}
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const lastSync = appState.lastSyncAt
    ? new Date(appState.lastSyncAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Jamais';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}><Text style={styles.screenTitle}>Réglages</Text></View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{user?.email[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View>
              <Text style={styles.email}>{user?.email}</Text>
              <Text style={styles.userId}>ID : {user?.id?.slice(0, 10)}…</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Synchronisation</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<View style={[styles.dot, { backgroundColor: appState.isOnline ? colors.success : colors.error }]} />}
            label={appState.isOnline ? 'En ligne' : 'Hors ligne'}
            subtitle={appState.isOnline ? 'Connecté au serveur' : 'Mode hors ligne actif'}
          />
          <View style={styles.div} />
          <SettingRow
            icon={<RefreshCw size={18} color={colors.primary} />}
            label="Synchroniser maintenant"
            subtitle={`Dernière sync : ${lastSync}`}
            onPress={handleSync}
            right={syncing ? <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: colors.primary }}>…</Text> : undefined}
          />
        </View>

        <Text style={styles.sectionTitle}>Serveur API</Text>
        <View style={styles.card}>
          {editingUrl ? (
            <View style={{ padding: spacing.md }}>
              <Input
                label="URL du serveur"
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="http://192.168.1.x:3000"
                autoCapitalize="none"
                autoCorrect={false}
                hint="IP de votre machine hébergeant le backend"
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button label="Annuler" onPress={() => { setEditingUrl(false); setUrlInput(apiUrl); }} variant="outline" size="sm" style={{ flex: 1 }} />
                <Button label="Enregistrer" onPress={handleSaveUrl} size="sm" style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <SettingRow
              icon={<Server size={18} color={colors.primary} />}
              label="URL du backend"
              subtitle={apiUrl}
              onPress={() => setEditingUrl(true)}
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>Notifications locales</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<Bell size={18} color={colors.primary} />}
            label="Notifications locales"
            subtitle="Rappels pour chaque prise de médicament"
            right={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notifEnabled ? colors.primary : '#FFF'}
              />
            }
          />
          <View style={styles.div} />
          <SettingRow
            icon={<RefreshCw size={18} color={colors.primary} />}
            label="Re-planifier 30 jours"
            subtitle="Programme les notifications des 30 prochains jours"
            onPress={handleReschedule}
          />
        </View>

        <Text style={styles.sectionTitle}>Notifications email</Text>
        <View style={styles.card}>
          {!appState.isOnline ? (
            <View style={[styles.row, { gap: 10 }]}>
              <WifiOff size={16} color={colors.warning} />
              <Text style={[styles.rowSub, { color: colors.warning }]}>
                Connexion requise pour modifier les préférences email
              </Text>
            </View>
          ) : emailPrefs ? (
            <>
              <SettingRow
                icon={<Mail size={18} color={colors.primary} />}
                label="Rappels médicaments"
                subtitle="Recevoir des emails de rappel de prise"
                right={
                  <Switch
                    value={emailPrefs.emailMedicationReminders}
                    onValueChange={(v) => handleTogglePref('emailMedicationReminders', v)}
                    disabled={prefsLoading}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={emailPrefs.emailMedicationReminders ? colors.primary : '#FFF'}
                  />
                }
              />
              <View style={styles.div} />
              <SettingRow
                icon={<Mail size={18} color={colors.primary} />}
                label="Réponses recherche"
                subtitle="Recevoir un email à chaque réponse pharmacie"
                right={
                  <Switch
                    value={emailPrefs.emailMedSearchResponse}
                    onValueChange={(v) => handleTogglePref('emailMedSearchResponse', v)}
                    disabled={prefsLoading}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={emailPrefs.emailMedSearchResponse ? colors.primary : '#FFF'}
                  />
                }
              />
              <View style={styles.div} />
              <SettingRow
                icon={<Mail size={18} color={colors.primary} />}
                label="Invitations pharmacie"
                subtitle="Recevoir un email lors d'une invitation à rejoindre une pharmacie"
                right={
                  <Switch
                    value={emailPrefs.emailPharmacyInvitation}
                    onValueChange={(v) => handleTogglePref('emailPharmacyInvitation', v)}
                    disabled={prefsLoading}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={emailPrefs.emailPharmacyInvitation ? colors.primary : '#FFF'}
                  />
                }
              />
              <View style={[styles.row, { paddingTop: 4, paddingBottom: 0 }]}>
                <View style={styles.rowIcon} />
                <Text style={[styles.rowSub, { color: colors.textMuted, fontSize: 11 }]}>
                  Les notifications push et in-app ne peuvent pas être désactivées.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.row}>
              <Text style={styles.rowSub}>Chargement des préférences…</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Données</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<Database size={18} color={colors.primary} />}
            label="Stockage local"
            subtitle="Données stockées sur l'appareil (SQLite)"
          />
          <View style={styles.div} />
          <SettingRow
            icon={<WifiOff size={18} color={colors.primary} />}
            label="Mode hors-ligne"
            subtitle="Fonctionne sans connexion, synchronisation au retour en ligne"
          />
        </View>

        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<Info size={18} color={colors.primary} />}
            label="Fanafodiko"
            subtitle="v1.0.0 · Expo SDK 54"
          />
        </View>

        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, marginTop: spacing.md }}>
          <Button
            label="Se déconnecter"
            onPress={handleLogout}
            variant="danger"
            fullWidth
            icon={<LogOut size={18} color="#FFF" />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  screenTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 26, color: colors.text },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.lg,
    paddingBottom: 6,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: colors.text },
  rowSub: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  div: { height: 1, backgroundColor: colors.divider, marginLeft: 64 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, color: colors.primary },
  email: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: colors.text },
  userId: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
