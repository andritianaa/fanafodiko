import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  MapLayerSelector,
  MAP_LAYERS,
  type LayerOption,
} from "./MapLayerSelector";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { UserLocationMarker } from "./UserLocationMarker";
import { PharmacyStatusBadge } from "./PharmacyStatusBadge";
import type { Pharmacy, PharmacyContact } from "@ext/schemas";
import {
  PhoneIcon,
  NavigationArrowIcon,
  MapPinSimpleIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";

// Fix Leaflet default icon path in Vite/webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const openIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const guardIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const closedIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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
      map.flyTo([selected.coordinates.lat, selected.coordinates.lng], 16, {
        duration: 1.0,
      });
    }
  }, [selected, map]);
  return null;
}

function contactHref(c: PharmacyContact): string {
  switch (c.type) {
    case "phone":
      return `tel:${c.value}`;
    case "email":
      return `mailto:${c.value}`;
    case "whatsapp":
      return `https://wa.me/${c.value.replace(/[^0-9]/g, "")}`;
    case "facebook":
      return c.value.startsWith("http") ? c.value : `https://${c.value}`;
    default:
      return c.value.startsWith("http") ? c.value : `tel:${c.value}`;
  }
}

// ── Popup simplifié ──────────────────────────────────────────────────────────
// Contient : nom (cliquable), statut, région/ville, contact principal,
//            bouton itinéraire, bouton "Voir plus"

function PharmacyPopupContent({ pharmacy }: { pharmacy: Pharmacy }) {
  const navigate = useNavigate();

  const primaryContact: PharmacyContact | undefined =
    pharmacy.contacts && pharmacy.contacts.length > 0
      ? (pharmacy.contacts.find((c) => c.type === "phone") ??
        pharmacy.contacts[0])
      : pharmacy.phone
        ? { type: "phone", value: pharmacy.phone }
        : undefined;

  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    const { lat, lng } = pharmacy.coordinates;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank",
    );
  };

  const handleViewMore = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/pharmacy/${pharmacy.id}`);
  };

  return (
    <div className="w-[220px] text-foreground">
      {/* En-tête */}
      <div className="px-3 pt-3 pb-2">
        {/* Nom cliquable → page détail */}
        <button
          onClick={handleViewMore}
          className="font-bold text-[15px] leading-tight text-left hover:text-primary transition-colors w-full mb-1.5"
        >
          {pharmacy.name}
        </button>

        {/* Statut */}
        <PharmacyStatusBadge pharmacy={pharmacy} />

        {/* Localisation */}
        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          {pharmacy.city}
          {pharmacy.region ? `, ${pharmacy.region}` : ""}
        </p>
      </div>

      {/* Contact principal */}
      {primaryContact && (
        <div className="px-3 pb-2">
          <a
            href={contactHref(primaryContact)}
            className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-primary transition-colors py-1"
          >
            {primaryContact.label || primaryContact.value}
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={handleNavigate}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border bg-white hover:bg-muted/50 text-xs font-medium text-foreground transition-colors cursor-pointer"
        >
          Itinéraire
        </button>
        <button
          onClick={handleViewMore}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors cursor-pointer"
        >
          <ArrowSquareOutIcon size={12} weight="bold" />
          Voir plus
        </button>
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

export function PharmacyMap({
  pharmacies,
  selected,
  onSelect,
  onLocationUpdate,
  initialCenter,
}: Props) {
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

        <UserLocationMarker
          autoCenter={!initialCenter}
          onLocationUpdate={onLocationUpdate}
        />
        <FlyToSelected selected={selected} />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            const size = count >= 100 ? 44 : count >= 10 ? 38 : 32;
            return L.divIcon({
              html: `<div style="
                width:${size}px;height:${size}px;
                background:#6fcc39f0;
                border:8px solid #6fcc39af;
                border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                color:black;font-size:${count >= 100 ? 11 : 13}px;
                box-shadow:0 2px 8px rgba(0,0,0,.35);
                text-color:black;
              ">${count}</div>`,
              className: "",
              iconSize: L.point(size, size, true),
            });
          }}
        >
          {pharmacies.map((p) => (
            <Marker
              key={p.id}
              position={[p.coordinates.lat, p.coordinates.lng]}
              icon={getIcon(p)}
              eventHandlers={{ click: () => onSelect(p) }}
            >
              <Popup minWidth={220} maxWidth={240} closeButton autoPan>
                <PharmacyPopupContent pharmacy={p} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Layer selector */}
      <div className="absolute top-2 right-2 z-[800]">
        <MapLayerSelector
          currentLayerId={activeLayer.id}
          onLayerChange={setActiveLayer}
        />
      </div>
    </div>
  );
}
