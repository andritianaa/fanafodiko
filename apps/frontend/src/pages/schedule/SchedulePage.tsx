import { useState, useEffect } from 'react';
import { useHouseholdMembers } from '@/features/household/api/hooks';
import { useTasks, useDailyProgress } from '@/features/notification/api/hooks';
import { useMedications } from '@/features/medication/api/hooks';
import { TaskCard } from '@/features/notification/components/TaskCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PillIcon, ClockIcon, UsersIcon } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'react-router-dom';

export default function SchedulePage() {
  const { data: members } = useHouseholdMembers();
  const location = useLocation();
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');
  
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
    <div className="container mx-auto p-6 max-w-4xl">
      
      <div className="bg-background/60 backdrop-blur-xl border border-border mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-6">
          <div className="flex items-center gap-3 min-w-fit">
            <div className="p-2 bg-primary/10 rounded-xl">
              <UsersIcon className="size-5 text-primary" weight="bold" />
            </div>
            <span className="text-sm font-semibold text-foreground/70">
              Filtrer par membre
            </span>
          </div>
          <div className="flex-1 sm:max-w-sm">
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
                    <span>Tout le monde</span>
                  </div>
                </SelectItem>
                {members?.map((member) => {
                  const initials = `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
                  return (
                    <SelectItem key={member.id} value={member.id} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />}
                          <AvatarFallback className="text-xs font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.firstName} {member.lastName}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {progress && (
          <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 transition-all">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="font-bold text-lg">
                  {selectedProfileId === 'all' ? 'Progression globale' : `Progression de ${members?.find(m => m.id === selectedProfileId)?.firstName}`}
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
            <div className="text-center py-12 bg-muted/10 rounded-3xl border border-dashed">
              <PillIcon className="size-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune prise prévue pour aujourd'hui.</p>
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
                      ? `${medication?.name || '...'} (${member?.firstName || '...'})` 
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
