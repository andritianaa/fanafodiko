import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { PROVIDER_DEFAULT, Region } from 'react-native-maps';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { Search, Navigation, X, WifiOff, Layers } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore, selectAppState } from '../../../src/store/useStore';
import { pharmacyApi } from '../../../src/api/client';
import {
  getPharmacies as getLocalPharmacies,
  searchPharmacies as searchLocalPharmacies,
  upsertPharmacies,
} from '../../../src/db/database';
import { PharmacyMarker } from '../../../components/PharmacyMarker';
import { PharmacyCard } from '../../../components/PharmacyCard';
import { colors, spacing, radius, shadows } from '../../../src/theme';
import type { Pharmacy } from '../../../src/types';

type FilterType = 'all' | 'open' | 'guard' | '24h';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'open', label: 'Ouvert' },
  { key: 'guard', label: 'De garde' },
  { key: '24h', label: '24h/24' },
];

// Antananarivo, Madagascar
const INITIAL_REGION: Region = {
  latitude: -18.9137,
  longitude: 47.5361,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

export default function MapScreen() {
  const router = useRouter();
  const appState = useStore(selectAppState);
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filtered, setFiltered] = useState<Pharmacy[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Pharmacy | null>(null);
  const [locating, setLocating] = useState(false);

  const snapPoints = useMemo(() => ['38%', '65%'], []);

  // ─── Load pharmacies ────────────────────────────────────────────────────────

  const loadPharmacies = useCallback(async (filter: FilterType) => {
    setLoading(true);
    try {
      if (appState.isOnline) {
        const apiFilter = filter === 'all' ? undefined : filter;
        const data = await pharmacyApi.list(apiFilter);
        await upsertPharmacies(data.pharmacies);
        setPharmacies(data.pharmacies);
        setFiltered(data.pharmacies);
      } else {
        const apiFilter = filter === 'all' ? undefined : filter;
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

  // ─── Search ─────────────────────────────────────────────────────────────────

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setFiltered(pharmacies);
      return;
    }
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

  // ─── GPS ────────────────────────────────────────────────────────────────────

  const handleGPS = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 600);
    } catch {}
    setLocating(false);
  };

  // ─── Marker tap ─────────────────────────────────────────────────────────────

  const handleMarkerPress = useCallback((pharmacy: Pharmacy) => {
    setSelected(pharmacy);
    bottomSheetRef.current?.snapToIndex(0);
    // Center map on selected marker
    mapRef.current?.animateToRegion({
      latitude: pharmacy.coordinates.lat - 0.008,
      longitude: pharmacy.coordinates.lng,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    }, 400);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSelected(null);
  }, []);

  // ─── View details ────────────────────────────────────────────────────────────

  const handleViewDetails = useCallback((id: string) => {
    bottomSheetRef.current?.close();
    router.push({ pathname: '/(app)/pharmacy/[id]', params: { id } });
  }, [router]);

  // ─── Filter change ───────────────────────────────────────────────────────────

  const handleFilter = (f: FilterType) => {
    setActiveFilter(f);
    setSearchQuery('');
    setSelected(null);
    bottomSheetRef.current?.close();
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        {filtered.map((p) => (
          <PharmacyMarker
            key={p.id}
            pharmacy={p}
            selected={selected?.id === p.id}
            onPress={() => handleMarkerPress(p)}
          />
        ))}
      </MapView>

      {/* Top overlay */}
      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
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
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          keyboardShouldPersistTaps="always"
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.pill, activeFilter === f.key && styles.pillActive]}
              onPress={() => handleFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, activeFilter === f.key && styles.pillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
          {filtered.length > 0 && (
            <View style={styles.pillCount}>
              <Text style={styles.pillCountText}>{filtered.length}</Text>
            </View>
          )}
        </ScrollView>

        {/* Offline banner */}
        {!appState.isOnline && (
          <View style={styles.offlineBanner}>
            <WifiOff size={13} color={colors.warning} />
            <Text style={styles.offlineText}>Carte hors ligne, données locales</Text>
          </View>
        )}
      </SafeAreaView>

      {/* GPS button */}
      <View style={styles.gpsWrap} pointerEvents="box-none">
        <SafeAreaView edges={['bottom']} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={handleGPS}
            activeOpacity={0.85}
          >
            {locating
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Navigation size={20} color={colors.primary} />
            }
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingBadge} pointerEvents="none">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      )}

      {/* Bottom sheet, pharmacy detail card */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={handleSheetClose}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetView style={styles.sheetContent}>
          {selected ? (
            <PharmacyCard
              pharmacy={selected}
              onViewDetails={() => handleViewDetails(selected.id)}
            />
          ) : null}
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    gap: 10,
    marginTop: spacing.sm,
    ...shadows.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },

  filterContent: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  pillTextActive: { color: '#FFF' },
  pillCount: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  pillCountText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    color: colors.textMuted,
  },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(254,243,199,0.95)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.warningLight,
    ...shadows.sm,
  },
  offlineText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: colors.warning,
  },

  gpsWrap: {
    position: 'absolute',
    right: spacing.md,
    bottom: 200,
  },
  gpsBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  loadingBadge: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    ...shadows.md,
  },
  loadingText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },

  sheetBg: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  sheetHandle: {
    backgroundColor: colors.border,
    width: 40,
  },
  sheetContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
