import { useState, useEffect, useCallback } from "react";
import { CircleMarker, useMap } from "react-leaflet";

interface Props {
  onLocationUpdate?: (pos: [number, number]) => void;
  autoCenter?: boolean;
}

export function UserLocationMarker({
  onLocationUpdate,
  autoCenter = false,
}: Props) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [centered, setCentered] = useState(false);
  const map = useMap();

  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      const latlng: [number, number] = [
        pos.coords.latitude,
        pos.coords.longitude,
      ];
      setAccuracy(pos.coords.accuracy);
      onLocationUpdate?.(latlng);

      if (autoCenter && !centered) {
        // 1. Sauter instantanément sur la position (aucune animation, tiles chargés avant le marqueur)
        map.setView(latlng, Math.max(map.getZoom(), 14), { animate: false });
        setCentered(true);

        // 2. Afficher le marqueur ~150 ms après : les tiles auront commencé à rendre,
        //    l'effet "zoom violet sur fond blanc" disparaît.
        setTimeout(() => setPosition(latlng), 150);
      } else {
        // Mises à jour GPS suivantes : déplacer le point immédiatement
        setPosition(latlng);
      }
    },
    [map, autoCenter, centered, onLocationUpdate],
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [handlePosition]);

  if (!position) return null;

  return (
    <>
      {/* Cercle de précision GPS */}
      {accuracy > 0 && (
        <CircleMarker
          center={position}
          radius={Math.min(accuracy / 3, 40)}
          pathOptions={{
            color: "#4f46e5",
            fillColor: "#4f46e5",
            fillOpacity: 0.08,
            weight: 0,
          }}
          interactive={false}
        />
      )}

      {/* Halo semi-transparent */}
      <CircleMarker
        center={position}
        radius={14}
        pathOptions={{
          color: "transparent",
          fillColor: "#4f46e5",
          fillOpacity: 0.18,
          weight: 0,
        }}
        interactive={false}
      />

      {/* Point bleu solide */}
      <CircleMarker
        center={position}
        radius={7}
        pathOptions={{
          color: "white",
          fillColor: "#4f46e5",
          fillOpacity: 1,
          weight: 2.5,
        }}
      />
    </>
  );
}
