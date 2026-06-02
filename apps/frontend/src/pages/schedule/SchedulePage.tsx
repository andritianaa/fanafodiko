import { useState, useEffect } from 'react';
import { useHouseholdMembers } from '@/features/household/api/hooks';
import { useTasks, useDailyProgress } from '@/features/notification/api/hooks';
import { useMedications } from '@/features/medication/api/hooks';
import { TaskCard } from '@/features/notification/components/TaskCard';
import { HouseholdMemberDialog } from '@/features/household/components/HouseholdMemberDialog';
import { MemberAvatar } from '@/features/household/components/MemberAvatar';
import { MedicationDialog } from '@/features/medication/components/MedicationDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { PillIcon, ClockIcon, UsersIcon, PlusIcon, ArrowRightIcon } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useLocation } from 'react-router-dom';


export default function SchedulePage() {
  const { data: members } = useHouseholdMembers();
  const location = useLocation();
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMedicationOpen, setAddMedicationOpen] = useState(false);
  
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && members?.some(m => m.id === hash)) {
      setSelectedProfileId(hash);
    }
  }, [location.hash, members]);

  const { data: tasks, isLoading: isLoadingTasks } = useTasks({ 
    profileId: selectedProfileId === 'all' ? undefined : selectedProfileId 
  });
  
  const { data: progress } = useDailyProgress({ 
    profileId: selectedProfileId === 'all' ? undefined : selectedProfileId 
  });
  
  const { data: medications } = useMedications(selectedProfileId === 'all' ? 'all' : selectedProfileId);

  return (
    <div className="container mx-auto max-w-4xl">
      
      {/* ── Filtrer par membre + liens rapides ────────────────────────────── */}
      <div className="bg-background/60 backdrop-blur-xl border border-border mb-8 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
          <div className="flex items-center gap-3 min-w-fit">
            <div className="p-2 bg-primary/10 rounded-xl">
              <UsersIcon className="size-5 text-primary" weight="bold" />
            </div>
            <span className="text-sm font-semibold text-foreground/70">
              Filtrer par membre
            </span>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
              <SelectTrigger className="flex-1 h-10 rounded-xl bg-background/80 border-border/60 hover:border-primary/30 transition-colors">
                <SelectValue placeholder="Tout le monde" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <UsersIcon className="size-3.5 text-primary" weight="bold" />
                    </div>
                    <span>Tout le monde</span>
                  </div>
                </SelectItem>
                {members?.map((member) => (
                  <SelectItem key={member.id} value={member.id} className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <MemberAvatar fullName={member.fullName} avatarUrl={member.avatarUrl} className="size-6" />
                      <span>{member.fullName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Bouton ajouter un membre */}
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-10 w-10 shrink-0 rounded-xl"
              title="Ajouter un membre du foyer"
              onClick={() => setAddMemberOpen(true)}
            >
              <PlusIcon size={16} />
            </Button>
          </div>
        </div>

        {/* Liens rapides vers Foyer et Médicaments */}
        <div className="border-t flex divide-x">
          <Link
            to="/household"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <UsersIcon size={13} />
            Gérer le foyer
            <ArrowRightIcon size={11} />
          </Link>
          <Link
            to="/medications"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <PillIcon size={13} />
            Gérer les médicaments
            <ArrowRightIcon size={11} />
          </Link>
        </div>
      </div>

      {/* Dialogs */}
      <HouseholdMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} />
      <MedicationDialog
        open={addMedicationOpen}
        onOpenChange={setAddMedicationOpen}
        defaultProfileId={selectedProfileId === 'all' ? undefined : selectedProfileId}
      />

      <div className="space-y-8">
        {progress && (
          <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 transition-all">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="font-bold text-lg">
                  {selectedProfileId === 'all' ? 'Progression globale' : `Progression de ${members?.find(m => m.id === selectedProfileId)?.fullName}`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {progress.takenCount} sur {progress.totalTasks} prises effectuées
                </p>
              </div>
              <span className="text-3xl font-black text-primary">
                {Math.round(progress.adherenceRate)}%
              </span>
            </div>
            <Progress value={progress.adherenceRate} className="h-3 rounded-full" />
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClockIcon className="size-6 text-primary" />
            Prises du jour
          </h2>
          
          {isLoadingTasks && (
            <div className="space-y-3">
              {['sk1', 'sk2', 'sk3'].map((id) => (
                <Skeleton key={id} className="h-24 w-full" />
              ))}
            </div>
          )}

          {!isLoadingTasks && tasks?.length === 0 && (
            <div className="text-center py-12 bg-muted/10 rounded-3xl border border-dashed space-y-3">
              <PillIcon className="size-12 text-muted-foreground/20 mx-auto" />
              <p className="text-muted-foreground text-sm">Aucune prise prévue pour aujourd'hui.</p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setAddMedicationOpen(true)}
              >
                <PlusIcon size={13} />
                Nouveau traitement
              </Button>
            </div>
          )}

          {!isLoadingTasks && tasks && tasks.length > 0 && (
            <div className="grid gap-4">
              {tasks.map((task) => {
                const medication = medications?.find(m => m.id === task.medicationId);
                const member = members?.find(m => m.id === task.profileId);
                return (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    medicationName={selectedProfileId === 'all' 
                      ? `${medication?.name || '...'} (${member?.fullName || '...'})`
                      : (medication?.name || 'Médicament inconnu')
                    }
                    dosage={medication?.dosage || '-'}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
