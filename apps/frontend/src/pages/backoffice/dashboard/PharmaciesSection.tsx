import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilIcon,
  UserCirclePlusIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Pharmacy } from '@ext/schemas';
import { BatchGuardDialog } from '@/features/backoffice/pharmacies/BatchGuardDialog';
import { PharmacyFormDialog } from '@/features/backoffice/pharmacies/PharmacyFormDialog';
import { PharmacyStaffDialog } from '@/features/backoffice/pharmacies/PharmacyStaffDialog';

export default function PharmaciesSection() {
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

  const [search, setSearch] = useState('');
  const { data: searchResults } = usePharmacySearch(search);

  const allPharmacies = data?.pharmacies ?? [];

  const filteredPharmacies =
    search.length >= 2 && searchResults
      ? allPharmacies.filter((p) => searchResults.results.some((r) => r.id === p.id))
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
      onSuccess: () => { toast.success('Pharmacie supprimée'); setDeleteTarget(null); },
      onError: () => toast.error('Erreur lors de la suppression'),
    });
  };

  const handleAssignOwner = () => {
    if (!ownerTarget || !ownerEmail.trim()) { toast.error('Email requis'); return; }
    assignOwner(
      { id: ownerTarget.id, email: ownerEmail.trim() },
      {
        onSuccess: () => { toast.success('Propriétaire assigné'); setOwnerTarget(null); setOwnerEmail(''); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Utilisateur introuvable'),
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Barre d'actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
        <Button variant="outline" onClick={() => setBatchOpen(true)} className="gap-2 shrink-0">
          🚨 Saisie par lot
        </Button>
        <Button onClick={() => { setEditPharmacy(null); setFormOpen(true); }} className="gap-2 shrink-0">
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
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium">Nom</th>
                    <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Ville</th>
                    <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Téléphone</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {filteredPharmacies.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          className="text-left hover:underline"
                          onClick={() => navigate(`/backoffice/pharmacy/${p.id}`)}
                        >
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{p.address}</div>
                        </button>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{p.city}</td>
                      <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">{p.phone ?? '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm" title="Gérer le staff" onClick={() => setStaffTarget(p)}>
                            <UsersThreeIcon size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" title="Assigner un propriétaire"
                            onClick={() => { setOwnerTarget(p); setOwnerEmail(''); }}>
                            <UserCirclePlusIcon size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1.5"
                            onClick={() => { setEditPharmacy(p); setFormOpen(true); }}>
                            <PencilIcon size={13} /> Modifier
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteTarget(p)}>
                            <TrashIcon size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPharmacies.length === 0 && (
                <p className="text-center text-muted-foreground py-10 text-sm">Aucune pharmacie trouvée.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {staffTarget && (
        <PharmacyStaffDialog open={!!staffTarget} onClose={() => setStaffTarget(null)}
          pharmacyId={staffTarget.id} pharmacyName={staffTarget.name} />
      )}
      <BatchGuardDialog open={batchOpen} onClose={() => setBatchOpen(false)} pharmacies={allPharmacies} />
      <PharmacyFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditPharmacy(null); }} pharmacy={editPharmacy} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette pharmacie ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!ownerTarget} onOpenChange={(o) => !o && setOwnerTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assigner un propriétaire</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Désignez le <strong>superadmin</strong> de <strong>{ownerTarget?.name}</strong>.
            </p>
            <Input type="email" placeholder="email@exemple.mg" value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAssignOwner()} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOwnerTarget(null)}>Annuler</Button>
            <Button onClick={handleAssignOwner} disabled={assigning}>
              {assigning ? 'Assignation…' : 'Assigner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
