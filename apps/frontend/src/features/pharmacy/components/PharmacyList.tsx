import { PharmacyStatusBadge } from './PharmacyStatusBadge';
import { MapPinIcon } from '@phosphor-icons/react';
import type { Pharmacy } from '@ext/schemas';

interface Props {
  pharmacies: Pharmacy[];
  selected: Pharmacy | null;
  onSelect: (p: Pharmacy) => void;
  userLocation: [number, number] | null;
}

function distanceKm(
  a: [number, number],
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a[0]) * Math.PI) / 180;
  const dLng = ((b.lng - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function PharmacyList({ pharmacies, selected, onSelect, userLocation }: Props) {
  const sorted = userLocation
    ? [...pharmacies].sort(
        (a, b) =>
          distanceKm(userLocation, a.coordinates) -
          distanceKm(userLocation, b.coordinates)
      )
    : pharmacies;

  if (sorted.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        Aucune pharmacie trouvée pour ce filtre.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {sorted.map((p) => {
        const dist = userLocation
          ? distanceKm(userLocation, p.coordinates)
          : null;

        return (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-muted/50 ${
              selected?.id === p.id ? 'bg-muted' : ''
            }`}
          >
            <MapPinIcon
              size={20}
              weight="fill"
              className={
                p.isOnGuard
                  ? 'text-violet-600 mt-0.5 shrink-0'
                  : p.isOpenNow
                  ? 'text-green-600 mt-0.5 shrink-0'
                  : 'text-red-400 mt-0.5 shrink-0'
              }
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{p.name}</span>
                <PharmacyStatusBadge pharmacy={p} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {p.address},{p.city}
              </p>
              {dist !== null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
