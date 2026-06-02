import { useOutletContext } from 'react-router-dom';
import { ExceptionalSchedulesTab } from '@/features/myPharmacy/components/ExceptionalSchedulesTab';
import { useParams } from 'react-router-dom';
import type { MyPharmacyContext } from '../MyPharmacyLayout';

export default function CalendarSection() {
  const { id = '' } = useParams();
  const { pharmacy } = useOutletContext<MyPharmacyContext>();

  return (
    <div className="max-w-2xl">
      <ExceptionalSchedulesTab
        pharmacyId={id}
        schedules={pharmacy.exceptionalSchedules ?? []}
        pharmacyGuards={pharmacy.pharmacyGuards ?? []}
        openingHours={pharmacy.openingHours ?? []}
      />
    </div>
  );
}
