import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useUpdatePharmacyHours } from '@/features/myPharmacy/api/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { OpeningHoursEditor } from '@/features/backoffice/pharmacies/OpeningHoursEditor';
import { toast } from 'sonner';
import type { OpeningHour } from '@ext/schemas';
import type { MyPharmacyContext } from '../MyPharmacyLayout';

function defaultOpeningHours(): OpeningHour[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: '08:00',
    close: '17:00',
    isClosed: day === 0,
  }));
}

export default function HoursSection() {
  const { id = '' } = useParams();
  const { pharmacy } = useOutletContext<MyPharmacyContext>();
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
    <div className="space-y-4 max-w-2xl">
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
