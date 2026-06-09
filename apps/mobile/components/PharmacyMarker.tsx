import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { colors } from '../src/theme';
import type { Pharmacy } from '../src/types';

interface Props {
  pharmacy: Pharmacy;
  onPress: () => void;
  selected?: boolean;
}

function markerColor(p: Pharmacy): string {
  if (p.isOpen24h) return '#0284c7';
  if (p.isOnGuard) return colors.primary;
  if (p.isOpenNow) return colors.success;
  return colors.error;
}

export function PharmacyMarker({ pharmacy, onPress, selected = false }: Props) {
  const color = markerColor(pharmacy);

  return (
    <Marker
      coordinate={{
        latitude: pharmacy.coordinates.lat,
        longitude: pharmacy.coordinates.lng,
      }}
      onPress={onPress}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.wrapper}>
        <View
          style={[
            styles.pin,
            { backgroundColor: color },
            selected && styles.pinSelected,
          ]}
        >
          <View style={styles.dot} />
        </View>
        <View style={[styles.tip, { borderTopColor: color }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  pinSelected: {
    width: 36,
    height: 36,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  tip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
