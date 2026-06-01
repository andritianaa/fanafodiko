import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import type { OpeningHour } from '@ext/schemas';

const DAYS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

interface Props {
  value: OpeningHour[];
  onChange: (hours: OpeningHour[]) => void;
}

function defaultHours(): OpeningHour[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: '08:00',
    close: '17:00',
    isClosed: day === 0, // Dimanche fermé par défaut
  }));
}

export function OpeningHoursEditor({ value, onChange }: Props) {
  const hours: OpeningHour[] =
    value && value.length === 7 ? value : defaultHours();

  const update = (day: number, changes: Partial<OpeningHour>) => {
    const next = hours.map((h) =>
      h.day === day ? { ...h, ...changes } : h
    );
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {hours.map((h) => (
        <div key={h.day} className="flex items-center gap-3">
          <span className="w-24 text-sm text-muted-foreground shrink-0">
            {DAYS[h.day]}
          </span>
          <Switch
            checked={!h.isClosed}
            onCheckedChange={(open) => update(h.day, { isClosed: !open })}
            className="shrink-0"
          />
          {!h.isClosed ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="time"
                value={h.open ?? '08:00'}
                onChange={(e) => update(h.day, { open: e.target.value })}
                className="h-8 text-sm w-28"
              />
              <span className="text-muted-foreground text-xs">–</span>
              <Input
                type="time"
                value={h.close ?? '17:00'}
                onChange={(e) => update(h.day, { close: e.target.value })}
                className="h-8 text-sm w-28"
              />
            </div>
          ) : (
            <span className="text-sm text-red-400 italic">Fermé</span>
          )}
        </div>
      ))}
    </div>
  );
}
