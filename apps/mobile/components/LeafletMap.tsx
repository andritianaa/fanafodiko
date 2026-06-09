import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MapRef {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  setMarkers: (markers: MapMarker[]) => void;
  setLayer: (name: 'standard' | 'satellite' | 'sombre') => void;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  color?: string;
  selected?: boolean;
}

interface LeafletMapProps {
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  markers?: MapMarker[];
  onMarkerPress?: (id: string) => void;
  style?: object;
}

function buildHtml(initialLat: number, initialLng: number, zoom: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100%; }

</style>
</head>
<body>
<div id="map"></div>


<script>
  const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${initialLat}, ${initialLng}], ${zoom});

  const tileLayers = {
    standard:  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
    sombre:    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }),
  };
  let activeLayer = 'standard';
  tileLayers.standard.addTo(map);

  L.control.attribution({ position: 'bottomright', prefix: '' }).addTo(map);

  window.setLayer = function(name) {
    if (!tileLayers[name] || name === activeLayer) return;
    tileLayers[activeLayer].remove();
    tileLayers[name].addTo(map);
    activeLayer = name;
  };

  const markers = {};
  const markerColors = {};

  const ICON_BASE = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-';
  const ICON_SHADOW = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

  function makeIcon(selected, color) {
    const name = color || 'blue';
    return L.icon({
      iconUrl:     ICON_BASE + name + '.png',
      shadowUrl:   ICON_SHADOW,
      iconSize:    selected ? [31, 51] : [25, 41],
      iconAnchor:  selected ? [15, 51] : [12, 41],
      popupAnchor: [1, -34],
      shadowSize:  [41, 41],
      shadowAnchor:[13, 41],
    });
  }

  window.setMarkers = function(data) {
    Object.values(markers).forEach(function(m) { m.remove(); });
    Object.keys(markers).forEach(function(k) { delete markers[k]; delete markerColors[k]; });
    data.forEach(function(p) {
      markerColors[p.id] = p.color || 'blue';
      const m = L.marker([p.lat, p.lng], { icon: makeIcon(p.selected, p.color) })
        .addTo(map)
        .on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: p.id }));
        });
      markers[p.id] = m;
    });
  };

  window.flyTo = function(lat, lng, zoom) {
    map.flyTo([lat, lng], zoom || 15, { duration: 0.8 });
  };

  window.selectMarker = function(id) {
    Object.entries(markers).forEach(function([mid, m]) {
      m.setIcon(makeIcon(mid === id, markerColors[mid]));
    });
  };

  map.on('click', function() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapPress' }));
  });
</script>
</body>
</html>`;
}

const LeafletMap = forwardRef<MapRef, LeafletMapProps>(({
  initialLat = -18.9137,
  initialLng = 47.5361,
  initialZoom = 13,
  markers = [],
  onMarkerPress,
  style,
}, ref) => {
  const webViewRef = useRef<WebView>(null);

  const runJS = useCallback((js: string) => {
    webViewRef.current?.injectJavaScript(`(function(){ ${js} })(); true;`);
  }, []);

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom = 15) => {
      runJS(`window.flyTo(${lat}, ${lng}, ${zoom});`);
    },
    setMarkers: (data) => {
      runJS(`window.setMarkers(${JSON.stringify(data)});`);
    },
    setLayer: (name) => {
      runJS(`window.setLayer('${name}');`);
    },
  }));

  const onLoadEnd = useCallback(() => {
    if (markers.length > 0) {
      runJS(`window.setMarkers(${JSON.stringify(markers)});`);
    }
  }, [markers, runJS]);

  const onMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerPress' && onMarkerPress) {
        onMarkerPress(data.id);
      }
    } catch {}
  }, [onMarkerPress]);

  const html = buildHtml(initialLat, initialLng, initialZoom);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        onLoadEnd={onLoadEnd}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
});

export default LeafletMap;

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});
