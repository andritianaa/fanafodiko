import { useState, useMemo } from 'react';
import { useHouseholdMembers } from '@/features/household/api/hooks';
import { useTasks } from '@/features/notification/api/hooks';
import { useMedications } from '@/features/medication/api/hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemberAvatar } from '@/features/household/components/MemberAvatar';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  UsersIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  WarningCircleIcon,
  CalendarBlankIcon,
  LightbulbIcon
} from '@phosphor-icons/react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { HouseholdMember } from '@/features/household/types';
import type { Task } from '@/features/notification/types';
import type { Medication } from '@/features/medication/types';


type TimeRange = 'today' | 'week' | 'month' | '6months';

interface HistoryItemProps {
  task: Task;
  medication?: Medication;
  member?: HouseholdMember;
}

const HistoryItem = ({ task, medication, member }: HistoryItemProps) => {
  const statusConfig = {
    TAKEN: {
      color: 'bg-emerald-50 text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
      label: 'Pris',
      icon: <CheckCircleIcon size={20} weight="fill" />,
    },
    SKIPPED: {
      color: 'bg-amber-50 text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
      label: 'Sauté',
      icon: <WarningCircleIcon size={20} weight="fill" />,
    },
    MISSED: {
      color: 'bg-rose-50 text-rose-600',
      badge: 'bg-rose-100 text-rose-700',
      label: 'Manqué',
      icon: <XCircleIcon size={20} weight="fill" />,
    },
    PENDING: {
      color: 'bg-slate-50 text-slate-400',
      badge: 'bg-slate-100 text-slate-500',
      label: 'Attente',
      icon: <ClockIcon size={20} />,
    },
  };

  const config =
    statusConfig[task.status] || statusConfig.PENDING;

  return (
    <div className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${config.color}`}>{config.icon}</div>
        <div>
          <p className="font-bold text-slate-900">{medication?.name || 'Inconnu'}</p>
          <p className="text-xs text-slate-500">
            {member?.fullName} •{' '}
            {format(new Date(task.scheduledAt), "d MMMM 'à' HH:mm", { locale: fr })}
          </p>
        </div>
      </div>
      <span
        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${config.badge}`}
      >
        {config.label}
      </span>
    </div>
  );
};


export default function DashboardPage() {
  const { data: members } = useHouseholdMembers();
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // Filter calculations
  const filterParams = useMemo(() => {
    const to = new Date().toISOString().split('T')[0];
    let from = to;

    if (timeRange === 'week') {
      from = subDays(new Date(), 7).toISOString().split('T')[0];
    } else if (timeRange === 'month') {
      from = subDays(new Date(), 30).toISOString().split('T')[0];
    } else if (timeRange === '6months') {
      from = subDays(new Date(), 180).toISOString().split('T')[0];
    }

    return { 
      profileId: selectedProfileId === 'all' ? undefined : selectedProfileId,
      from,
      to,
      date: timeRange === 'today' ? to : undefined
    };
  }, [selectedProfileId, timeRange]);

  const { data: allTasks, isLoading: isLoadingTasks } = useTasks({ 
    profileId: filterParams.profileId,
    from: timeRange === 'today' ? undefined : filterParams.from,
    to: timeRange === 'today' ? undefined : filterParams.to,
    date: timeRange === 'today' ? filterParams.date : undefined
  });

  const { data: medications } = useMedications(selectedProfileId === 'all' ? 'all' : selectedProfileId);
  

  const stats = useMemo(() => {
    if (!allTasks) return { total: 0, taken: 0, skipped: 0, missed: 0, adherence: 0 };
    
    const relevantTasks = allTasks.filter(t => t.status !== 'PENDING' || new Date(t.scheduledAt) < new Date());
    
    const total = relevantTasks.length;
    const taken = relevantTasks.filter(t => t.status === 'TAKEN').length;
    const skipped = relevantTasks.filter(t => t.status === 'SKIPPED').length;
    const missed = relevantTasks.filter(t => t.status === 'MISSED').length;
    
    return {
      total,
      taken,
      skipped,
      missed,
      adherence: total > 0 ? Math.round((taken / total) * 100) : 0
    };
  }, [allTasks]);

  const sortedHistory = useMemo(() => {
    if (!allTasks) return [];
    return [...allTasks].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [allTasks]);

  const activeTreatmentsCount = medications?.filter(m => m.isActive).length || 0;

  return (
    <div className="p-0 max-w-7xl mx-auto space-y-8">
      
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Votre santé, en un coup d'œil
        </h1>
        <p className="text-lg text-slate-500">
          Suivez vos traitements et ceux de votre foyer simplement.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
             <UsersIcon size={20} weight="bold" />
             <span className="text-sm">Membre :</span>
          </div>
          <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
            <SelectTrigger className="w-full md:w-[180px]  border-slate-200 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout le foyer</SelectItem>
              {members?.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          <div className="flex items-center gap-2 text-slate-600 font-medium ml-0 md:ml-4">
             <CalendarBlankIcon size={20} weight="bold" />
             <span className="text-sm">Période :</span>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-full md:w-[180px] rounded-xl border-slate-200 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
              <SelectItem value="6months">6 derniers mois</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
               
                <h2 className="text-2xl font-bold text-slate-900">Adhérence</h2>
              </div>
              <span className="text-4xl font-black text-blue-600">{stats.adherence}%</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-slate-600">
                <span>Objectif 100%</span>
                <span>{stats.total} prises au total</span>
              </div>
              <Progress value={stats.adherence} className="h-3 rounded-full bg-slate-100" />
              <p className="text-sm text-slate-500 italic">
                {stats.adherence >= 80 ? "Excellent travail ! Continuez ainsi." : "Presque ! Un petit effort pour plus de régularité."}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 border-t border-slate-100 pt-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-emerald-600">{stats.taken}</p>
                <p className="text-xs font-semibold text-slate-400">PRISES</p>
              </div>
              <div className="text-center border-x border-slate-100">
                <p className="text-2xl font-semibold text-amber-500">{stats.skipped}</p>
                <p className="text-xs font-semibold text-slate-400">SAUTÉES</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-rose-500">{stats.missed}</p>
                <p className="text-xs font-semibold text-slate-400">OUBLIS</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-rose-500">{activeTreatmentsCount}</p>
                <p className="text-xs font-semibold text-slate-400">TRAITEMENTS</p>
              </div>
            </div>
          </div>

          {/* History Feed */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Activité récente
            </h3>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden divide-y divide-slate-100">
              {isLoadingTasks && (
                ['sk1', 'sk2', 'sk3'].map((id) => (
                  <div key={id} className="p-6">
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))
              )}

              {!isLoadingTasks && sortedHistory.length === 0 && (
                <div className="p-12 text-center text-slate-500 font-medium">
                  Aucune activité enregistrée.
                </div>
              )}

              {!isLoadingTasks && sortedHistory.length > 0 && (
                sortedHistory.slice(0, 10).map((task) => (
                  <HistoryItem
                    key={task.id}
                    task={task}
                    medication={medications?.find((m) => m.id === task.medicationId)}
                    member={members?.find((m) => m.id === task.profileId)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Active Members & Quick Context */}
        <div className="space-y-4">
           <Card className="bg-blue-50/50 border-blue-100 ">
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <LightbulbIcon size={20} weight="fill" className="text-blue-500" />
                <h4>Conseil Santé</h4>
              </div>
              <p className="text-sm text-blue-800/80 leading-relaxed font-medium">
                La régularité est la clé de l'efficacité de vos traitements. 
                N'oubliez pas d'activer les notifications sur mobile pour ne rien manquer.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Membres 
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {members?.map(m => {
                  const activeMeds = medications?.filter(med => med.profileId === m.id && med.isActive).length || 0;
                  return (
                    <div key={m.id} className="flex items-center gap-4 bg-slate-50 p-3 transition-colors border border-border ">
                      <MemberAvatar fullName={m.fullName} avatarUrl={m.avatarUrl} className="size-10 border-2 border-white shadow-sm" />
                      <div>
                        <p>{m.fullName}</p>
                        <p className="text-muted-foreground">{activeMeds} traitement{activeMeds > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link to={'/household'}>
              <Button variant={"outline"} className="w-full">
                Gérer le foyer
              </Button></Link>
            </CardContent>
          </Card>

         
        </div>

      </div>
    </div>
  );
}
