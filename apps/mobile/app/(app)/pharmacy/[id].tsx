import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, MapPin, Phone, Clock, Calendar, ChevronRight,
  Navigation, MessageCircle, Mail, WifiOff,
} from 'lucide-react-native';
import { pharmacyApi } from '../../../src/api/client';
import { getPharmacyById } from '../../../src/db/database';
import { useStore, selectAppState } from '../../../src/store/useStore';
import { colors, spacing, radius, shadows } from '../../../src/theme';
import type { Pharmacy, OpeningHour, ExceptionalSchedule, PharmacyGuard } from '../../../src/types';

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAY_NAMES_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function StatusBadge({ pharmacy }: { pharmacy: Pharmacy }) {
  if (pharmacy.isOpen24h) return <View style={[sb.base, { backgroundColor: '#e0f2fe' }]}><Text style={[sb.text, { color: '#0284c7' }]}>Ouvert 24h/24</Text></View>;
  if (pharmacy.isOnGuard) return <View style={[sb.base, { backgroundColor: colors.primaryLight }]}><Text style={[sb.text, { color: colors.primary }]}>De garde</Text></View>;
  if (pharmacy.isOpenNow) return <View style={[sb.base, { backgroundColor: colors.successLight }]}><Text style={[sb.text, { color: colors.success }]}>Ouvert</Text></View>;
  return <View style={[sb.base, { backgroundColor: colors.errorLight }]}><Text style={[sb.text, { color: colors.error }]}>Fermé</Text></View>;
}

const sb = StyleSheet.create({
  base: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  text: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
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
  day: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: colors.text, width: 100 },
  time: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: colors.text },
  closed: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: colors.textMuted },
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
  badgeText: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  info: { flex: 1, gap: 2 },
  dates: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: colors.text },
  time: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textSecondary },
  note: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
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
      </ScrollView>
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
  name: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: colors.text },
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
  offlineText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: colors.warning },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
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
    fontFamily: 'Nunito_400Regular',
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
  contactValue: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: colors.text },
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
  mapsBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#FFF' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: colors.textSecondary },
});
