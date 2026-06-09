import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, ChevronRight, Check, MapPin, Plus, Trash2,
} from 'lucide-react-native';
import { colors, spacing } from '../../src/theme';
import { pharmacyRequestApi } from '../../src/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

type ContactType = 'phone' | 'email' | 'whatsapp' | 'facebook' | 'other';
type Contact = { type: ContactType; value: string };
type OpeningHour = { day: number; open: string; close: string; isClosed: boolean };

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ['Localisation', 'Infos', 'Contacts', 'Horaires'];
const DAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const INITIAL_LAT = -18.9137;
const INITIAL_LNG = 47.5361;

const CONTACT_TYPES: { key: ContactType; label: string }[] = [
  { key: 'phone', label: 'Tél.' },
  { key: 'email', label: 'Email' },
  { key: 'whatsapp', label: 'WA' },
  { key: 'facebook', label: 'FB' },
  { key: 'other', label: 'Autre' },
];

const CONTACT_PLACEHOLDERS: Record<ContactType, string> = {
  phone: '+261 20 ...',
  email: 'pharmacie@example.com',
  whatsapp: '+261 34 ...',
  facebook: 'facebook.com/...',
  other: 'Valeur du contact',
};

function defaultHours(): OpeningHour[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: '08:00',
    close: '17:00',
    isClosed: day === 0,
  }));
}

// ── Location picker WebView HTML ──────────────────────────────────────────────

const PICKER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body,#map{width:100%;height:100%;}
  #hint{
    position:absolute;top:12px;left:50%;transform:translateX(-50%);
    background:rgba(0,0,0,0.65);color:#fff;padding:7px 16px;
    border-radius:20px;font-size:13px;z-index:1000;pointer-events:none;
    white-space:nowrap;font-family:sans-serif;
  }
</style>
</head>
<body>
<div id="map"></div>
<div id="hint">Appuyez sur la carte pour placer la pharmacie</div>
<script>
  const map=L.map('map',{attributionControl:false}).setView([${INITIAL_LAT},${INITIAL_LNG}],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  let marker=null;
  function send(lat,lng){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'pick',lat,lng}));
  }
  map.on('click',function(e){
    const lat=e.latlng.lat,lng=e.latlng.lng;
    if(marker)marker.setLatLng([lat,lng]);
    else{
      marker=L.marker([lat,lng],{draggable:true}).addTo(map);
      marker.on('dragend',function(){
        const p=marker.getLatLng();send(p.lat,p.lng);
      });
    }
    document.getElementById('hint').style.display='none';
    send(lat,lng);
  });
</script>
</body>
</html>`;

// ── Reverse geocoding ─────────────────────────────────────────────────────────

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'User-Agent': 'Fanafodiko/1.0' } },
    );
    const data = await res.json();
    return {
      address: (data.display_name as string) ?? '',
      city: (data.address?.city ?? data.address?.town ?? data.address?.village ?? '') as string,
      region: (data.address?.state ?? '') as string,
    };
  } catch {
    return null;
  }
}

// ── Location picker component ─────────────────────────────────────────────────

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const onMessage = useCallback((e: any) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === 'pick') onPick(data.lat, data.lng);
    } catch {}
  }, [onPick]);

  return (
    <WebView
      source={{ html: PICKER_HTML }}
      style={styles.mapView}
      onMessage={onMessage}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['*']}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
    />
  );
}

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, subtitle, autoCapitalize,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; subtitle?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {subtitle ? <Text style={styles.fieldSub}>{subtitle}</Text> : null}
      </View>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize={autoCapitalize ?? 'words'}
      />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SuggestPharmacyScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  // ── Form state ──────────────────────────────────────────────────────────────

  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const [geocoding, setGeocoding] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isOpen24h, setIsOpen24h] = useState(false);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>(defaultHours());
  const [wantsToManage, setWantsToManage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handlePick = useCallback(async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    setGeocoding(true);
    const geo = await reverseGeocode(lat, lng);
    setGeocoding(false);
    if (geo) {
      if (geo.address) setAddress(geo.address);
      if (geo.city) setCity(geo.city);
      if (geo.region) setRegion(geo.region);
    }
  }, []);

  const canGoNext = () => {
    if (step === 0) return coords.lat !== 0 || coords.lng !== 0;
    if (step === 1) return name.trim().length > 0 && city.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      if (step === 0) Alert.alert('Position requise', "Appuyez sur la carte pour choisir l'emplacement de la pharmacie.");
      if (step === 1) {
        if (!name.trim() && !city.trim()) Alert.alert('Champs requis', 'Le nom et la ville sont obligatoires.');
        else if (!name.trim()) Alert.alert('Champ requis', 'Le nom de la pharmacie est obligatoire.');
        else Alert.alert('Champ requis', 'La ville est obligatoire.');
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (isFirst) router.back();
    else setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await pharmacyRequestApi.create({
        name: name.trim(),
        address: address.trim() || name.trim(),
        landmark: landmark.trim() || undefined,
        coordinates: coords,
        contacts: contacts.filter((c) => c.value.trim()),
        city: city.trim(),
        region: region.trim() || undefined,
        isOpen24h,
        openingHours: isOpen24h ? [] : openingHours,
        wantsToManage,
        proofImages: [],
      });
      Alert.alert(
        'Demande envoyée !',
        'Merci ! Notre équipe examinera votre suggestion avant publication.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer la demande. Vérifiez votre connexion et réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Contact helpers ─────────────────────────────────────────────────────────

  const addContact = () => setContacts((c) => [...c, { type: 'phone', value: '' }]);
  const removeContact = (i: number) => setContacts((c) => c.filter((_, j) => j !== i));
  const updateContactType = (i: number, type: ContactType) =>
    setContacts((c) => c.map((ct, j) => (j === i ? { ...ct, type } : ct)));
  const updateContactValue = (i: number, value: string) =>
    setContacts((c) => c.map((ct, j) => (j === i ? { ...ct, value } : ct)));

  // ── Hour helper ─────────────────────────────────────────────────────────────

  const updateHour = (day: number, field: 'open' | 'close' | 'isClosed', value: any) =>
    setOpeningHours((h) => h.map((d) => (d.day === day ? { ...d, [field]: value } : d)));

  // ── Step renderers ──────────────────────────────────────────────────────────

  const renderLocation = () => (
    <View style={styles.mapContainer}>
      <LocationPicker onPick={handlePick} />
      {coords.lat !== 0 && (
        <View style={styles.coordBanner}>
          <MapPin size={14} color={colors.primary} />
          {geocoding ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.coordText} numberOfLines={1}>
              {address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderInfos = () => (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Field label="Nom *" value={name} onChange={setName} placeholder="Pharmacie du Centre" />
      <Field
        label="Repère visuel"
        value={landmark}
        onChange={setLandmark}
        placeholder="En face de…"
        autoCapitalize="sentences"
      />
      <Field label="Ville *" value={city} onChange={setCity} placeholder="Antananarivo" subtitle="(auto-rempli)" />
      <Field label="Région" value={region} onChange={setRegion} placeholder="Analamanga" subtitle="(auto-rempli)" />
    </ScrollView>
  );

  const renderContacts = () => (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.hint}>Coordonnées de la pharmacie (optionnel).</Text>
      {contacts.map((c, i) => (
        <View key={i} style={styles.contactCard}>
          <View style={styles.typeRow}>
            {CONTACT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typePill, c.type === t.key && styles.typePillActive]}
                onPress={() => updateContactType(i, t.key)}
              >
                <Text style={[styles.typePillText, c.type === t.key && styles.typePillTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.contactValueRow}>
            <TextInput
              style={styles.contactInput}
              value={c.value}
              onChangeText={(v) => updateContactValue(i, v)}
              placeholder={CONTACT_PLACEHOLDERS[c.type]}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => removeContact(i)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color={colors.error} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={addContact} activeOpacity={0.7}>
        <Plus size={16} color={colors.primary} strokeWidth={2} />
        <Text style={styles.addBtnText}>Ajouter un contact</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderHours = () => (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Gérer cette pharmacie */}
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.switchLabel}>Je suis le gérant de cette pharmacie</Text>
            <Text style={styles.switchSub}>
              Notre équipe vérifiera votre identité avant de vous accorder l'accès.
            </Text>
          </View>
          <Switch
            value={wantsToManage}
            onValueChange={setWantsToManage}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={wantsToManage ? colors.primary : '#FFF'}
          />
        </View>
      </View>

      {/* Horaires */}
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { flex: 1 }]}>Ouvert 24h/24</Text>
          <Switch
            value={isOpen24h}
            onValueChange={setIsOpen24h}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isOpen24h ? colors.primary : '#FFF'}
          />
        </View>
        {!isOpen24h && (
          <>
            <View style={styles.divider} />
            {openingHours.map((h) => (
              <View key={h.day} style={styles.dayRow}>
                <Text style={styles.dayName}>{DAY_SHORT[h.day]}</Text>
                <Switch
                  value={!h.isClosed}
                  onValueChange={(v) => updateHour(h.day, 'isClosed', !v)}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={!h.isClosed ? colors.primary : '#FFF'}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                {h.isClosed ? (
                  <Text style={styles.closedText}>Fermé</Text>
                ) : (
                  <View style={styles.timeRow}>
                    <TextInput
                      style={styles.timeInput}
                      value={h.open}
                      onChangeText={(v) => updateHour(h.day, 'open', v)}
                      placeholder="08:00"
                      placeholderTextColor={colors.textMuted}
                      maxLength={5}
                    />
                    <Text style={styles.timeSep}>–</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={h.close}
                      onChangeText={(v) => updateHour(h.day, 'close', v)}
                      placeholder="17:00"
                      placeholderTextColor={colors.textMuted}
                      maxLength={5}
                    />
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Suggérer une pharmacie</Text>
          <Text style={styles.headerStep}>{STEPS[step]}</Text>
        </View>
        <Text style={styles.headerCount}>{step + 1}/{STEPS.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` as any }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {step === 0 && renderLocation()}
        {step === 1 && renderInfos()}
        {step === 2 && renderContacts()}
        {step === 3 && renderHours()}
      </View>

      {/* Bottom nav */}
      <SafeAreaView edges={['bottom']} style={styles.bottomWrap}>
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.prevBtn} onPress={handleBack} activeOpacity={0.7}>
            <ArrowLeft size={18} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.prevBtnText}>{isFirst ? 'Annuler' : 'Précédent'}</Text>
          </TouchableOpacity>

          {isLast ? (
            <TouchableOpacity
              style={[styles.nextBtn, submitting && styles.nextBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Check size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.nextBtnText}>Envoyer</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Suivant</Text>
              <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 15, color: colors.text },
  headerStep: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 12, color: colors.textSecondary },
  headerCount: {
    fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 13,
    color: colors.textSecondary, minWidth: 28, textAlign: 'right',
  },

  // Progress
  progressTrack: { height: 3, backgroundColor: colors.border },
  progressFill: { height: 3, backgroundColor: colors.primary },

  content: { flex: 1 },

  // Location step
  mapContainer: { flex: 1 },
  mapView: { flex: 1 },
  coordBanner: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  coordText: {
    flex: 1, fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 13, color: colors.text,
  },

  // Scrollable steps
  scrollArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xxl,
  },

  hint: {
    fontFamily: 'FunnelDisplay_400Regular', fontSize: 13,
    color: colors.textSecondary, marginBottom: spacing.md,
  },

  // Field
  field: { marginBottom: spacing.md },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 14, color: colors.text },
  fieldSub: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 11, color: colors.textMuted },
  fieldInput: {
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, paddingVertical: 11,
    fontFamily: 'FunnelDisplay_400Regular', fontSize: 14, color: colors.text,
  },

  // Contacts
  contactCard: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    padding: spacing.sm, marginBottom: spacing.sm,
  },
  typeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  typePill: {
    flex: 1, alignItems: 'center',
    paddingVertical: 6, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typePillText: {
    fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 11, color: colors.textSecondary,
  },
  typePillTextActive: { color: '#fff' },
  contactValueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactInput: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.sm, paddingVertical: 9,
    fontFamily: 'FunnelDisplay_400Regular', fontSize: 13, color: colors.text,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
    paddingVertical: 13, marginTop: spacing.sm,
  },
  addBtnText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 14, color: colors.primary },

  // Hours
  card: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    padding: spacing.md, marginBottom: spacing.md,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchLabel: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 14, color: colors.text },
  switchSub: {
    fontFamily: 'FunnelDisplay_400Regular', fontSize: 12,
    color: colors.textSecondary, marginTop: 2,
  },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 },
  dayName: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 13, color: colors.text, width: 34 },
  timeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInput: {
    flex: 1, textAlign: 'center', borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 6, paddingVertical: 6,
    fontFamily: 'FunnelDisplay_400Regular', fontSize: 13, color: colors.text,
  },
  timeSep: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 13, color: colors.textSecondary },
  closedText: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 13, color: colors.textMuted, flex: 1 },

  // Bottom nav
  bottomWrap: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  bottomRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  prevBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  prevBtnText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 14, color: colors.textSecondary },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, paddingVertical: 12,
  },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 14, color: '#fff' },
});
