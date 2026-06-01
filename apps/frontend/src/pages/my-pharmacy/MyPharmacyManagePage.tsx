import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMyPharmacy, usePharmacySearchHistory } from '@/features/myPharmacy/api/hooks';
import {
  useUpdatePharmacyInfo,
  useUpdatePharmacyHours,
  useUpdatePharmacyImages,
} from '@/features/myPharmacy/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { OpeningHoursEditor } from '@/features/backoffice/pharmacies/OpeningHoursEditor';
import { ContactsEditor } from '@/features/backoffice/pharmacies/ContactsEditor';
import { PharmacyImagesEditor } from '@/features/backoffice/pharmacies/PharmacyImagesEditor';
import { LocationPickerMap } from '@/features/pharmacy/components/LocationPickerMap';
import { MembersTab } from '@/features/myPharmacy/components/MembersTab';
import { CaretLeftIcon, CheckCircleIcon, XCircleIcon, ClockIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type {
  OpeningHour,
  PharmacyContact,
  PharmacyRole,
} from '@ext/schemas';
import type { PharmacySearchHistoryItem } from '@/features/myPharmacy/api/fetchers';

const ROLE_LABELS: Record<PharmacyRole, string> = {
  superadmin: 'Super-admin',
  admin: 'Administrateur',
  staff: 'Staff',
};

function defaultOpeningHours(): OpeningHour[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: '08:00',
    close: '17:00',
    isClosed: day === 0,
  }));
}

export default function MyPharmacyManagePage() {
  const { id = '' } = useParams();
  const { data: pharmacy, isLoading } = useMyPharmacy(id);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10 text-muted-foreground">
        Pharmacie introuvable.
      </div>
    );
  }

  const myRole = pharmacy.myRole;
  const canEditInfo = myRole === 'admin' || myRole === 'superadmin';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/my-pharmacy">
            <CaretLeftIcon size={18} />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{pharmacy.name}</h1>
          <p className="text-sm text-muted-foreground">{pharmacy.city}</p>
        </div>
        <Badge variant="secondary">{ROLE_LABELS[myRole]}</Badge>
      </div>

      <Tabs defaultValue="hours">
        <TabsList className="flex-wrap h-auto">
          {canEditInfo && <TabsTrigger value="info">Infos</TabsTrigger>}
          <TabsTrigger value="hours">Horaires</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {canEditInfo && (
          <TabsContent value="info" className="mt-4">
            <InfoTab id={id} pharmacy={pharmacy} />
          </TabsContent>
        )}

        <TabsContent value="hours" className="mt-4">
          <HoursTab id={id} pharmacy={pharmacy} />
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <ImagesTab id={id} pharmacy={pharmacy} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MembersTab pharmacyId={id} myRole={myRole} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <SearchHistoryTab pharmacyId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Infos (admin+) ─── */
function InfoTab({ id, pharmacy }: { id: string; pharmacy: any }) {
  const { mutate, isPending } = useUpdatePharmacyInfo(id);
  const [form, setForm] = useState({
    name: pharmacy.name,
    address: pharmacy.address,
    landmark: pharmacy.landmark ?? '',
    city: pharmacy.city,
    region: pharmacy.region ?? '',
    coordinates: pharmacy.coordinates,
    contacts: (pharmacy.contacts ?? []) as PharmacyContact[],
  });

  const save = () => {
    mutate(form, {
      onSuccess: () => toast.success('Infos mises à jour'),
      onError: () => toast.error('Erreur'),
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Nom</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <Label>Adresse</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div>
        <Label>Repère visuel</Label>
        <Input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Ville</Label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <Label>Région</Label>
          <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Localisation</Label>
        <LocationPickerMap
          value={form.coordinates}
          onChange={(coordinates) => setForm({ ...form, coordinates })}
        />
      </div>
      <div>
        <Label className="mb-2 block">Contacts</Label>
        <ContactsEditor
          value={form.contacts}
          onChange={(contacts) => setForm({ ...form, contacts })}
        />
      </div>
      <Button onClick={save} disabled={isPending} className="w-full">
        {isPending ? 'Enregistrement…' : 'Enregistrer les infos'}
      </Button>
    </div>
  );
}

/* ─── Horaires (staff+) ─── */
function HoursTab({ id, pharmacy }: { id: string; pharmacy: any }) {
  const { mutate, isPending } = useUpdatePharmacyHours(id);
  const [isOpen24h, setIsOpen24h] = useState<boolean>(pharmacy.isOpen24h);
  const [hours, setHours] = useState<OpeningHour[]>(
    pharmacy.openingHours?.length === 7 ? pharmacy.openingHours : defaultOpeningHours()
  );

  const save = () => {
    mutate(
      { openingHours: isOpen24h ? [] : hours, isOpen24h },
      {
        onSuccess: () => toast.success('Horaires mis à jour'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border rounded-lg px-3 py-2">
        <Switch checked={isOpen24h} onCheckedChange={setIsOpen24h} id="o24" />
        <Label htmlFor="o24" className="cursor-pointer">Ouvert 24h/24</Label>
      </div>
      {!isOpen24h && <OpeningHoursEditor value={hours} onChange={setHours} />}
      <Button onClick={save} disabled={isPending} className="w-full">
        {isPending ? 'Enregistrement…' : 'Enregistrer les horaires'}
      </Button>
    </div>
  );
}

/* ─── Historique des recherches (staff+) ─── */
type HistoryFilter = 'all' | 'available' | 'unavailable' | 'pending';

function SearchHistoryTab({ pharmacyId }: { pharmacyId: string }) {
  const { data: history = [], isLoading } = usePharmacySearchHistory(pharmacyId);
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
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
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

function HistoryRow({ item }: { item: PharmacySearchHistoryItem }) {
  const statusConfig =
    item.hasStock === true
      ? { icon: <CheckCircleIcon size={16} weight="fill" className="text-green-600" />, label: 'Confirmé', cls: 'text-green-700 bg-green-50' }
      : item.hasStock === false
      ? { icon: <XCircleIcon size={16} weight="fill" className="text-red-500" />, label: 'Indisponible', cls: 'text-red-700 bg-red-50' }
      : { icon: <ClockIcon size={16} className="text-muted-foreground" />, label: 'Sans réponse', cls: 'text-muted-foreground bg-muted' };

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
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${statusConfig.cls}`}>
        {statusConfig.icon}
        {statusConfig.label}
      </span>
    </div>
  );
}

/* ─── Images (staff+) ─── */
function ImagesTab({ id, pharmacy }: { id: string; pharmacy: any }) {
  const { mutate, isPending } = useUpdatePharmacyImages(id);
  const [images, setImages] = useState<string[]>(pharmacy.images ?? []);

  useEffect(() => {
    setImages(pharmacy.images ?? []);
  }, [pharmacy.images]);

  const save = () => {
    mutate(images, {
      onSuccess: () => toast.success('Images mises à jour'),
      onError: () => toast.error('Erreur'),
    });
  };

  return (
    <div className="space-y-4">
      <PharmacyImagesEditor value={images} onChange={setImages} />
      <Button onClick={save} disabled={isPending} className="w-full">
        {isPending ? 'Enregistrement…' : 'Enregistrer les images'}
      </Button>
    </div>
  );
}
