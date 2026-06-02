import { useOutletContext, useParams } from 'react-router-dom';
import { MembersTab } from '@/features/myPharmacy/components/MembersTab';
import type { MyPharmacyContext } from '../MyPharmacyLayout';

export default function MembersSection() {
  const { id = '' } = useParams();
  const { myRole } = useOutletContext<MyPharmacyContext>();

  return (
    <div className="max-w-2xl">
      <MembersTab pharmacyId={id} myRole={myRole} />
    </div>
  );
}
