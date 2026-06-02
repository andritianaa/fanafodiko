import { useState, useMemo } from 'react';
import { PlusIcon, ListIcon, MagnifyingGlassIcon, TrashIcon, PencilIcon, UsersIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHouseholdMembers } from '@/features/household/api/hooks';
import { useMedications, useToggleMedicationStatus, useRemoveMedication } from '@/features/medication/api/hooks';
import { MedicationDialog } from '@/features/medication/components/MedicationDialog';
import type { Medication } from '@/features/medication/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MemberAvatar } from '@/features/household/components/MemberAvatar';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { DAY_MAP } from '@/features/medication/constants';
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export default function MedicationsPage() {
  const { data: members } = useHouseholdMembers();
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');
  const { data: medications, isLoading: isLoadingMeds } = useMedications(selectedProfileId);
  const [searchQuery, setSearchQuery] = useState('');
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | undefined>();
  const { mutate: toggleStatus } = useToggleMedicationStatus();
  const { mutate: removeMedication } = useRemoveMedication();

  const selectedMember = members?.find((m) => m.id === selectedProfileId);

  const filteredMedications = useMemo(() => {
    if (!medications) return [];
    return medications.filter((med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [medications, searchQuery]);

  const handleAdd = () => {
    setEditingMedication(undefined);
    setMedicationDialogOpen(true);
  };

  const handleEdit = (med: Medication) => {
    setEditingMedication(med);
    setMedicationDialogOpen(true);
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleStatus({ id, isActive: !currentStatus });
  };

  const handleRemove = (id: string) => {
    if (globalThis.confirm('Supprimer ce médicament ?')) {
      removeMedication(id, {
        onSuccess: () => toast.success('Médicament supprimé'),
        onError: (error: any) => toast.error(error.response?.data?.message || 'Erreur'),
      });
    }
  };

  const getFrequencyLabel = (med: Medication) => {
    const times = med.frequency.times.join(', ');
    if (med.frequency.type === 'DAILY') return `Chaque jour à ${times}`;
    if (med.frequency.type === 'WEEKLY') {
      const days = med.frequency.days?.map((d: string) => DAY_MAP[d] || d).join(', ');
      return `Chaque ${days} à ${times}`;
    }
    return `Toutes les ${times}`;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-10 max-md:flex-col max-md:items-start max-md:gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Médicaments
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos traitements et ceux de votre famille en toute simplicité.
          </p>
        </div>
        <Button 
          onClick={handleAdd} 
          disabled={!selectedProfileId}
        >
          <PlusIcon className="mr-2 h-5 w-5" weight="bold" />
          Ajouter un médicament
        </Button>
      </div>

      <div className="bg-background/60 backdrop-blur-xl border border-border mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 p-6">
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-3 min-w-fit">
              <div className="p-2 bg-primary/10 rounded-xl">
                <UsersIcon className="size-5 text-primary" weight="bold" />
              </div>
              <span className="text-sm font-semibold text-foreground/70">
                Filtrer par membre
              </span>
            </div>
            <div className="flex-1 sm:max-w-xs">
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger className="w-full h-11 rounded-xl bg-background/80 border-border/60 hover:border-primary/30 transition-colors">
                  <SelectValue placeholder="Tout le monde" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <UsersIcon className="size-3.5 text-primary" weight="bold" />
                      </div>
                      <span className="text-sm">Tout le monde</span>
                    </div>
                  </SelectItem>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <MemberAvatar fullName={member.fullName} avatarUrl={member.avatarUrl} className="size-6" />
                        <span className="text-sm">{member.fullName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-3 min-w-fit">
              <div className="p-2 bg-primary/10 rounded-xl">
                <MagnifyingGlassIcon className="size-5 text-primary" weight="bold" />
              </div>
              <span className="text-sm font-semibold text-foreground/70">
                Rechercher
              </span>
            </div>
            <div className="flex-1 sm:max-w-md">
              <div className="relative">
                <Input
                  placeholder="Nom du médicament..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-xl bg-background/80 border-border/60 hover:border-primary/30 transition-colors pl-4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoadingMeds && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {['sk1', 'sk2', 'sk3'].map((id) => (
            <Skeleton key={id} className="h-64 w-full" />
          ))}
        </div>
      )}

      {!isLoadingMeds && filteredMedications.length === 0 && (
        <div className="flex flex-col items-center justify-center bg-white text-center border border-border">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MagnifyingGlassIcon />
              </EmptyMedia>
              <EmptyTitle>
                Aucun traitement trouvé{' '}
                {searchQuery ? `pour "${searchQuery}"` : `pour ${selectedMember?.fullName}`}.
              </EmptyTitle>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <Button onClick={handleAdd}>Ajouter un médicament</Button>
            </EmptyContent>
          </Empty>
        </div>
      )}

      {!isLoadingMeds && filteredMedications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedications.map((med) => (
            <div
              key={med.id}
              className={`group relative p-6 border transition-all duration-500 rounded-xl boder-border ${
                med.isActive
                  ? 'bg-white'
                  : 'bg-slate-50/50 grayscale-[0.5] opacity-80'
              }`}
            >
              <div className="flex justify-between items-start mb-6 gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <Badge
                      variant="outline"
                      className="rounded-full px-3 py-1 bg-slate-50 border-slate-200 text-[10px] font-bold uppercase tracking-wider mb-2"
                    >
                      {med.dosage}
                    </Badge>
                    <h3 className="text-xl font-bold leading-tight transition-colors truncate">
                      {med.name}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 whitespace-nowrap">
                    Actif
                  </span>
                  <Switch
                    checked={med.isActive}
                    onCheckedChange={() => handleToggle(med.id, med.isActive)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>

              {/* Informations */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-slate-600 font-medium">
                  <div className="bg-slate-100 p-2">
                    <ListIcon className="size-4" />
                  </div>
                  <span className="text-sm">{getFrequencyLabel(med)}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-medium">
                  <div className="bg-slate-100 p-2">
                    <ListIcon className="size-4 opacity-50" />
                  </div>
                  <span className="text-xs capitalize tracking-wider font-semibold">
                    Du {formatDate(med.startDate)}
                    {med.endDate && ` au ${formatDate(med.endDate)}`}
                  </span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => handleEdit(med)}>
                  <PencilIcon className="mr-2 h-4 w-4" weight="bold" />
                  Modifier
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleRemove(med.id)}>
                  <TrashIcon className="size-5" weight="bold" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MedicationDialog
        open={medicationDialogOpen}
        onOpenChange={setMedicationDialogOpen}
        medication={editingMedication}
        defaultProfileId={selectedProfileId === 'all' ? undefined : selectedProfileId}
      />
    </div>
  );
}
