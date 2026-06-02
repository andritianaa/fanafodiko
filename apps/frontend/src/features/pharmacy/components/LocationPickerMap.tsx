import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapLayerSelector, MAP_LAYERS, type LayerOption } from './MapLayerSelector';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { MagnifyingGlassIcon, SpinnerIcon, MapPinIcon } from '@phosphor-icons/react';
import { UserLocationMarker } from './UserLocationMarker';

// Fix Leaflet default icon path (Vite)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MADAGASCAR_CENTER: [number, number] = [-18.9, 47.5];

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  value: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
}

// Sub-component: handles click + updates map view when flyTarget changes
function MapController({
  onChange,
  flyTarget,
}: {
  onChange: Props['onChange'];
  flyTarget: [number, number] | null;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  // Fly to geocoded result
  useMemo(() => {
    if (flyTarget) {
      map.flyTo(flyTarget, 16, { duration: 1.2 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTarget]);

  return null;
}

export function LocationPickerMap({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasPosition =
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    !(value.lat === 0 && value.lng === 0);

  // Centre initial : position existante si connue, sinon Madagascar
  const center = useMemo<[number, number]>(
    () => (hasPosition ? [value.lat, value.lng] : MADAGASCAR_CENTER),
    // Calculé une seule fois au montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [activeLayer, setActiveLayer] = useState<LayerOption>(MAP_LAYERS[0]);

  // Si aucune position sélectionnée → centrer sur la géolocalisation de l'utilisateur
  useEffect(() => {
    if (hasPosition) return; // déjà positionné
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const target: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setFlyTarget(target);
      },
      () => { /* refus / indisponible → Madagascar center (déjà par défaut) */ },
      { timeout: 6000, enableHighAccuracy: false }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geocoding via Nominatim — biais Madagascar (viewbox) sans restriction stricte
  const search = useCallback((q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          format: 'json',
          q,
          limit: '8',
          // Viewbox = bounding box Madagascar, bounded=0 = préférence mais pas restriction
          viewbox: '43.2,-25.6,50.5,-11.9',
          bounded: '0',
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { headers: { 'Accept-Language': 'fr', 'User-Agent': 'Fanafodiko/1.0' } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const handleSelect = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    onChange({ lat, lng });
    setFlyTarget([lat, lng]);
    // Garder le nom court dans l'input, affichage complet dans le dropdown
    const parts = r.display_name.split(',');
    setQuery(parts.slice(0, 2).join(',').trim());
    setShowDropdown(false);
    setResults([]);
  };

  return (
    <div className="space-y-3">
      {/* Geocoding search */}
      <div className="relative">
        <div className="relative">
          <MagnifyingGlassIcon
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              search(e.target.value);
            }}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Rechercher un lieu à Madagascar…"
            className="pl-9 pr-8"
          />
          {searching && (
            <SpinnerIcon
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin"
            />
          )}
        </div>

        {/* Dropdown results */}
        {showDropdown && results.length > 0 && (
          <div className="absolute z-[9999] w-full mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {results.map((r) => {
              const parts = r.display_name.split(',');
              const name = parts[0].trim();
              const sub = parts.slice(1, 4).join(',').trim();
              return (
                <button
                  key={r.place_id}
                  type="button"
                  onMouseDown={() => handleSelect(r)}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted/50 flex items-start gap-2.5 transition-colors border-b border-border last:border-0"
                >
                  <MapPinIcon size={14} className="text-primary shrink-0 mt-0.5" weight="fill" />
                  <span className="min-w-0">
                    <span className="text-sm font-medium text-foreground block truncate">{name}</span>
                    {sub && (
                      <span className="text-xs text-muted-foreground block truncate">{sub}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!searching && showDropdown && results.length === 0 && query.trim().length >= 2 && (
          <div className="absolute z-[9999] w-full mt-1 bg-white border border-border rounded-lg shadow-lg px-3 py-3 text-sm text-muted-foreground">
            Aucun résultat pour «&nbsp;{query}&nbsp;»
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Ou cliquez directement sur la carte, déplacez le marqueur pour ajuster.
      </p>

      {/* Map */}
      <div className="relative h-[50vh] w-full rounded-lg border overflow-hidden" style={{ minHeight: 256 }}>
        <MapContainer
          center={center}
          zoom={hasPosition ? 15 : 6}
          className="h-full w-full"
          style={{ minHeight: 256 }}
        >
          <TileLayer
            key={activeLayer.id}
            attribution={activeLayer.attribution}
            url={activeLayer.url}
          />
          {/* Point bleu position actuelle,toujours visible */}
          <UserLocationMarker autoCenter={!hasPosition} />
          <MapController onChange={onChange} flyTarget={flyTarget} />
          {hasPosition && (
            <Marker
              position={[value.lat, value.lng]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker;
                  const pos = m.getLatLng();
                  onChange({ lat: pos.lat, lng: pos.lng });
                },
              }}
            />
          )}
        </MapContainer>
        {/* Layer selector */}
        <div className="absolute bottom-3 right-3 z-[800]">
          <MapLayerSelector
            currentLayerId={activeLayer.id}
            onLayerChange={setActiveLayer}
          />
        </div>
      </div>

      {hasPosition && (
        <p className="text-xs text-muted-foreground font-mono">
          {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
