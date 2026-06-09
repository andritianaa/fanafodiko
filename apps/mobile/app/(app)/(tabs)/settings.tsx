import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Bell,
  LogOut,
  RefreshCw,
  ChevronRight,
  Info,
  WifiOff,
  Database,
  Mail,
  AlertTriangle,
  Camera,
  X,
  HelpCircle,
} from "lucide-react-native";
import { useStore, selectAppState } from "../../../src/store/useStore";
import { fullSync } from "../../../src/sync/syncService";
import { bugReportApi } from "../../../src/api/client";
import { authApi, preferencesApi } from "../../../src/api/client";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { colors, spacing, radius, shadows } from "../../../src/theme";
import type { NotificationPreferences } from "../../../src/types";

function SettingRow({
  icon,
  label,
  subtitle,
  onPress,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      {right ??
        (onPress ? <ChevronRight size={18} color={colors.textMuted} /> : null)}
    </Wrapper>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const appState = useStore(selectAppState);
  const notifEnabled = useStore((s) => s.notificationsEnabled);
  const setNotifEnabled = useStore((s) => s.setNotificationsEnabled);
  const clearAuth = useStore((s) => s.clearAuth);

  const [syncing, setSyncing] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState<NotificationPreferences | null>(
    null,
  );
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugDesc, setBugDesc] = useState("");
  const [bugSending, setBugSending] = useState(false);
  const [bugScreenshots, setBugScreenshots] = useState<string[]>([]);

  const pickScreenshot = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.5,
      allowsMultipleSelection: true,
      selectionLimit: 3,
    });
    if (!result.canceled) {
      const b64s = result.assets.map((a) => `data:image/jpeg;base64,${a.base64}`);
      setBugScreenshots((prev) => [...prev, ...b64s].slice(0, 3));
    }
  };

  useEffect(() => {
    if (!appState.isOnline) return;
    preferencesApi
      .get()
      .then(setEmailPrefs)
      .catch(() => {});
  }, [appState.isOnline]);

  const handleTogglePref = async (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => {
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

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fullSync();
    } catch {}
    setSyncing(false);
  };

  const handleSendBugReport = async () => {
    if (bugDesc.trim().length < 10) {
      Alert.alert(
        "Description trop courte",
        "Décrivez le problème en au moins 10 caractères.",
      );
      return;
    }
    setBugSending(true);
    try {
      const screen = Dimensions.get("screen");
      await bugReportApi.create({
        description: bugDesc.trim(),
        screenshots: bugScreenshots,
        deviceInfo: {
          platform: Platform.OS as "ios" | "android",
          osVersion: String(Platform.Version),
          screenSize: `${Math.round(screen.width)}x${Math.round(screen.height)}`,
          language: "fr",
        },
      });
      Alert.alert(
        "Merci !",
        "Votre signalement a bien été envoyé. Notre équipe l'examinera.",
      );
      setBugDesc("");
      setBugScreenshots([]);
      setBugReportOpen(false);
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible d'envoyer le signalement. Vérifiez votre connexion.",
      );
    } finally {
      setBugSending(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          // Supprimer le push token avant de déconnecter
          try {
            const token = await AsyncStorage.getItem("expo_push_token");
            if (token) await authApi.removePushToken(token).catch(() => {});
          } catch {}
          clearAuth();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const lastSync = appState.lastSyncAt
    ? new Date(appState.lastSyncAt).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Jamais";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Réglages</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {user?.email[0]?.toUpperCase() ?? "?"}
              </Text>
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
            icon={
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: appState.isOnline
                      ? colors.success
                      : colors.error,
                  },
                ]}
              />
            }
            label={appState.isOnline ? "En ligne" : "Hors ligne"}
            subtitle={
              appState.isOnline
                ? "Connecté au serveur"
                : "Mode hors ligne actif"
            }
          />
          <View style={styles.div} />
          <SettingRow
            icon={<RefreshCw size={18} color={colors.primary} />}
            label="Synchroniser maintenant"
            subtitle={`Dernière sync : ${lastSync}`}
            onPress={handleSync}
            right={
              syncing ? (
                <Text
                  style={{
                    fontFamily: "FunnelDisplay_600SemiBold",
                    fontSize: 12,
                    color: colors.primary,
                  }}
                >
                  …
                </Text>
              ) : undefined
            }
          />
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
                thumbColor={notifEnabled ? colors.primary : "#FFF"}
              />
            }
          />
        </View>

        <Text style={styles.sectionTitle}>
          Notifications email, Utilisateur
        </Text>
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
                subtitle="Email de rappel lors d'une prise programmée"
                right={
                  <Switch
                    value={emailPrefs.emailMedicationReminders}
                    onValueChange={(v) =>
                      handleTogglePref("emailMedicationReminders", v)
                    }
                    disabled={prefsLoading}
                    trackColor={{
                      false: colors.border,
                      true: colors.primaryLight,
                    }}
                    thumbColor={
                      emailPrefs.emailMedicationReminders
                        ? colors.primary
                        : "#FFF"
                    }
                  />
                }
              />
              <View style={styles.div} />
              <SettingRow
                icon={<Mail size={18} color={colors.primary} />}
                label="Décision demande de pharmacie"
                subtitle="Email lors de l'approbation ou du refus de votre demande"
                right={
                  <Switch
                    value={emailPrefs.emailPharmacyRequestDecision}
                    onValueChange={(v) =>
                      handleTogglePref("emailPharmacyRequestDecision", v)
                    }
                    disabled={prefsLoading}
                    trackColor={{
                      false: colors.border,
                      true: colors.primaryLight,
                    }}
                    thumbColor={
                      emailPrefs.emailPharmacyRequestDecision
                        ? colors.primary
                        : "#FFF"
                    }
                  />
                }
              />
              <View style={styles.div} />
              <SettingRow
                icon={<Mail size={18} color={colors.primary} />}
                label="Mise à jour signalement"
                subtitle="Email quand votre signalement de bug est traité"
                right={
                  <Switch
                    value={emailPrefs.emailBugReportUpdate}
                    onValueChange={(v) =>
                      handleTogglePref("emailBugReportUpdate", v)
                    }
                    disabled={prefsLoading}
                    trackColor={{
                      false: colors.border,
                      true: colors.primaryLight,
                    }}
                    thumbColor={
                      emailPrefs.emailBugReportUpdate ? colors.primary : "#FFF"
                    }
                  />
                }
              />
              <View style={[styles.row, { paddingTop: 4, paddingBottom: 0 }]}>
                <View style={styles.rowIcon} />
                <Text
                  style={[
                    styles.rowSub,
                    { color: colors.textMuted, fontSize: 11 },
                  ]}
                >
                  Les notifications push et in-app ne peuvent pas être
                  désactivées.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.row}>
              <Text style={styles.rowSub}>Chargement des préférences…</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>
          Notifications email, Membre de pharmacie
        </Text>
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
                label="Nouvelle demande de médicament"
                subtitle="Email quand un patient recherche un médicament près de votre pharmacie"
                right={
                  <Switch
                    value={emailPrefs.emailMedSearchResponse}
                    onValueChange={(v) =>
                      handleTogglePref("emailMedSearchResponse", v)
                    }
                    disabled={prefsLoading}
                    trackColor={{
                      false: colors.border,
                      true: colors.primaryLight,
                    }}
                    thumbColor={
                      emailPrefs.emailMedSearchResponse
                        ? colors.primary
                        : "#FFF"
                    }
                  />
                }
              />
              <View style={styles.div} />
              <SettingRow
                icon={<Mail size={18} color={colors.primary} />}
                label="Invitation à gérer une pharmacie"
                subtitle="Email lors d'une invitation à rejoindre une pharmacie"
                right={
                  <Switch
                    value={emailPrefs.emailPharmacyInvitation}
                    onValueChange={(v) =>
                      handleTogglePref("emailPharmacyInvitation", v)
                    }
                    disabled={prefsLoading}
                    trackColor={{
                      false: colors.border,
                      true: colors.primaryLight,
                    }}
                    thumbColor={
                      emailPrefs.emailPharmacyInvitation
                        ? colors.primary
                        : "#FFF"
                    }
                  />
                }
              />
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

        <Text style={styles.sectionTitle}>Aide</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<HelpCircle size={18} color={colors.primary} />}
            label="Centre d'aide & FAQ"
            subtitle="Trouvez une réponse à vos questions"
            onPress={() => router.push('/(app)/help')}
          />
          <View style={styles.div} />
          <SettingRow
            icon={<AlertTriangle size={18} color="#d97706" />}
            label="Signaler un problème"
            subtitle="Nous aider à améliorer l'application"
            onPress={() => setBugReportOpen(true)}
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

        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.xxl,
            marginTop: spacing.md,
          }}
        >
          <Button
            label="Se déconnecter"
            onPress={handleLogout}
            variant="danger"
            fullWidth
            icon={<LogOut size={18} color="#FFF" />}
          />
        </View>
      </ScrollView>

      {/* ── Modal signalement ────────────────────────────────────────────────── */}
      <Modal
        visible={bugReportOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBugReportOpen(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Signaler un problème</Text>
            <TouchableOpacity
              onPress={() => setBugReportOpen(false)}
              style={styles.modalClose}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          >
            <Text style={styles.modalLabel}>Description *</Text>
            <TextInput
              style={styles.modalTextarea}
              value={bugDesc}
              onChangeText={setBugDesc}
              placeholder="Décrivez le problème rencontré : ce que vous faisiez, ce qui s'est passé, comment le reproduire…"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.modalHint}>
              {bugDesc.length} car. / min. 10
            </Text>

            {/* Screenshots */}
            <View>
              <Text style={styles.modalLabel}>Captures d'écran (optionnel)</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {bugScreenshots.map((uri, i) => (
                  <View key={i} style={{ position: 'relative' }}>
                    <Image source={{ uri }} style={{ width: 80, height: 80, borderWidth: 1, borderColor: colors.border }} />
                    <TouchableOpacity
                      onPress={() => setBugScreenshots((p) => p.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: -6, right: -6, backgroundColor: colors.error, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'FunnelDisplay_700Bold' }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {bugScreenshots.length < 3 && (
                  <TouchableOpacity
                    onPress={pickScreenshot}
                    style={{ width: 80, height: 80, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    <Camera size={20} color={colors.textMuted} strokeWidth={1.5} />
                    <Text style={{ fontFamily: 'FunnelDisplay_400Regular', fontSize: 10, color: colors.textMuted }}>Ajouter</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.modalHint}>Max. 3 captures</Text>
            </View>

            <View style={styles.deviceInfoBox}>
              <Text style={styles.deviceInfoTitle}>
                Infos collectées automatiquement
              </Text>
              <Text style={styles.deviceInfoText}>
                📱 {Platform.OS === "ios" ? "iOS" : "Android"}{" "}
                {Platform.Version}
                {"\n"}📐 {Math.round(Dimensions.get("screen").width)}×
                {Math.round(Dimensions.get("screen").height)} px
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              label="Annuler"
              onPress={() => setBugReportOpen(false)}
              variant="outline"
              style={{ flex: 1 }}
            />
            <Button
              label={bugSending ? "Envoi…" : "Envoyer"}
              onPress={handleSendBugReport}
              disabled={bugSending || bugDesc.trim().length < 10}
              style={{ flex: 1 }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  screenTitle: {
    fontFamily: "FunnelDisplay_800ExtraBold",
    fontSize: 26,
    color: colors.text,
  },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sectionTitle: {
    fontFamily: "FunnelDisplay_700Bold",
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: spacing.lg,
    paddingBottom: 6,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLighter,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontFamily: "FunnelDisplay_600SemiBold",
    fontSize: 15,
    color: colors.text,
  },
  rowSub: {
    fontFamily: "FunnelDisplay_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  div: { height: 1, backgroundColor: colors.divider, marginLeft: 64 },
  dot: { width: 10, height: 10, borderRadius: 0 },
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: "FunnelDisplay_700Bold",
    fontSize: 18,
    color: colors.text,
  },
  modalClose: { padding: 4 },
  modalLabel: {
    fontFamily: "FunnelDisplay_700Bold",
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  modalTextarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: "FunnelDisplay_400Regular",
    fontSize: 14,
    color: colors.text,
    minHeight: 140,
    backgroundColor: colors.surface,
  },
  modalHint: {
    fontFamily: "FunnelDisplay_400Regular",
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "right",
  },
  deviceInfoBox: {
    backgroundColor: colors.primaryLighter,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  deviceInfoTitle: {
    fontFamily: "FunnelDisplay_700Bold",
    fontSize: 12,
    color: colors.primary,
    marginBottom: 4,
  },
  deviceInfoText: {
    fontFamily: "FunnelDisplay_400Regular",
    fontSize: 12,
    color: colors.primary,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: "FunnelDisplay_800ExtraBold",
    fontSize: 24,
    color: colors.primary,
  },
  email: { fontFamily: "FunnelDisplay_700Bold", fontSize: 15, color: colors.text },
  userId: {
    fontFamily: "FunnelDisplay_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
