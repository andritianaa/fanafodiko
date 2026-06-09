import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Platform, Modal, TextInput,
  Alert, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, MapPin, Phone, Clock, Calendar, ChevronRight,
  Navigation, MessageCircle, Mail, WifiOff, Store, Image as ImageIcon,
  X as XIcon, Trash2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { pharmacyApi, pharmacyClaimApi } from '../../../src/api/client';
import { getPharmacyById } from '../../../src/db/database';
import { useStore, selectAppState } from '../../../src/store/useStore';
import { colors, spacing, radius, shadows } from '../../../src/theme';
import type { Pharmacy, OpeningHour, ExceptionalSchedule, PharmacyGuard } from '../../../src/types';

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// ── Claim modal ────────────────────────────────────────────────────────────────

function ClaimModal({ pharmacyId, pharmacyName, visible, onClose }: {
  pharmacyId: string;
  pharmacyName: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [contactInfo, setContactInfo] = useState('');
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      base64: true,
      quality: 0.6,
    });
    if (!result.canceled) {
      const b64s = result.assets.map((a) => `data:image/jpeg;base64,${a.base64}`);
      setProofImages((prev) => [...prev, ...b64s].slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    if (!contactInfo.trim()) {
      Alert.alert('Contact requis', 'Veuillez indiquer un téléphone ou un email.');
      return;
    }
    setSubmitting(true);
    try {
      await pharmacyClaimApi.create({
        pharmacyId,
        contactInfo: contactInfo.trim(),
        proofImages,
      });
      Alert.alert(
        'Réclamation envoyée',
        'Notre équipe examinera votre demande et vous contactera sous peu.',
        [{ text: 'OK', onPress: () => { onClose(); setContactInfo(''); setProofImages([]); } }],
      );
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer la réclamation. Vérifiez votre connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={cm.overlay}>
        <View style={cm.sheet}>
          <View style={cm.header}>
            <Text style={cm.title} numberOfLines={2}>Je suis gérant de {pharmacyName}</Text>
            <TouchableOpacity onPress={onClose} style={cm.closeBtn}>
              <XIcon size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={cm.desc}>
            Indiquez vos coordonnées et joignez des pièces justificatives. Notre équipe vous contactera pour vérification.
          </Text>

          <Text style={cm.label}>Contact <Text style={cm.req}>*</Text></Text>
          <TextInput
            style={cm.input}
            placeholder="Téléphone ou e-mail"
            placeholderTextColor={colors.textMuted}
            value={contactInfo}
            onChangeText={setContactInfo}
            keyboardType="default"
            autoCapitalize="none"
          />

          <Text style={cm.label}>Pièces justificatives ({proofImages.length}/5)</Text>
          {proofImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={cm.imgRow}>
              {proofImages.map((uri, i) => (
                <View key={i} style={cm.imgWrap}>
                  <TouchableOpacity
                    style={cm.imgRemove}
                    onPress={() => setProofImages((p) => p.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={cm.pickBtn} onPress={pickImages} disabled={proofImages.length >= 5}>
            <ImageIcon size={16} color={colors.primary} />
            <Text style={cm.pickBtnText}>Ajouter des images</Text>
          </TouchableOpacity>

          <View style={cm.actions}>
            <TouchableOpacity style={cm.cancelBtn} onPress={onClose}>
              <Text style={cm.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cm.submitBtn, submitting && cm.btnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={cm.submitText}>Envoyer</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 16, color: colors.text, flex: 1 },
  closeBtn: { padding: 4, marginLeft: 4 },
  desc: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 18 },
  label: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  req: { color: colors.error },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  imgRow: { marginBottom: spacing.sm },
  imgWrap: { width: 60, height: 60, borderRadius: radius.sm, backgroundColor: colors.divider, marginRight: 8, overflow: 'hidden' },
  imgRemove: { position: 'absolute', top: 2, right: 2, backgroundColor: colors.error, borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, justifyContent: 'center', marginBottom: spacing.lg },
  pickBtnText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 14, color: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: 13, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, alignItems: 'center' },
  cancelText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 15, color: colors.textSecondary },
  submitBtn: { flex: 1, paddingVertical: 13, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center' },
  submitText: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 15, color: '#FFF' },
  btnDisabled: { opacity: 0.6 },
});
const DAY_NAMES_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function StatusBadge({ pharmacy }: { pharmacy: Pharmacy }) {
  if (pharmacy.isOpen24h) return <View style={[sb.base, { backgroundColor: '#e0f2fe' }]}><Text style={[sb.text, { color: '#0284c7' }]}>Ouvert 24h/24</Text></View>;
  if (pharmacy.isOnGuard) return <View style={[sb.base, { backgroundColor: colors.primaryLight }]}><Text style={[sb.text, { color: colors.primary }]}>De garde</Text></View>;
  if (pharmacy.isOpenNow) return <View style={[sb.base, { backgroundColor: colors.successLight }]}><Text style={[sb.text, { color: colors.success }]}>Ouvert</Text></View>;
  return <View style={[sb.base, { backgroundColor: colors.errorLight }]}><Text style={[sb.text, { color: colors.error }]}>Fermé</Text></View>;
}

const sb = StyleSheet.create({
  base: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  text: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 12 },
});

function HoursRow({ hour }: { hour: OpeningHour }) {
  return (
    <View style={hours.row}>
      <Text style={hours.day}>{DAY_NAMES[hour.day]}</Text>
      {hour.isClosed
        ? <Text style={hours.closed}>Fermé</Text>
        : <Text style={hours.time}>{hour.open ?? '?'} – {hour.close ?? '?'}</Text>
      }
    </View>
  );
}

const hours = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  day: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 14, color: colors.text, width: 100 },
  time: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 14, color: colors.text },
  closed: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 14, color: colors.textMuted },
});

function ExceptionalItem({ item }: { item: ExceptionalSchedule }) {
  const isOpen = item.type === 'opening';
  const color = isOpen ? colors.success : colors.error;
  const bg = isOpen ? colors.successLight : colors.errorLight;
  const label = isOpen ? 'Ouverture' : 'Fermeture';

  return (
    <View style={exc.container}>
      <View style={[exc.badge, { backgroundColor: bg }]}>
        <Text style={[exc.badgeText, { color }]}>{label}</Text>
      </View>
      <View style={exc.info}>
        <Text style={exc.dates}>{item.startDate} → {item.endDate}</Text>
        {item.startTime && <Text style={exc.time}>{item.startTime} – {item.endTime ?? '?'}</Text>}
        {(item.label ?? item.reason) && (
          <Text style={exc.note} numberOfLines={2}>{item.label ?? item.reason}</Text>
        )}
      </View>
    </View>
  );
}

const exc = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, alignSelf: 'flex-start' },
  badgeText: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 11 },
  info: { flex: 1, gap: 2 },
  dates: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 13, color: colors.text },
  time: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 12, color: colors.textSecondary },
  note: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
});

function GuardItem({ item }: { item: PharmacyGuard }) {
  if (!item.isActive) return null;
  return (
    <View style={exc.container}>
      <View style={[exc.badge, { backgroundColor: colors.primaryLight }]}>
        <Text style={[exc.badgeText, { color: colors.primary }]}>Garde</Text>
      </View>
      <View style={exc.info}>
        <Text style={exc.dates}>{item.startDate} → {item.endDate}</Text>
        {item.label && <Text style={exc.note}>{item.label}</Text>}
      </View>
    </View>
  );
}

export default function PharmacyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const appState = useStore(selectAppState);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimVisible, setClaimVisible] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (appState.isOnline) {
          const data = await pharmacyApi.get(id);
          setPharmacy(data);
        } else {
          const local = await getPharmacyById(id);
          setPharmacy(local);
        }
      } catch {
        const local = await getPharmacyById(id);
        setPharmacy(local);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, appState.isOnline]);

  const openMaps = () => {
    if (!pharmacy) return;
    const { lat, lng } = pharmacy.coordinates;
    const coords = `${lat},${lng}`;
    const url = Platform.OS === 'ios'
      ? `maps://?q=${encodeURIComponent(pharmacy.name)}&ll=${coords}`
      : `geo:${coords}?q=${encodeURIComponent(pharmacy.name)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coords}`);
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!pharmacy) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.loader}>
          <Text style={styles.errorText}>Pharmacie introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const phone = pharmacy.contacts.find((c) => c.type === 'phone')?.value ?? pharmacy.phone;
  const whatsapp = pharmacy.contacts.find((c) => c.type === 'whatsapp')?.value;
  const email = pharmacy.contacts.find((c) => c.type === 'email')?.value;
  const todayHour = pharmacy.openingHours[new Date().getDay()];
  const upcoming = pharmacy.exceptionalSchedules
    .filter((e) => e.endDate >= new Date().toISOString().split('T')[0])
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5);
  const activeGuards = pharmacy.pharmacyGuards.filter((g) => g.isActive).slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={2}>{pharmacy.name}</Text>
          <StatusBadge pharmacy={pharmacy} />
        </View>
      </View>

      {!appState.isOnline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={13} color={colors.warning} />
          <Text style={styles.offlineText}>Données hors ligne</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Info card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.infoText}>{pharmacy.address}</Text>
          </View>
          {pharmacy.landmark && (
            <View style={styles.infoRow}>
              <ChevronRight size={14} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textMuted, fontStyle: 'italic' }]}>
                {pharmacy.landmark}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Navigation size={14} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{pharmacy.city}{pharmacy.region ? `, ${pharmacy.region}` : ''}</Text>
          </View>
          {todayHour && (
            <View style={styles.infoRow}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={styles.infoText}>
                Aujourd'hui : {todayHour.isClosed ? 'Fermé' : `${todayHour.open} – ${todayHour.close}`}
              </Text>
            </View>
          )}
        </View>

        {/* Contacts */}
        {(phone || whatsapp || email) && (
          <>
            <Text style={styles.sectionTitle}>Contacts</Text>
            <View style={styles.card}>
              {phone && (
                <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${phone}`)}>
                  <View style={[styles.contactIcon, { backgroundColor: colors.successLight }]}>
                    <Phone size={16} color={colors.success} />
                  </View>
                  <Text style={styles.contactValue}>{phone}</Text>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {whatsapp && (
                <>
                  {phone && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => Linking.openURL(`https://wa.me/${whatsapp.replace(/\D/g, '')}`)}
                  >
                    <View style={[styles.contactIcon, { backgroundColor: '#dcfce7' }]}>
                      <MessageCircle size={16} color="#16a34a" />
                    </View>
                    <Text style={styles.contactValue}>{whatsapp}</Text>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </>
              )}
              {email && (
                <>
                  {(phone || whatsapp) && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => Linking.openURL(`mailto:${email}`)}
                  >
                    <View style={[styles.contactIcon, { backgroundColor: colors.infoLight }]}>
                      <Mail size={16} color={colors.info} />
                    </View>
                    <Text style={styles.contactValue}>{email}</Text>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

        {/* Horaires */}
        {pharmacy.openingHours.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Horaires</Text>
            <View style={styles.card}>
              {pharmacy.openingHours
                .slice()
                .sort((a, b) => a.day - b.day)
                .map((h) => <HoursRow key={h.day} hour={h} />)}
            </View>
          </>
        )}

        {/* Exceptions & gardes */}
        {(upcoming.length > 0 || activeGuards.length > 0) && (
          <>
            <Text style={styles.sectionTitle}>Calendrier</Text>
            <View style={styles.card}>
              {activeGuards.map((g) => <GuardItem key={g.id} item={g} />)}
              {upcoming.map((e) => <ExceptionalItem key={e.id} item={e} />)}
            </View>
          </>
        )}

        {/* Bouton Y aller */}
        <TouchableOpacity style={styles.mapsBtn} onPress={openMaps} activeOpacity={0.85}>
          <Navigation size={18} color="#FFF" />
          <Text style={styles.mapsBtnText}>Y aller</Text>
        </TouchableOpacity>

        {/* Bouton réclamation gérant */}
        <TouchableOpacity
          style={styles.claimBtn}
          onPress={() => setClaimVisible(true)}
          activeOpacity={0.8}
        >
          <Store size={16} color={colors.textSecondary} />
          <Text style={styles.claimBtnText}>Je suis gérant de cette pharmacie</Text>
        </TouchableOpacity>
      </ScrollView>

      {pharmacy && (
        <ClaimModal
          pharmacyId={pharmacy.id}
          pharmacyName={pharmacy.name}
          visible={claimVisible}
          onClose={() => setClaimVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerInfo: { flex: 1, gap: 6 },
  name: { fontFamily: 'FunnelDisplay_800ExtraBold', fontSize: 20, color: colors.text },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.warningLight,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.sm,
  },
  offlineText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 12, color: colors.warning },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  infoText: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactValue: { flex: 1, fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 14, color: colors.text },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: 48 },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginTop: spacing.sm,
    ...shadows.md,
  },
  mapsBtnText: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 16, color: '#FFF' },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  claimBtnText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 14, color: colors.textSecondary },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 16, color: colors.textSecondary },
});
