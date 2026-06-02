import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  MagnifyingGlassIcon,
  CrosshairIcon,
  PillIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  ArrowSquareOutIcon,
  ClockCounterClockwiseIcon,
  CaretRightIcon,
} from '@phosphor-icons/react';
import { useMySearchHistory } from '@/features/medSearch/api/hooks';
import { useCreateMedSearch } from '@/features/medSearch/api/hooks';
import { toast } from 'sonner';
import type { CreateMedSearchInput } from '@ext/schemas';

const RADII = [1, 2, 5, 10, 20];

type GeoState = 'checking' | 'granted' | 'prompt' | 'loading' | 'denied';

export default function MedSearchPage() {
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateMedSearch();
  const { data: history = [] } = useMySearchHistory();
  const [radius, setRadius] = useState(5);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<GeoState>('checking');

  const { register, handleSubmit, formState: { errors } } = useForm<
    Omit<CreateMedSearchInput, 'coordinates' | 'radiusKm'>
  >();

  // ── Détection automatique de l'état de permission GPS ───────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGeoState('denied');
      return;
    }

    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          if (result.state === 'granted') {
            // Permission déjà accordée → localisation silencieuse
            setGeoState('loading');
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeoState('granted');
              },
              () => setGeoState('denied')
            );
          } else if (result.state === 'denied') {
            setGeoState('denied');
          } else {
            // 'prompt' : l'utilisateur n'a pas encore répondu
            setGeoState('prompt');
          }

          // Écouter les changements (ex: utilisateur change dans les paramètres)
          result.onchange = () => {
            if (result.state === 'granted') window.location.reload();
            if (result.state === 'denied') setGeoState('denied');
          };
        })
        .catch(() => setGeoState('prompt'));
    } else {
      // API permissions non disponible → on attend le clic
      setGeoState('prompt');
    }
  }, []);

  const requestLocation = () => {
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('granted');
      },
      (err) => {
        setGeoState(err.code === 1 ? 'denied' : 'prompt');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = (data: Omit<CreateMedSearchInput, 'coordinates' | 'radiusKm'>) => {
    if (!coords) return;
    mutate(
      { ...data, coordinates: coords, radiusKm: radius },
      {
        onSuccess: (res) => navigate(`/med-search/${res.id}`),
        onError: () => toast.error('Erreur lors de la recherche'),
      }
    );
  };

  return (
    <div className="max-w-lg mx-auto ">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <PillIcon size={20} className="text-primary" weight="duotone" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trouver un médicament</h1>
            <p className="text-muted-foreground text-sm">
              Les pharmacies à proximité seront alertées en temps réel
            </p>
          </div>
        </div>
      </div>

      {/* Mes recherches — bouton mis en valeur */}
      <Link to="/med-search/history" className="block mb-6">
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all px-4 py-3 group">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ClockCounterClockwiseIcon size={18} weight="duotone" className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Mes recherches</p>
            <p className="text-xs text-muted-foreground">
              {history.length > 0
                ? `${history.length} recherche${history.length > 1 ? 's' : ''} précédente${history.length > 1 ? 's' : ''}`
                : 'Historique de vos recherches'}
            </p>
          </div>
          {history.length > 0 && (
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
              {history.length}
            </span>
          )}
          <CaretRightIcon size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Medication name */}
        <div className="space-y-2">
          <Label htmlFor="med-name" className="text-sm font-medium">
            Nom du médicament <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <MagnifyingGlassIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="med-name"
              {...register('medicationName', { required: 'Champ requis' })}
              placeholder="Ex : Paracétamol 500mg, Amoxicilline…"
              className="pl-9 h-11"
              autoFocus
            />
          </div>
          {errors.medicationName && (
            <p className="text-xs text-destructive">{errors.medicationName.message}</p>
          )}
        </div>

        {/* Radius */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Rayon de recherche</Label>
          <div className="flex gap-2">
            {RADII.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  radius === r
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* GPS,état contextuel */}
        <GpsField
          state={geoState}
          coords={coords}
          onRequest={requestLocation}
        />

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note" className="text-sm font-medium">
            Note{' '}
            <span className="text-muted-foreground font-normal">(optionnel)</span>
          </Label>
          <Textarea
            id="note"
            {...register('note')}
            placeholder="Ex : dosage spécifique, forme galénique, urgence médicale…"
            rows={2}
            className="resize-none"
          />
        </div>

        <Button
          type="submit"
          disabled={isPending || geoState !== 'granted'}
          className="w-full h-12 text-base gap-2"
        >
          <MagnifyingGlassIcon size={18} />
          {isPending ? 'Envoi en cours…' : 'Lancer la recherche'}
        </Button>
      </form>
    </div>
  );
}

// ── Composant GPS contextuel ─────────────────────────────────────────────────

function GpsField({
  state,
  coords,
  onRequest,
}: {
  state: GeoState;
  coords: { lat: number; lng: number } | null;
  onRequest: () => void;
}) {
  // Permission accordée + position connue → affichage discret
  if (state === 'granted' && coords) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
        <CheckCircleIcon size={16} weight="fill" className="shrink-0" />
        <span className="flex-1">Position détectée</span>
        <span className="text-xs text-green-600 font-mono">
          {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </span>
      </div>
    );
  }

  // En cours de chargement silencieux (après permission déjà accordée)
  if (state === 'checking' || state === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border border-dashed rounded-lg px-3 py-2.5">
        <CrosshairIcon size={16} className="shrink-0 animate-pulse" />
        <span>Détection de votre position…</span>
      </div>
    );
  }

  // Permission refusée → instructions pour réactiver
  if (state === 'denied') {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
        <div className="flex items-center gap-2 text-destructive">
          <WarningCircleIcon size={16} weight="fill" className="shrink-0" />
          <span className="text-sm font-medium">Accès à la position refusé</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Votre navigateur a bloqué l'accès à votre position GPS. Pour l'activer,
          cliquez sur l'icône de cadenas dans la barre d'adresse et autorisez
          la localisation pour ce site.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:opacity-80"
        >
          Réessayer après avoir autorisé
          <ArrowSquareOutIcon size={11} />
        </button>
      </div>
    );
  }

  // État 'prompt' → invitation à autoriser (premier accès)
  return (
    <button
      type="button"
      onClick={onRequest}
      className="w-full flex items-center gap-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-4 hover:border-primary hover:bg-primary/10 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <CrosshairIcon size={20} weight="duotone" className="text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-primary">Autoriser la localisation</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Votre position GPS est nécessaire pour trouver les pharmacies autour de vous
        </p>
      </div>
    </button>
  );
}
