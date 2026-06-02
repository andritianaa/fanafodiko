import { useOutletContext, useParams } from 'react-router-dom';
import { ExceptionalSchedulesTab } from '@/features/myPharmacy/components/ExceptionalSchedulesTab';
import type { BackofficePharmacyContext } from '../BackofficePharmacyLayout';

export default function CalendarSection() {
  const { id = '' } = useParams();
  const { pharmacy } = useOutletContext<BackofficePharmacyContext>();

  return (
    <div className="max-w-2xl">
      <ExceptionalSchedulesTab
        pharmacyId={id}
        schedules={pharmacy.exceptionalSchedules ?? []}
        pharmacyGuards={pharmacy.pharmacyGuards ?? []}
        openingHours={pharmacy.openingHours ?? []}
        pharmacySource="backoffice"
      />
    </div>
  );
}
