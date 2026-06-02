import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useUpdatePharmacyInfo } from '@/features/myPharmacy/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationPickerMap } from '@/features/pharmacy/components/LocationPickerMap';
import { ContactsEditor } from '@/features/backoffice/pharmacies/ContactsEditor';
import { toast } from 'sonner';
import type { PharmacyContact } from '@ext/schemas';
import type { MyPharmacyContext } from '../MyPharmacyLayout';

export default function InfoSection() {
  const { id = '' } = useParams();
  const { pharmacy } = useOutletContext<MyPharmacyContext>();
  const { mutate, isPending } = useUpdatePharmacyInfo(id);

  const [form, setForm] = useState({
    name: pharmacy.name,
    address: pharmacy.address,
    landmark: pharmacy.landmark ?? '',
    city: pharmacy.city,
    region: pharmacy.region ?? '',
    coordinates: pharmacy.coordinates,
    contacts: (pharmacy.contacts ?? []) as PharmacyContact[],
  });

  const save = () => {
    mutate(form, {
      onSuccess: () => toast.success('Infos mises à jour'),
      onError: () => toast.error('Erreur'),
    });
  };

  return (
    <div className="space-y-3 max-w-2xl">
      <div>
        <Label>Nom</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <Label>Adresse</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div>
        <Label>Repère visuel</Label>
        <Input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Ville</Label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <Label>Région</Label>
          <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Localisation</Label>
        <LocationPickerMap
          value={form.coordinates}
          onChange={(coordinates) => setForm({ ...form, coordinates })}
        />
      </div>
      <div>
        <Label className="mb-2 block">Contacts</Label>
        <ContactsEditor
          value={form.contacts}
          onChange={(contacts) => setForm({ ...form, contacts })}
        />
      </div>
      <Button onClick={save} disabled={isPending} className="w-full">
        {isPending ? 'Enregistrement…' : 'Enregistrer les infos'}
      </Button>
    </div>
  );
}
