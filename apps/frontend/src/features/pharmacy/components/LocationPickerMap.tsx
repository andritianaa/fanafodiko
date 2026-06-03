import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import {
  MapLayerSelector,
  MAP_LAYERS,
  type LayerOption,
} from "./MapLayerSelector";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlassIcon,
  SpinnerIcon,
  MapPinIcon,
  XIcon,
  DropIcon,
  TreeIcon,
  MountainsIcon,
  BuildingIcon,
} from "@phosphor-icons/react";
import { UserLocationMarker } from "./UserLocationMarker";
import { apiClient } from "@/api/client";

// Fix Leaflet default icon path (Vite)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MADAGASCAR_CENTER: [number, number] = [-18.9, 47.5];

// ── Types ────────────────────────────────────────────────────────────────────

interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  type: string;
  lat: string;
  lon: string;
}

export interface ReverseGeocodeResult {
  address: string;
  city: string;
  region: string;
}

interface Props {
  value: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
  /** Appelé après chaque placement de marqueur (clic ou drag) avec les infos Nominatim */
  onGeocode?: (result: ReverseGeocodeResult) => void;
}

// ── Icône par type de lieu ───────────────────────────────────────────────────

function PlaceIcon({ type }: { type: string }) {
  const cls = "shrink-0 text-muted-foreground";
  if (["river", "water", "bay", "stream", "lake"].includes(type))
    return <DropIcon size={16} weight="fill" className={cls} />;
  if (["park", "protected_area", "forest", "nature_reserve"].includes(type))
    return <TreeIcon size={16} weight="fill" className={cls} />;
  if (["peak", "mountain_range", "hill"].includes(type))
    return <MountainsIcon size={16} weight="fill" className={cls} />;
  if (["building", "house", "residential", "commercial"].includes(type))
    return <BuildingIcon size={16} weight="fill" className={cls} />;
  return <MapPinIcon size={16} weight="fill" className={cls} />;
}

// ── Sous-composant carte ─────────────────────────────────────────────────────

function MapController({
  onChange,
  flyTarget,
}: {
  onChange: Props["onChange"];
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
    if (flyTarget) map.flyTo(flyTarget, 16, { duration: 1.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTarget]);

  return null;
}

// ── Composant principal ──────────────────────────────────────────────────────

export function LocationPickerMap({ value, onChange, onGeocode }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, NominatimResult[]>>(new Map());

  const hasPosition =
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    !(value.lat === 0 && value.lng === 0);

  const center = useMemo<[number, number]>(
    () => (hasPosition ? [value.lat, value.lng] : MADAGASCAR_CENTER),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [activeLayer, setActiveLayer] = useState<LayerOption>(MAP_LAYERS[0]);

  // Clic extérieur → fermer dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Géolocalisation initiale si pas de position
  useEffect(() => {
    if (hasPosition || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setFlyTarget([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { timeout: 6000, enableHighAccuracy: false },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Geocoding inverse via backend ────────────────────────────────────────

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!onGeocode) return;
      if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
      geocodeAbortRef.current = new AbortController();

      setGeocoding(true);
      try {
        const res = await apiClient.get<ReverseGeocodeResult>(
          "/geocoding/reverse",
          {
            params: { lat, lng },
            signal: geocodeAbortRef.current.signal,
          },
        );
        onGeocode(res.data);
      } catch {
        // Ignore : réseau absent ou annulé
      } finally {
        setGeocoding(false);
      }
    },
    [onGeocode],
  );

  // ── Wrapper onChange : met à jour les coords + déclenche reverse geocoding

  const handlePositionChange = useCallback(
    (coords: { lat: number; lng: number }) => {
      onChange(coords);
      reverseGeocode(coords.lat, coords.lng);
    },
    [onChange, reverseGeocode],
  );

  // ── Recherche Nominatim ──────────────────────────────────────────────────

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const key = q.trim().toLowerCase();

      if (cacheRef.current.has(key)) {
        setResults(cacheRef.current.get(key)!);
        setIsOpen(true);
        return;
      }

      abortRef.current = new AbortController();
      setSearching(true);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8`,
          {
            signal: abortRef.current.signal,
            headers: { "Accept-Language": "fr" },
          },
        );
        const data: NominatimResult[] = await res.json();

        if (cacheRef.current.size >= 50) {
          const first = cacheRef.current.keys().next().value;
          if (first) cacheRef.current.delete(first);
        }
        cacheRef.current.set(key, data);
        setResults(data);
        setIsOpen(true);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== "AbortError") setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  // Sélection résultat de recherche → flyTo uniquement (pas de marqueur)
  const handleSelect = (r: NominatimResult) => {
    setFlyTarget([parseFloat(r.lat), parseFloat(r.lon)]);
    setQuery(r.name || r.display_name.split(",")[0].trim());
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    if (abortRef.current) abortRef.current.abort();
    inputRef.current?.focus();
  };

  const showDropdown =
    isOpen && (searching || results.length > 0 || query.trim().length >= 2);

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      <div ref={containerRef} className="relative hidden">
        <div className="relative">
          <MagnifyingGlassIcon
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              search(e.target.value);
            }}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="Rechercher un lieu à Madagascar…"
            className="pl-9 pr-16"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {query && (
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={handleClear}
              >
                <XIcon size={13} />
              </Button>
            )}
            <Button type="button" size="icon-xs" variant="ghost" disabled>
              <SpinnerIcon
                size={13}
                className={
                  searching
                    ? "animate-spin text-primary"
                    : "text-muted-foreground"
                }
              />
            </Button>
          </div>
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-[9999] w-full mt-1 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-xl overflow-hidden">
            {searching && results.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Recherche en cours…
              </p>
            )}
            {!searching && results.length === 0 && query.trim().length >= 2 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Aucun résultat pour «&nbsp;{query}&nbsp;»
              </p>
            )}
            {results.map((r) => {
              const sub = r.display_name
                .split(",")
                .slice(1, 4)
                .join(",")
                .trim();
              return (
                <button
                  key={r.place_id}
                  type="button"
                  onMouseDown={() => handleSelect(r)}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted/60 flex items-center gap-3 transition-colors border-b border-border last:border-0"
                >
                  <div className="p-1.5 bg-muted rounded-full shrink-0">
                    <PlaceIcon type={r.type} />
                  </div>
                  <span className="min-w-0">
                    <span className="text-sm font-medium text-foreground block truncate">
                      {r.name || r.display_name.split(",")[0].trim()}
                    </span>
                    {sub && (
                      <span className="text-xs text-muted-foreground block truncate">
                        {sub}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Carte */}
      <div
        className="relative h-[50vh] w-full rounded-lg border overflow-hidden"
        style={{ minHeight: 256 }}
      >
        <MapContainer
          center={center}
          zoom={hasPosition ? 15 : 6}
          className="h-full w-full"
          style={{ minHeight: 256 }}
          maxBounds={[
            [-26.5, 42.0],
            [-11.0, 51.5],
          ]}
          maxBoundsViscosity={1.0}
          minZoom={7}
        >
          <TileLayer
            key={activeLayer.id}
            attribution={activeLayer.attribution}
            url={activeLayer.url}
          />
          <UserLocationMarker autoCenter={!hasPosition} />
          <MapController
            onChange={handlePositionChange}
            flyTarget={flyTarget}
          />
          {hasPosition && (
            <Marker
              position={[value.lat, value.lng]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker;
                  const pos = m.getLatLng();
                  handlePositionChange({ lat: pos.lat, lng: pos.lng });
                },
              }}
            />
          )}
        </MapContainer>

        {/* Layer selector */}
        <div className="absolute top-3 right-3 z-[800]">
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
