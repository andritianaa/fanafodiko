import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { MapLayerSelector, MAP_LAYERS, type LayerOption } from './MapLayerSelector';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { UserLocationMarker } from './UserLocationMarker';
import { PharmacyStatusBadge } from './PharmacyStatusBadge';
import type { Pharmacy, PharmacyContact } from '@ext/schemas';
import { format, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  PhoneIcon,
  NavigationArrowIcon,
  ClockIcon,
  CalendarDotsIcon,
  EnvelopeSimpleIcon,
  WhatsappLogoIcon,
  FacebookLogoIcon,
  LinkIcon,
  MapPinIcon,
  WarningIcon,
} from '@phosphor-icons/react';

// Fix Leaflet default icon path in Vite/webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const openIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const guardIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const closedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function getIcon(pharmacy: Pharmacy) {
  if (pharmacy.isOnGuard) return guardIcon;
  if (pharmacy.isOpenNow) return openIcon;
  return closedIcon;
}

function FlyToSelected({ selected }: { selected: Pharmacy | null }) {
  const map = useMap();
  useEffect(() => {
    if (selected) {
      map.flyTo([selected.coordinates.lat, selected.coordinates.lng], 18, { duration: 1.2 });
    }
  }, [selected, map]);
  return null;
}

// ── Helpers contacts ──────────────────────────────────────────────────────────

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function contactHref(c: PharmacyContact): string {
  switch (c.type) {
    case 'phone': return `tel:${c.value}`;
    case 'email': return `mailto:${c.value}`;
    case 'whatsapp': return `https://wa.me/${c.value.replace(/[^0-9]/g, '')}`;
    case 'facebook': return c.value.startsWith('http') ? c.value : `https://${c.value}`;
    default: return c.value.startsWith('http') ? c.value : `tel:${c.value}`;
  }
}

function ContactIcon({ type }: { type: PharmacyContact['type'] }) {
  switch (type) {
    case 'phone': return <PhoneIcon size={13} weight="fill" />;
    case 'email': return <EnvelopeSimpleIcon size={13} weight="fill" />;
    case 'whatsapp': return <WhatsappLogoIcon size={13} weight="fill" />;
    case 'facebook': return <FacebookLogoIcon size={13} weight="fill" />;
    default: return <LinkIcon size={13} />;
  }
}

// ── Contenu riche du popup ────────────────────────────────────────────────────

function PharmacyPopupContent({ pharmacy }: { pharmacy: Pharmacy }) {
  const contacts: PharmacyContact[] =
    pharmacy.contacts && pharmacy.contacts.length > 0
      ? pharmacy.contacts
      : pharmacy.phone
      ? [{ type: 'phone', value: pharmacy.phone }]
      : [];

  const sortedHours = [...(pharmacy.openingHours ?? [])].sort((a, b) => a.day - b.day);

  const now = new Date();
  const upcomingGuards = [...(pharmacy.guardSchedules ?? [])]
    .filter((g) => g.isActive && isAfter(new Date(g.endDate), now))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  const handleNavigate = () => {
    const { lat, lng } = pharmacy.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="w-[300px] max-h-[440px] overflow-y-auto text-foreground">

      {/* ── En-tête coloré ── */}
      <div className="bg-primary/5 border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-base leading-tight pr-6">{pharmacy.name}</h3>
          <PharmacyStatusBadge pharmacy={pharmacy} />
        </div>
        <p className="text-xs text-muted-foreground">{pharmacy.address}</p>
        {pharmacy.landmark && (
          <p className="text-[11px] text-muted-foreground/70 italic flex items-center gap-1 mt-0.5">
            <MapPinIcon size={10} /> {pharmacy.landmark}
          </p>
        )}
        <p className="text-xs font-semibold mt-1">
          {pharmacy.city}{pharmacy.region ? `, ${pharmacy.region}` : ''}
        </p>
      </div>

      <div className="px-4 py-3 space-y-3">

        {/* Images */}
        {(pharmacy.images ?? []).length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 snap-x">
            {pharmacy.images!.map((url) => (
              <img
                key={url}
                src={url}
                alt={pharmacy.name}
                className="h-20 w-28 object-cover rounded-lg border border-border shrink-0 snap-start"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* Y aller */}
        <button
          onClick={handleNavigate}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border bg-white hover:bg-muted/50 transition-colors text-sm font-medium text-foreground cursor-pointer"
        >
          <NavigationArrowIcon size={14} weight="fill" className="text-primary" />
          Y aller (itinéraire)
        </button>

        {/* Contacts */}
        {contacts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {contacts.map((c, i) => (
              <a
                key={i}
                href={contactHref(c)}
                target={c.type === 'facebook' ? '_blank' : undefined}
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-foreground hover:bg-muted/80 transition-colors no-underline"
              >
                <ContactIcon type={c.type} />
                {c.label || c.value}
              </a>
            ))}
          </div>
        )}

        {/* Horaires */}
        {pharmacy.isOpen24h ? (
          <div className="flex items-center gap-1.5 text-sky-600 text-xs font-semibold">
            <ClockIcon size={13} weight="fill" /> Ouvert 24h/24,7j/7
          </div>
        ) : sortedHours.length > 0 ? (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold flex items-center gap-1.5 mb-2 text-muted-foreground uppercase tracking-wide">
              <ClockIcon size={12} /> Horaires
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {sortedHours.map((h) => (
                <div key={h.day} className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground w-7 shrink-0">{DAYS[h.day]}</span>
                  {h.isClosed
                    ? <span className="text-destructive">Fermé</span>
                    : <span className="font-medium">{h.open}–{h.close}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Prochaines gardes */}
        {upcomingGuards.length > 0 && (
          <div className="border-t border-border pt-3 space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
              <CalendarDotsIcon size={12} /> Prochaines gardes
            </p>
            {upcomingGuards.map((g) => {
              const start = new Date(g.startDate);
              const end = new Date(g.endDate);
              const isNow = now >= start && now <= end;
              return (
                <div
                  key={g.weekIdentifier}
                  className={`rounded-lg px-3 py-2 text-[11px] ${
                    isNow
                      ? 'bg-violet-50 border border-violet-200 text-violet-800'
                      : 'bg-muted/50 border border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{g.weekIdentifier}</span>
                    {isNow && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600">
                        En cours
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5">
                    {format(start, 'eee d MMM, HH:mm', { locale: fr })} → {format(end, 'eee d MMM, HH:mm', { locale: fr })}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Garde en cours */}
        {pharmacy.isOnGuard && (
          <div className="border-t border-border pt-3">
            <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2.5 text-violet-800">
              <p className="text-xs font-bold flex items-center gap-1.5">
                <WarningIcon size={13} weight="fill" /> Pharmacie de garde actuellement
              </p>
              <p className="text-[11px] text-violet-600 mt-1">
                Un appel préalable peut être nécessaire.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface Props {
  pharmacies: Pharmacy[];
  selected: Pharmacy | null;
  onSelect: (p: Pharmacy) => void;
  onLocationUpdate?: (pos: [number, number]) => void;
  initialCenter?: [number, number] | null;
}

const MADAGASCAR_CENTER: [number, number] = [-18.9, 47.5];
const DEFAULT_ZOOM = 6;

export function PharmacyMap({ pharmacies, selected, onSelect, onLocationUpdate, initialCenter }: Props) {
  const center: [number, number] = initialCenter ?? MADAGASCAR_CENTER;
  const zoom = initialCenter ? 14 : DEFAULT_ZOOM;
  const [activeLayer, setActiveLayer] = useState<LayerOption>(MAP_LAYERS[0]);

  return (
    <div className="relative h-full w-full" style={{ minHeight: 300 }}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        style={{ minHeight: 300 }}
      >
        <TileLayer
          key={activeLayer.id}
          attribution={activeLayer.attribution}
          url={activeLayer.url}
        />

        <UserLocationMarker autoCenter={!initialCenter} onLocationUpdate={onLocationUpdate} />
        <FlyToSelected selected={selected} />

        <MarkerClusterGroup chunkedLoading>
          {pharmacies.map((p) => (
            <Marker
              key={p.id}
              position={[p.coordinates.lat, p.coordinates.lng]}
              icon={getIcon(p)}
              eventHandlers={{ click: () => onSelect(p) }}
            >
              <Popup minWidth={300} maxWidth={320} closeButton autoPan>
                <PharmacyPopupContent pharmacy={p} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Layer selector — top-right mobile, bottom-right desktop */}
      <div className="absolute top-2 right-2 md:top-auto md:bottom-4 md:right-4 z-[800]">
        <MapLayerSelector
          currentLayerId={activeLayer.id}
          onLayerChange={setActiveLayer}
        />
      </div>
    </div>
  );
}
