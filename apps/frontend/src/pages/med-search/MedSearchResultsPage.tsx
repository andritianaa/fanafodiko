import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMedSearch, useMedSearchStream } from '@/features/medSearch/api/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  WifiHighIcon,
  WifiSlashIcon,
  PillIcon,
  MapPinIcon,
  SortAscendingIcon,
} from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MedSearchResponseItem } from '@/features/medSearch/api/fetchers';

type PharmacyStatus = 'available' | 'unavailable' | 'pending';

interface PharmacyRow {
  id: string;
  name: string;
  distance: number;
  status: PharmacyStatus;
  response?: MedSearchResponseItem;
  coordinates: { lat: number; lng: number };
}

function StatusBadge({ status }: { status: PharmacyStatus }) {
  if (status === 'available') {
    return (
      <Badge className="bg-green-600 hover:bg-green-600 gap-1 text-xs">
        <CheckCircleIcon size={11} weight="fill" /> Disponible
      </Badge>
    );
  }
  if (status === 'unavailable') {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <XCircleIcon size={11} weight="fill" /> Indisponible
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <ClockIcon size={11} /> En attente
    </Badge>
  );
}

function LiveIndicator({ connected }: { connected: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-green-600' : 'text-muted-foreground'}`}>
      {connected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
          </span>
          <WifiHighIcon size={13} />
          En direct
        </>
      ) : (
        <>
          <WifiSlashIcon size={13} />
          Hors connexion
        </>
      )}
    </div>
  );
}

export default function MedSearchResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: search, isLoading } = useMedSearch(id!);
  const { connected } = useMedSearchStream(id ?? null);

  const rows = useMemo<PharmacyRow[]>(() => {
    if (!search) return [];
    const responseMap = new Map(search.responses.map((r) => [r.pharmacyId, r]));
    return search.nearbyPharmacies
      .map((p) => {
        const response = responseMap.get(p.id);
        const status: PharmacyStatus = response
          ? response.hasStock ? 'available' : 'unavailable'
          : 'pending';
        return { id: p.id, name: p.name, distance: p.distance, status, response, coordinates: p.coordinates };
      })
      .sort((a, b) => {
        const order = { available: 0, unavailable: 2, pending: 1 };
        return order[a.status] - order[b.status] || a.distance - b.distance;
      });
  }, [search]);

  const responded = rows.filter((r) => r.status !== 'pending').length;
  const available = rows.filter((r) => r.status === 'available').length;
  const total = rows.length;
  const progress = total > 0 ? Math.round((responded / total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (!search) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Recherche introuvable.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/med-search">Nouvelle recherche</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0 mt-0.5">
          <Link to="/med-search"><ArrowLeftIcon size={18} /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-bold truncate">{search.medicationName}</h1>
            <LiveIndicator connected={connected} />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPinIcon size={13} /> {search.radiusKm} km à la ronde
            </span>
            <span className="flex items-center gap-1">
              <PillIcon size={13} /> {total} pharmacie{total > 1 ? 's' : ''} notifiée{total > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{responded}/{total} pharmacies ont répondu</span>
          {available > 0 && (
            <Badge className="bg-green-600 hover:bg-green-600 gap-1">
              <CheckCircleIcon size={11} weight="fill" />
              {available} disponible{available > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        {search.note && (
          <p className="text-xs text-muted-foreground border-t pt-3">
            <span className="font-medium">Note :</span> {search.note}
          </p>
        )}
      </div>

      {/* Pharmacy list */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <SortAscendingIcon size={13} /> Triées par disponibilité puis distance
        </div>

        {rows.map((row) => (
          <div
            key={row.id}
            onClick={() => navigate('/map', { state: { pharmacyId: row.id, lat: row.coordinates.lat, lng: row.coordinates.lng } })}
            className={`rounded-xl border bg-card p-4 flex items-center gap-4 transition-colors cursor-pointer group hover:shadow-md ${
              row.status === 'available' ? 'border-green-200 bg-green-50/50 hover:bg-green-50' :
              row.status === 'unavailable' ? 'border-red-100 hover:bg-red-50/30' : 'hover:bg-muted/40'
            }`}
          >
            {/* Status icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              row.status === 'available' ? 'bg-green-100' :
              row.status === 'unavailable' ? 'bg-red-100' : 'bg-muted'
            }`}>
              {row.status === 'available' && <CheckCircleIcon size={20} weight="fill" className="text-green-600" />}
              {row.status === 'unavailable' && <XCircleIcon size={20} weight="fill" className="text-red-500" />}
              {row.status === 'pending' && <ClockIcon size={20} className="text-muted-foreground" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{row.name}</span>
                <StatusBadge status={row.status} />
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {row.distance < 1
                    ? `${Math.round(row.distance * 1000)} m`
                    : `${row.distance.toFixed(1)} km`}
                </span>
                {row.response && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(row.response.respondedAt), { addSuffix: true, locale: fr })}
                  </span>
                )}
              </div>
              {row.response?.note && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  "{row.response.note}"
                </p>
              )}
            </div>

            {/* Map hint */}
            <MapPinIcon
              size={18}
              className="shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors"
            />
          </div>
        ))}

        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
            Aucune pharmacie trouvée dans ce rayon.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center">
        <Button asChild variant="outline" size="sm">
          <Link to="/med-search">Nouvelle recherche</Link>
        </Button>
      </div>
    </div>
  );
}
