import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackofficeUsers } from '@/features/backoffice/api/hooks';
import {
  useBackofficePharmacies,
  useDeletePharmacy,
  usePharmacySearch,
  useAssignPharmacyOwner,
} from '@/features/pharmacy/api/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
import {
  ShieldIcon,
  UsersIcon,
  HospitalIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilIcon,
  UserCirclePlusIcon,
  UsersThreeIcon,
  TrayIcon,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import type { BackofficeUser, Pharmacy } from '@ext/schemas';
import { BatchGuardDialog } from '@/features/backoffice/pharmacies/BatchGuardDialog';
import { PharmacyFormDialog } from '@/features/backoffice/pharmacies/PharmacyFormDialog';
import { PharmacyStaffDialog } from '@/features/backoffice/pharmacies/PharmacyStaffDialog';
import { RequestsTab } from '@/features/backoffice/pharmacies/RequestsTab';
import { usePharmacyRequests } from '@/features/pharmacyRequest/api/hooks';

/* ─────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────── */
const ROLE_LABELS: Record<BackofficeUser['role'], string> = {
  user: 'Utilisateur',
  admin: 'Administrateur',
  support: 'Support',
};
const ROLE_VARIANTS: Record<
  BackofficeUser['role'],
  'default' | 'secondary' | 'destructive'
> = {
  user: 'secondary',
  admin: 'default',
  support: 'destructive',
};

/* ─────────────────────────────────────────
   ONGLET UTILISATEURS
───────────────────────────────────────── */
function UsersTab() {
  const { data, isLoading, isError } = useBackofficeUsers();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Utilisateurs</span>
          {data && <Badge variant="secondary">{data.total} au total</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        )}
        {isError && (
          <p className="text-destructive text-sm">
            Impossible de charger les utilisateurs.
          </p>
        )}
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-3 pr-4 font-medium">Email</th>
                  <th className="text-left py-3 pr-4 font-medium">Rôle</th>
                  <th className="text-left py-3 font-medium">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono">{user.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={ROLE_VARIANTS[user.role]}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {format(new Date(user.createdAt), 'dd MMM yyyy', {
                        locale: fr,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────
   ONGLET PHARMACIES
───────────────────────────────────────── */
function PharmaciesTab() {
  const navigate = useNavigate();
  const { data, isLoading } = useBackofficePharmacies();
  const { mutate: remove, isPending: deleting } = useDeletePharmacy();
  const { mutate: assignOwner, isPending: assigning } = useAssignPharmacyOwner();

  const [batchOpen, setBatchOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editPharmacy, setEditPharmacy] = useState<Pharmacy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pharmacy | null>(null);
  const [ownerTarget, setOwnerTarget] = useState<Pharmacy | null>(null);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [staffTarget, setStaffTarget] = useState<Pharmacy | null>(null);

  // Recherche rapide : si ≥ 2 car → autocomplete API, sinon filtre local
  const [search, setSearch] = useState('');
  const { data: searchResults } = usePharmacySearch(search);

  const allPharmacies = data?.pharmacies ?? [];

  // Si la recherche est active et l'API répond → utiliser ses IDs pour filtrer
  const filteredPharmacies =
    search.length >= 2 && searchResults
      ? allPharmacies.filter((p) =>
          searchResults.results.some((r) => r.id === p.id)
        )
      : search.length > 0
      ? allPharmacies.filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.city.toLowerCase().includes(search.toLowerCase())
        )
      : allPharmacies;

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Pharmacie supprimée');
        setDeleteTarget(null);
      },
      onError: () => toast.error('Erreur lors de la suppression'),
    });
  };

  const handleAssignOwner = () => {
    if (!ownerTarget || !ownerEmail.trim()) {
      toast.error('Email requis');
      return;
    }
    assignOwner(
      { id: ownerTarget.id, email: ownerEmail.trim() },
      {
        onSuccess: () => {
          toast.success('Propriétaire (superadmin) assigné');
          setOwnerTarget(null);
          setOwnerEmail('');
        },
        onError: (e: any) =>
          toast.error(e.response?.data?.message || 'Utilisateur introuvable'),
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Barre d'actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Recherche rapide (nom, ville…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
          {search.length >= 2 && searchResults && (
            <p className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {filteredPharmacies.length} résultat(s)
            </p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setBatchOpen(true)}
          className="gap-2 shrink-0"
        >
          🚨 Saisie par lot
        </Button>
        <Button
          onClick={() => {
            setEditPharmacy(null);
            setFormOpen(true);
          }}
          className="gap-2 shrink-0"
        >
          <PlusIcon size={14} /> Nouvelle pharmacie
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pharmacies</span>
            <Badge variant="secondary">{allPharmacies.length} au total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium">Nom</th>
                    <th className="text-left py-3 px-4 font-medium hidden md:table-cell">
                      Ville
                    </th>
                    <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">
                      Téléphone
                    </th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {filteredPharmacies.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          className="text-left hover:underline"
                          onClick={() => navigate(`/backoffice/pharmacy/${p.id}`)}
                        >
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {p.address}
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                        {p.city}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                        {p.phone ?? '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Gérer le staff"
                            onClick={() => setStaffTarget(p)}
                          >
                            <UsersThreeIcon size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            title="Assigner un propriétaire (superadmin)"
                            onClick={() => {
                              setOwnerTarget(p);
                              setOwnerEmail('');
                            }}
                          >
                            <UserCirclePlusIcon size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                              setEditPharmacy(p);
                              setFormOpen(true);
                            }}
                          >
                            <PencilIcon size={13} /> Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteTarget(p)}
                          >
                            <TrashIcon size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPharmacies.length === 0 && (
                <p className="text-center text-muted-foreground py-10 text-sm">
                  Aucune pharmacie trouvée.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff dialog */}
      {staffTarget && (
        <PharmacyStaffDialog
          open={!!staffTarget}
          onClose={() => setStaffTarget(null)}
          pharmacyId={staffTarget.id}
          pharmacyName={staffTarget.name}
        />
      )}

      {/* Dialogs */}
      <BatchGuardDialog
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        pharmacies={allPharmacies}
      />
      <PharmacyFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditPharmacy(null);
        }}
        pharmacy={editPharmacy}
      />

      {/* Confirmation suppression */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette pharmacie ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> sera définitivement
              supprimée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assigner propriétaire */}
      <Dialog open={!!ownerTarget} onOpenChange={(o) => !o && setOwnerTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner un propriétaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Désignez le <strong>superadmin</strong> de{' '}
              <strong>{ownerTarget?.name}</strong>. L'utilisateur doit déjà avoir un
              compte Fanafodiko.
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
            <Button variant="outline" onClick={() => setOwnerTarget(null)}>
              Annuler
            </Button>
            <Button onClick={handleAssignOwner} disabled={assigning}>
              {assigning ? 'Assignation…' : 'Assigner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────── */
export default function BackofficePage() {
  const { data: requestsData } = usePharmacyRequests();
  const pendingCount =
    requestsData?.requests.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldIcon size={28} weight="duotone" className="text-orange-600" />
        <div>
          <h1 className="text-2xl font-bold">Backoffice</h1>
          <p className="text-muted-foreground text-sm">
            Administration Fanafodiko
          </p>
        </div>
      </div>

      <Tabs defaultValue="pharmacies">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="pharmacies" className="gap-2">
            <HospitalIcon size={14} /> Pharmacies
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <TrayIcon size={14} /> Demandes
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <UsersIcon size={14} /> Utilisateurs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pharmacies" className="mt-4">
          <PharmaciesTab />
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          <RequestsTab />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
