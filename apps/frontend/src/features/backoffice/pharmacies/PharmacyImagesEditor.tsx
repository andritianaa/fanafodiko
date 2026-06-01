import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { uploadImage } from '@/features/pharmacy/api/upload';
import { ImageIcon, TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface Props {
  value: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

export function PharmacyImagesEditor({ value, onChange, max = 8 }: Props) {
  const images = value ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = max - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) {
      toast.error(`Maximum ${max} images`);
      return;
    }

    setUploading(true);
    try {
      const results = await Promise.all(toUpload.map((f) => uploadImage(f)));
      onChange([...images, ...results.map((r) => r.url)]);
      toast.success(`${results.length} image(s) ajoutée(s)`);
    } catch {
      toast.error("Échec de l'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => onChange(images.filter((i) => i !== url));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {images.map((url) => (
          <div
            key={url}
            className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <TrashIcon size={12} />
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {uploading ? (
              <Spinner className="size-5" />
            ) : (
              <>
                <UploadSimpleIcon size={20} />
                <span className="text-xs">Ajouter</span>
              </>
            )}
          </button>
        )}
      </div>

      {images.length === 0 && !uploading && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ImageIcon size={14} /> Aucune image. Formats : JPG, PNG, WebP (5 MB max).
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
