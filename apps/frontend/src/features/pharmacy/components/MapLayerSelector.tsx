import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Options de fond de carte ──────────────────────────────────────────────────

export interface LayerOption {
  id: string;
  name: string;
  url: string;
  attribution: string;
  preview: string;
}

export const MAP_LAYERS: LayerOption[] = [
  {
    id: 'osm',
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    preview: '/standard-layer.png',
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    preview: '/satelite-layer.png',
  },
];

// ─── Composant ────────────────────────────────────────────────────────────────

interface Props {
  currentLayerId: string;
  onLayerChange: (layer: LayerOption) => void;
  className?: string;
}

export function MapLayerSelector({ currentLayerId, onLayerChange, className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      {/* Options, s'affichent au-dessus du bouton */}
      {open && (
        <div className="absolute top-full mb-2 right-0 flex gap-2 z-10">
          {MAP_LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              title={layer.name}
              onClick={() => {
                onLayerChange(layer);
                setOpen(false);
              }}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl p-1.5 bg-background/95 backdrop-blur-sm border shadow-lg transition-all hover:scale-105 active:scale-95',
                currentLayerId === layer.id && 'ring-2 ring-primary border-primary'
              )}
            >
              {/* Aperçu du fond de carte */}
              <div className="w-28 aspect-square rounded-lg border overflow-hidden">
                <img
                  src={layer.preview}
                  alt={layer.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
              <span className="text-[11px] font-semibold text-foreground">
                {layer.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Bouton principal */}
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="shadow-md backdrop-blur-sm bg-background/90 hover:bg-background"
        onClick={() => setOpen((v) => !v)}
        title="Changer le fond de carte"
      >
        <MapIcon className="w-4 h-4" />
        <span className="sr-only">Changer le fond de carte</span>
      </Button>
    </div>
  );
}
