import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePharmacySearchHistory } from '@/features/myPharmacy/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { PharmacySearchHistoryItem } from '@/features/myPharmacy/api/fetchers';

type HistoryFilter = 'all' | 'available' | 'unavailable' | 'pending';

function HistoryRow({ item }: { item: PharmacySearchHistoryItem }) {
  const statusConfig =
    item.hasStock === true
      ? {
          icon: <CheckCircleIcon size={16} weight="fill" className="text-green-600" />,
          label: 'Confirmé',
          cls: 'text-green-700 bg-green-50',
        }
      : item.hasStock === false
      ? {
          icon: <XCircleIcon size={16} weight="fill" className="text-red-500" />,
          label: 'Indisponible',
          cls: 'text-red-700 bg-red-50',
        }
      : {
          icon: <ClockIcon size={16} className="text-muted-foreground" />,
          label: 'Sans réponse',
          cls: 'text-muted-foreground bg-muted',
        };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.medicationName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(new Date(item.createdAt), 'd MMM yyyy · HH:mm', { locale: fr })}
          {' · '}{item.radiusKm} km
          {item.note && <span className="italic"> · "{item.note}"</span>}
        </p>
      </div>
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${statusConfig.cls}`}
      >
        {statusConfig.icon}
        {statusConfig.label}
      </span>
    </div>
  );
}

export default function HistorySection() {
  const { id = '' } = useParams();
  const { data: history = [], isLoading } = usePharmacySearchHistory(id);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const filtered = useMemo(() => {
    return history
      .filter((item) => {
        if (filter === 'available') return item.hasStock === true;
        if (filter === 'unavailable') return item.hasStock === false;
        if (filter === 'pending') return item.hasStock === null;
        return true;
      })
      .filter((item) =>
        item.medicationName.toLowerCase().includes(search.toLowerCase())
      );
  }, [history, filter, search]);

  const filters: { value: HistoryFilter; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'available', label: 'Confirmé' },
    { value: 'unavailable', label: 'Indisponible' },
    { value: 'pending', label: 'Sans réponse' },
  ];

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Barre de recherche */}
      <div className="relative">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <Input
          placeholder="Rechercher un médicament…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? 'default' : 'outline'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {f.value === 'all' && history.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">{history.length}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          Aucune demande trouvée.
        </p>
      ) : (
        <div className="divide-y border rounded-lg overflow-hidden">
          {filtered.map((item) => (
            <HistoryRow key={item.searchId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
