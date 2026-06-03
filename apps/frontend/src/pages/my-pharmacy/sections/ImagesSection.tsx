import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useUpdatePharmacyImages } from '@/features/myPharmacy/api/hooks';
import { Button } from '@/components/ui/button';
import { PharmacyImagesEditor } from '@/features/backoffice/pharmacies/PharmacyImagesEditor';
import { toast } from 'sonner';
import type { MyPharmacyContext } from '../MyPharmacyLayout';

export default function ImagesSection() {
  const { id = '' } = useParams();
  const { pharmacy } = useOutletContext<MyPharmacyContext>();
  const { mutate, isPending } = useUpdatePharmacyImages(id);
  const [images, setImages] = useState<string[]>(pharmacy.images ?? []);

  useEffect(() => {
    setImages(pharmacy.images ?? []);
  }, [pharmacy.images]);

  const save = () => {
    mutate(images, {
      onSuccess: () => toast.success('Images mises à jour'),
      onError: () => toast.error('Erreur'),
    });
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <PharmacyImagesEditor value={images} onChange={setImages} />
      <Button onClick={save} loading={isPending} className="w-full">
        Enregistrer les images
      </Button>
    </div>
  );
}
