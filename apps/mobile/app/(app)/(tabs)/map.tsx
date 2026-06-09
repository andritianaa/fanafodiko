import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import {
  Search, Navigation, X, WifiOff,
  CheckCircle, Shield, Clock, SlidersHorizontal, Layers,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore, selectAppState } from '../../../src/store/useStore';
import { pharmacyApi } from '../../../src/api/client';
import {
  getPharmacies as getLocalPharmacies,
  searchPharmacies as searchLocalPharmacies,
  upsertPharmacies,
} from '../../../src/db/database';
import LeafletMap, { type MapRef, type MapMarker } from '../../../components/LeafletMap';
import { PharmacyCard } from '../../../components/PharmacyCard';
import { colors, spacing } from '../../../src/theme';
import type { Pharmacy } from '../../../src/types';

type FilterType = 'all' | 'open' | 'guard' | '24h';
type LayerType = 'standard' | 'satellite' | 'sombre';

const LAYERS: { key: LayerType; label: string }[] = [
  { key: 'standard',  label: 'Standard' },
  { key: 'satellite', label: 'Satellite' },
  { key: 'sombre',    label: 'Sombre' },
];

// Hex pour les pills/icônes React Native
const STATUS_COLORS = {
  h24:    '#0284c7',  // bleu   — 24h/24
  guard:  '#7c3aed',  // violet — de garde
  open:   '#16a34a',  // vert   — ouvert
} as const;

// Noms de couleurs pointhi/leaflet-color-markers
function pharmacyMarkerColor(p: Pharmacy): string {
  if (p.isOpen24h) return 'blue';
  if (p.isOnGuard) return 'violet';
  if (p.isOpenNow) return 'green';
  return 'red';
}

const FILTERS: { key: FilterType; label: string; Icon?: any; color?: string }[] = [
  { key: 'all',   label: 'Toutes' },
  { key: 'open',  label: 'Ouvert',   Icon: CheckCircle, color: STATUS_COLORS.open },
  { key: 'guard', label: 'De garde', Icon: Shield,      color: STATUS_COLORS.guard },
  { key: '24h',   label: '24h/24',   Icon: Clock,       color: STATUS_COLORS.h24 },
];

const INITIAL_LAT = -18.9137;
const INITIAL_LNG = 47.5361;

export default function MapScreen() {
  const router = useRouter();
  const appState = useStore(selectAppState);
  const mapRef = useRef<MapRef>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filtered, setFiltered] = useState<Pharmacy[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Pharmacy | null>(null);
  const [locating, setLocating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType>('standard');
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);

  const snapPoints = useMemo(() => ['55%', '88%'], []);

  // ── Markers ──────────────────────────────────────────────────────────────

  const markers: MapMarker[] = useMemo(() => filtered.map((p) => ({
    id: p.id,
    lat: p.coordinates.lat,
    lng: p.coordinates.lng,
    title: p.name,
    color: pharmacyMarkerColor(p),
    selected: selected?.id === p.id,
  })), [filtered, selected]);

  useEffect(() => {
    mapRef.current?.setMarkers(markers);
  }, [markers]);

  // ── Chargement ───────────────────────────────────────────────────────────

  const loadPharmacies = useCallback(async (filter: FilterType) => {
    setLoading(true);
    try {
      const apiFilter = filter === 'all' ? undefined : filter;
      if (appState.isOnline) {
        const data = await pharmacyApi.list(apiFilter);
        await upsertPharmacies(data.pharmacies);
        setPharmacies(data.pharmacies);
        setFiltered(data.pharmacies);
      } else {
        const local = await getLocalPharmacies(apiFilter);
        setPharmacies(local);
        setFiltered(local);
      }
    } catch {
      const apiFilter = filter === 'all' ? undefined : filter;
      const local = await getLocalPharmacies(apiFilter);
      setPharmacies(local);
      setFiltered(local);
    } finally {
      setLoading(false);
    }
  }, [appState.isOnline]);

  useEffect(() => {
    loadPharmacies(activeFilter);
  }, [loadPharmacies, activeFilter]);

  // ── Recherche ────────────────────────────────────────────────────────────

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setFiltered(pharmacies); return; }
    searchTimer.current = setTimeout(async () => {
      const results = await searchLocalPharmacies(text);
      setFiltered(results);
    }, 300);
  }, [pharmacies]);

  const clearSearch = () => {
    setSearchQuery('');
    setFiltered(pharmacies);
    Keyboard.dismiss();
  };

  // ── GPS ──────────────────────────────────────────────────────────────────

  const handleGPS = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      mapRef.current?.flyTo(pos.coords.latitude, pos.coords.longitude, 15);
    } catch {}
    setLocating(false);
  };

  // ── Pharmacie ─────────────────────────────────────────────────────────────

  const handleMarkerPress = useCallback((id: string) => {
    const pharmacy = filtered.find((p) => p.id === id);
    if (!pharmacy) return;
    setSelected(pharmacy);
    mapRef.current?.flyTo(pharmacy.coordinates.lat, pharmacy.coordinates.lng, 16);
    sheetRef.current?.snapToIndex(0);
    setSheetOpen(true);
  }, [filtered]);

  const handlePharmacyPress = useCallback((pharmacy: Pharmacy) => {
    setSelected(pharmacy);
    mapRef.current?.flyTo(pharmacy.coordinates.lat, pharmacy.coordinates.lng, 16);
    sheetRef.current?.snapToIndex(0);
  }, []);

  const handleViewDetails = useCallback((id: string) => {
    router.push({ pathname: '/(app)/pharmacy/[id]', params: { id } });
  }, [router]);

  const handleLayerSelect = (layer: LayerType) => {
    setActiveLayer(layer);
    mapRef.current?.setLayer(layer);
    setLayerPanelOpen(false);
  };

  const handleFilter = (f: FilterType) => {
    setActiveFilter(f);
    setSearchQuery('');
    setSelected(null);
  };

  const openSheet = () => {
    sheetRef.current?.snapToIndex(0);
    setSheetOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <GestureHandlerRootView style={styles.root}>

      {/* Carte plein écran */}
      <LeafletMap
        ref={mapRef}
        initialLat={INITIAL_LAT}
        initialLng={INITIAL_LNG}
        initialZoom={13}
        markers={markers}
        onMarkerPress={handleMarkerPress}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Bannière hors-ligne (haut) */}
      {!appState.isOnline && (
        <SafeAreaView style={styles.offlineWrap} edges={['top']} pointerEvents="none">
          <View style={styles.offlineBanner}>
            <WifiOff size={13} color={colors.warning} />
            <Text style={styles.offlineText}>Carte hors ligne, données locales</Text>
          </View>
        </SafeAreaView>
      )}

      {/* Boutons GPS + Layer selector (côté droit, au-dessus du drawer) */}
      <View style={styles.mapCtrlWrap}>
        {/* Layer selector */}
        <View>
          {layerPanelOpen && (
            <View style={styles.layerPanel}>
              {LAYERS.map((l) => (
                <TouchableOpacity
                  key={l.key}
                  style={[styles.layerOpt, activeLayer === l.key && styles.layerOptActive]}
                  onPress={() => handleLayerSelect(l.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.layerOptText, activeLayer === l.key && styles.layerOptTextActive]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={[styles.mapBtn, layerPanelOpen && styles.mapBtnActive]}
            onPress={() => setLayerPanelOpen((v) => !v)}
            activeOpacity={0.85}
          >
            <Layers size={20} color={layerPanelOpen ? '#fff' : colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* GPS */}
        <TouchableOpacity style={styles.mapBtn} onPress={handleGPS} activeOpacity={0.85}>
          {locating
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Navigation size={20} color={colors.primary} />}
        </TouchableOpacity>
      </View>

      {/* Bouton "Filtres & Recherche" — visible quand le drawer est fermé */}
      {!sheetOpen && (
        <SafeAreaView style={styles.openBtnWrap} edges={['bottom']}>
          <TouchableOpacity style={styles.openBtn} onPress={openSheet} activeOpacity={0.9}>
            <SlidersHorizontal size={16} color="#fff" strokeWidth={2.5} />
            <Text style={styles.openBtnText}>Filtres & Recherche</Text>
            {filtered.length > 0 && (
              <View style={styles.openBtnBadge}>
                <Text style={styles.openBtnBadgeText}>{filtered.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* ── Drawer ── recherche + filtres + liste ───────────────────────────── */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => { setSheetOpen(false); setSelected(null); }}
        onAnimate={(from, to) => { if (to >= 0) setSheetOpen(true); }}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
        keyboardBehavior="interactive"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetView style={styles.sheetInner}>
          {selected ? (
            /* ── Vue détail pharmacie ── */
            <>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.backRow}>
                <Text style={styles.backText}>← Toutes les pharmacies</Text>
              </TouchableOpacity>
              <PharmacyCard
                pharmacy={selected}
                onViewDetails={() => handleViewDetails(selected.id)}
              />
            </>
          ) : (
            /* ── Vue liste : header épinglé + scroll ── */
            <>
              {/* ═══ Header épinglé en haut ═══ */}
              <View style={styles.sheetHeader}>
                {/* Barre de recherche */}
                <View style={styles.searchBar}>
                  <Search size={15} color={colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher une pharmacie…"
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={handleSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X size={15} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filtres */}
                <View style={styles.filterRow}>
                  {FILTERS.map((f) => {
                    const active = activeFilter === f.key;
                    return (
                      <TouchableOpacity
                        key={f.key}
                        style={[styles.pill, active && styles.pillActive]}
                        onPress={() => handleFilter(f.key)}
                        activeOpacity={0.75}
                      >
                        {f.Icon && (
                          <f.Icon
                            size={11}
                            color={active ? '#fff' : f.color ?? colors.textSecondary}
                            strokeWidth={2.5}
                          />
                        )}
                        <Text style={[styles.pillText, active && styles.pillTextActive]}>
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Compteur */}
                <View style={styles.countRow}>
                  <Text style={styles.countText}>
                    {loading
                      ? 'Chargement…'
                      : `${filtered.length} pharmacie${filtered.length !== 1 ? 's' : ''}`}
                  </Text>
                  {loading && <ActivityIndicator size="small" color={colors.primary} />}
                </View>
              </View>

              {/* ═══ Liste scrollable ═══ */}
              <BottomSheetScrollView
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.listScroll}
              >
                {filtered.map((p) => (
                  <PharmacyCard
                    key={p.id}
                    pharmacy={p}
                    compact
                    onPress={() => handlePharmacyPress(p)}
                    onViewDetails={() => handleViewDetails(p.id)}
                  />
                ))}
                {filtered.length === 0 && !loading && (
                  <Text style={styles.emptyList}>Aucune pharmacie trouvée</Text>
                )}
              </BottomSheetScrollView>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hors-ligne
  offlineWrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(254,243,199,0.97)',
    paddingHorizontal: spacing.md, paddingVertical: 7,
    marginTop: spacing.sm, marginHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.warningLight,
  },
  offlineText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 12, color: colors.warning },

  // Contrôles carte (GPS + calques)
  mapCtrlWrap: {
    position: 'absolute', right: spacing.lg, bottom: 114,
    alignItems: 'center', gap: 8,
  },
  mapBtn: {
    width: 48, height: 48,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8,
  },
  mapBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  layerPanel: {
    position: 'absolute',
    bottom: 56,   // au-dessus du bouton Layers (48px + 8px gap)
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12,
    minWidth: 110,
    overflow: 'hidden',
  },
  layerOpt: {
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  layerOptActive: {
    backgroundColor: colors.primaryLighter,
  },
  layerOptText: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 13, color: colors.text,
  },
  layerOptTextActive: { color: colors.primary },

  // Bouton ouvrir drawer
  openBtnWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 0 : spacing.md,
  },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.primary,
    paddingVertical: 14, marginBottom: spacing.sm,
    elevation: 6,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },
  openBtnText: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 15, color: '#fff' },
  openBtnBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8, paddingVertical: 2,
  },
  openBtnBadgeText: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 12, color: '#fff' },

  // Sheet
  sheetBg: { backgroundColor: colors.surface },
  sheetHandle: { backgroundColor: colors.border, width: 40 },

  // Conteneur interne flex:1 — essentiel pour que le header reste épinglé
  sheetInner: {
    flex: 1,
  },

  // Header épinglé en haut du drawer
  sheetHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 14, color: colors.text, padding: 0,
  },
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 12, color: colors.textSecondary },
  pillTextActive: { color: '#fff' },
  countRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  countText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 13, color: colors.textSecondary },

  // Liste
  listScroll: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  emptyList: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 14, color: colors.textSecondary,
    textAlign: 'center', paddingTop: spacing.xl,
  },

  backRow: { marginBottom: spacing.sm, paddingVertical: 4, paddingHorizontal: spacing.md },
  backText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 13, color: colors.primary },
});
