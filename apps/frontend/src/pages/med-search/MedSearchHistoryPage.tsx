import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMySearchHistory } from '@/features/medSearch/api/hooks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  PillIcon,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { UserSearchHistoryItem } from '@/features/medSearch/api/fetchers';

type StatusFilter = 'all' | 'available' | 'none' | 'active';

export default function MedSearchHistoryPage() {
  const { data: history = [], isLoading } = useMySearchHistory();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    return history
      .filter((item) => {
        if (filter === 'available') return item.hasAvailable;
        if (filter === 'none') return !item.hasAvailable && item.respondedCount > 0;
        if (filter === 'active') return item.status === 'active';
        return true;
      })
      .filter((item) =>
        item.medicationName.toLowerCase().includes(search.toLowerCase())
      );
  }, [history, filter, search]);

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'active', label: 'En cours' },
    { value: 'available', label: 'Trouvé' },
    { value: 'none', label: 'Non trouvé' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes recherches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Historique de vos recherches de médicaments
          </p>
        </div>
        <Button asChild>
          <Link to="/med-search">
            <MagnifyingGlassIcon className="mr-2" size={16} />
            Nouvelle recherche
          </Link>
        </Button>
      </div>

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

      {/* Contenu */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <PillIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune recherche trouvée</p>
          <p className="text-sm mt-1">
            {history.length === 0
              ? 'Vous n\'avez pas encore effectué de recherche.'
              : 'Aucun résultat pour ces critères.'}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="divide-y border rounded-xl overflow-hidden">
          {filtered.map((item) => (
            <SearchHistoryRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchHistoryRow({ item }: { item: UserSearchHistoryItem }) {
  const isActive = item.status === 'active' && new Date(item.expiresAt) > new Date();

  const statusBadge = isActive ? (
    <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 gap-1">
      <ClockIcon size={12} />
      En cours
    </Badge>
  ) : item.hasAvailable ? (
    <Badge className="bg-green-600 hover:bg-green-600 gap-1">
      <CheckCircleIcon size={12} weight="fill" />
      Trouvé
    </Badge>
  ) : item.respondedCount > 0 ? (
    <Badge variant="destructive" className="gap-1">
      <XCircleIcon size={12} weight="fill" />
      Non trouvé
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <ClockIcon size={12} />
      Expiré
    </Badge>
  );

  return (
    <Link
      to={`/med-search/${item.id}`}
      className="flex items-center gap-4 px-4 py-4 hover:bg-muted/30 transition-colors group"
    >
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <PillIcon size={18} weight="duotone" className="text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{item.medicationName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(new Date(item.createdAt), 'd MMM yyyy · HH:mm', { locale: fr })}
          {' · '}{item.radiusKm} km
          {' · '}{item.respondedCount}/{item.nearbyCount} réponse{item.respondedCount !== 1 ? 's' : ''}
        </p>
        {item.note && (
          <p className="text-xs italic text-muted-foreground truncate mt-0.5">"{item.note}"</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {statusBadge}
        <ArrowRightIcon
          size={16}
          className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </Link>
  );
}
