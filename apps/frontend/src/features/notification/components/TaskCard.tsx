import { CheckIcon, XIcon, ClockIcon, PillIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMarkTaskTaken, useMarkTaskSkipped } from '../api/hooks';
import type { Task } from '../types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskCardProps {
  task: Task;
  medicationName: string;
  dosage: string;
}

export const TaskCard = ({ task, medicationName, dosage }: TaskCardProps) => {
  const { mutate: takeTask, isPending: isTaking } = useMarkTaskTaken();
  const { mutate: skipTask, isPending: isSkipping } = useMarkTaskSkipped();

  const handleTake = () => {
    takeTask(task.id, {
      onSuccess: () => toast.success('Prise confirmée !'),
      onError: () => toast.error('Erreur lors de la confirmation'),
    });
  };

  const handleSkip = () => {
    if (globalThis.confirm('Passer cette prise ?')) {
      skipTask(task.id, {
        onSuccess: () => toast.success('Prise passée'),
        onError: () => toast.error('Erreur'),
      });
    }
  };

  const scheduledTime = new Date(task.scheduledAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isCompleted = task.status === 'TAKEN' || task.status === 'SKIPPED';

  const statusStyles = {
    TAKEN: "bg-green-100 text-green-600",
    SKIPPED: "bg-muted text-muted-foreground",
    PENDING: "bg-primary/10 text-primary",
    MISSED: "bg-destructive/10 text-destructive",
  };

  const currentStatusStyle = statusStyles[task.status] || statusStyles.PENDING;

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 border-primary/5 py-0",
      task.status === 'TAKEN' && "bg-green-50/50 border-green-100",
      task.status === 'SKIPPED' && "bg-muted/50 border-muted opacity-70"
    )}>
      <CardContent className="p-0">
        <div className="p-4 flex items-center gap-4">
          <div className={cn(
            "size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ",
            currentStatusStyle
          )}>
            <PillIcon className="size-6" weight={task.status === 'TAKEN' ? "fill" : "bold"} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-lg truncate">{medicationName}</h4>
              <Badge variant="outline" className="rounded-full bg-background/50">
                {dosage}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <ClockIcon className="size-4" />
                <span>{scheduledTime}</span>
              </div>
              {task.status === 'TAKEN' && task.takenAt && (
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckIcon className="size-4" />
                  <span>Pris à {new Date(task.takenAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
               {task.status === 'SKIPPED' && (
                <div className="flex items-center gap-1 text-muted-foreground font-medium">
                  <XIcon className="size-4" />
                  <span>Passé</span>
                </div>
              )}
            </div>
          </div>

          {!isCompleted && (
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleSkip}
                disabled={isSkipping || isTaking}
              >
                <XIcon className="size-4" weight="bold" />
                <span>Passer</span>
              </Button>
              <Button 
                onClick={handleTake}
                disabled={isSkipping || isTaking}
              >
                <CheckIcon className="size-4" weight="bold" />
                <span>Prendre</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
