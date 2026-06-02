import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBackofficePharmacy, useUpdatePharmacy, useAssignPharmacyOwner } from '@/features/pharmacy/api/hooks';
import {
  usePharmacyStaff,
  useBackofficeRemoveMember,
  useBackofficeUpdateMemberRole,
} from '@/features/backoffice/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { OpeningHoursEditor } from '@/features/backoffice/pharmacies/OpeningHoursEditor';
import { ContactsEditor } from '@/features/backoffice/pharmacies/ContactsEditor';
import { PharmacyImagesEditor } from '@/features/backoffice/pharmacies/PharmacyImagesEditor';
import { ExceptionalSchedulesTab } from '@/features/myPharmacy/components/ExceptionalSchedulesTab';
import { LocationPickerMap } from '@/features/pharmacy/components/LocationPickerMap';
import { PharmacyStatusBadge } from '@/features/pharmacy/components/PharmacyStatusBadge';
import {
  CaretLeftIcon,
  ClockIcon,
  ShieldIcon,
  TrashIcon,
  UserCirclePlusIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { OpeningHour, PharmacyContact, PharmacyRole, Pharmacy } from '@ext/schemas';

const ROLE_LABELS: Record<PharmacyRole, string> = {
  superadmin: 'Super-admin',
  admin: 'Administrateur',
  staff: 'Staff',
};

const ROLE_VARIANTS: Record<PharmacyRole, 'default' | 'secondary' | 'outline'> = {
  superadmin: 'default',
  admin: 'secondary',
  staff: 'outline',
};

function defaultOpeningHours(): OpeningHour[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: '08:00',
    close: '17:00',
    isClosed: day === 0,
  }));
}

export default function BackofficePharmacyPage() {
  const { id = '' } = useParams();
  const { data: pharmacy, isLoading } = useBackofficePharmacy(id);

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

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/backoffice">
            <CaretLeftIcon size={18} />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{pharmacy.name}</h1>
          <p className="text-sm text-muted-foreground">{pharmacy.city}</p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-orange-600 border-orange-300">
          <ShieldIcon size={12} weight="fill" />
          Admin
        </Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="info">Infos</TabsTrigger>
          <TabsTrigger value="hours">Horaires</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab pharmacy={pharmacy} pharmacyId={id} />
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <InfoTab id={id} pharmacy={pharmacy} />
        </TabsContent>

        <TabsContent value="hours" className="mt-4">
          <HoursTab id={id} pharmacy={pharmacy} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <ExceptionalSchedulesTab
            pharmacyId={id}
            schedules={pharmacy.exceptionalSchedules ?? []}
            pharmacyGuards={pharmacy.pharmacyGuards ?? []}
            openingHours={pharmacy.openingHours ?? []}
            pharmacySource="backoffice"
          />
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <ImagesTab id={id} pharmacy={pharmacy} />
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <StaffTab pharmacyId={id} pharmacyName={pharmacy.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Vue d'ensemble ─── */
function OverviewTab({ pharmacy }: { pharmacy: Pharmacy; pharmacyId: string }) {
  const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const today = new Date().getDay();
  const todayHours = (pharmacy.openingHours ?? []).find((h) => h.day === today);
  const activeGuards = (pharmacy.pharmacyGuards ?? []).filter((g) => g.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 border rounded-xl bg-muted/20">
        <PharmacyStatusBadge pharmacy={pharmacy} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{pharmacy.address}</p>
          <p className="text-xs text-muted-foreground">
            {pharmacy.city}{pharmacy.region ? `, ${pharmacy.region}` : ''}
          </p>
        </div>
      </div>

      {/* Horaire du jour */}
      <div className="border rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <ClockIcon size={13} /> Aujourd'hui
        </p>
        {pharmacy.isOpen24h ? (
          <p className="text-sm font-medium text-sky-600">Ouvert 24h/24</p>
        ) : todayHours ? (
          todayHours.isClosed ? (
            <p className="text-sm text-destructive">Fermé</p>
          ) : (
            <p className="text-sm font-medium">{todayHours.open} – {todayHours.close}</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Horaires non définis</p>
        )}
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">
            {(pharmacy.openingHours ?? []).filter((h) => !h.isClosed).length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">jours d'ouverture / sem.</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{activeGuards}</p>
          <p className="text-xs text-muted-foreground mt-0.5">garde(s) active(s)</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{(pharmacy.exceptionalSchedules ?? []).length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">exception(s) d'horaire</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{(pharmacy.images ?? []).length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">photo(s)</p>
        </div>
      </div>

      {!pharmacy.isOpen24h && (pharmacy.openingHours ?? []).length > 0 && (
        <div className="border rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Planning habituel
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {[...(pharmacy.openingHours ?? [])].sort((a, b) => a.day - b.day).map((h) => (
              <div key={h.day} className={`flex justify-between text-xs ${h.day === today ? 'font-bold text-primary' : ''}`}>
                <span className="text-muted-foreground w-8 shrink-0">{DAYS[h.day]}</span>
                {h.isClosed ? (
                  <span className="text-destructive">Fermé</span>
                ) : (
                  <span>{h.open}–{h.close}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Infos ─── */
function InfoTab({ id, pharmacy }: { id: string; pharmacy: Pharmacy }) {
  const { mutate, isPending } = useUpdatePharmacy();
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
    mutate(
      { id, data: form },
      {
        onSuccess: () => toast.success('Infos mises à jour'),
        onError: () => toast.error('Erreur'),
      }
    );
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
          value={form.coordinates ? { lat: form.coordinates.lat ?? 0, lng: form.coordinates.lng ?? 0 } : { lat: 0, lng: 0 }}
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

/* ─── Horaires ─── */
function HoursTab({ id, pharmacy }: { id: string; pharmacy: Pharmacy }) {
  const { mutate, isPending } = useUpdatePharmacy();
  const [isOpen24h, setIsOpen24h] = useState<boolean>(pharmacy.isOpen24h);
  const [hours, setHours] = useState<OpeningHour[]>(
    pharmacy.openingHours?.length === 7 ? pharmacy.openingHours : defaultOpeningHours()
  );

  const save = () => {
    mutate(
      { id, data: { openingHours: isOpen24h ? [] : hours, isOpen24h } },
      {
        onSuccess: () => toast.success('Horaires mis à jour'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border rounded-lg px-3 py-2">
        <Switch checked={isOpen24h} onCheckedChange={setIsOpen24h} id="o24-bo" />
        <Label htmlFor="o24-bo" className="cursor-pointer">Ouvert 24h/24</Label>
      </div>
      {!isOpen24h && <OpeningHoursEditor value={hours} onChange={setHours} />}
      <Button onClick={save} disabled={isPending} className="w-full">
        {isPending ? 'Enregistrement…' : 'Enregistrer les horaires'}
      </Button>
    </div>
  );
}

/* ─── Images ─── */
function ImagesTab({ id, pharmacy }: { id: string; pharmacy: Pharmacy }) {
  const { mutate, isPending } = useUpdatePharmacy();
  const [images, setImages] = useState<string[]>(pharmacy.images ?? []);

  useEffect(() => {
    setImages(pharmacy.images ?? []);
  }, [pharmacy.images]);

  const save = () => {
    mutate(
      { id, data: { images } },
      {
        onSuccess: () => toast.success('Images mises à jour'),
        onError: () => toast.error('Erreur'),
      }
    );
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

/* ─── Staff (admin app — accès total) ─── */
function StaffTab({ pharmacyId, pharmacyName }: { pharmacyId: string; pharmacyName: string }) {
  const { data: members, isLoading } = usePharmacyStaff(pharmacyId);
  const { mutate: removeMember, isPending: removing } = useBackofficeRemoveMember(pharmacyId);
  const { mutate: updateRole } = useBackofficeUpdateMemberRole(pharmacyId);
  const { mutate: assignOwner, isPending: assigning } = useAssignPharmacyOwner();

  const [removeTarget, setRemoveTarget] = useState<{ userId: string; email: string } | null>(null);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);

  const handleRemove = () => {
    if (!removeTarget) return;
    removeMember(removeTarget.userId, {
      onSuccess: () => {
        toast.success(`${removeTarget.email} retiré(e)`);
        setRemoveTarget(null);
      },
      onError: () => toast.error('Erreur'),
    });
  };

  const handleRoleChange = (userId: string, email: string, role: PharmacyRole) => {
    updateRole(
      { userId, role },
      {
        onSuccess: () => toast.success(`Rôle de ${email} : ${ROLE_LABELS[role]}`),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleAssignOwner = () => {
    if (!ownerEmail.trim()) {
      toast.error('Email requis');
      return;
    }
    assignOwner(
      { id: pharmacyId, email: ownerEmail.trim() },
      {
        onSuccess: () => {
          toast.success('Super-admin assigné');
          setOwnerEmail('');
          setShowOwnerDialog(false);
        },
        onError: (e: any) =>
          toast.error(e.response?.data?.message || 'Utilisateur introuvable'),
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Bannière admin */}
      <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800">
        <ShieldIcon size={14} className="mt-0.5 shrink-0" weight="fill" />
        En tant qu'admin de l'application, vous pouvez modifier ou retirer n'importe quel
        membre, y compris les super-admins.
      </div>

      {/* Action : assigner un superadmin */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowOwnerDialog(true)}
        >
          <UserCirclePlusIcon size={14} />
          Assigner un super-admin
        </Button>
      </div>

      {/* Liste membres */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !members || members.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">
          Cette pharmacie n'a aucun membre enregistré.
        </p>
      ) : (
        <div className="divide-y border rounded-xl overflow-hidden">
          {members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.email}</p>
              </div>

              <Select
                value={m.role}
                onValueChange={(v) => handleRoleChange(m.userId, m.email, v as PharmacyRole)}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['staff', 'admin', 'superadmin'] as PharmacyRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge variant={ROLE_VARIANTS[m.role]} className="shrink-0 hidden sm:flex">
                {ROLE_LABELS[m.role]}
              </Badge>

              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                onClick={() => setRemoveTarget({ userId: m.userId, email: m.email })}
              >
                <TrashIcon size={15} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dialog : assigner super-admin */}
      <Dialog open={showOwnerDialog} onOpenChange={(o) => !o && setShowOwnerDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner un super-admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Désignez le <strong>super-admin</strong> de <strong>{pharmacyName}</strong>.
              L'utilisateur doit déjà avoir un compte.
            </p>
            <Input
              type="email"
              placeholder="email@exemple.mg"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAssignOwner()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOwnerDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAssignOwner} disabled={assigning}>
              {assigning ? 'Assignation…' : 'Assigner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeTarget?.email}</strong> sera retiré de la pharmacie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700"
            >
              {removing ? 'Suppression…' : 'Retirer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
