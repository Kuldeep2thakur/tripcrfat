'use client';

import { useEffect, useRef, useState } from 'react';
import { ClientOnly } from './client-only';

interface MapPickerProps {
  center: [number, number];
  onLocationSelected: (latlng: [number, number]) => void;
  isReadOnly?: boolean;
  instanceKey?: string | number;
}

export function MapPicker({
  center,
  onLocationSelected,
  isReadOnly = false,
  instanceKey,
}: MapPickerProps) {
  const [mapKey] = useState(() => {
    if (instanceKey !== undefined) return `leaflet-map-${instanceKey}`;
    if (typeof window !== 'undefined') {
      (window as any).__leafletMapCounter = ((window as any).__leafletMapCounter || 0) + 1;
      return `leaflet-map-${(window as any).__leafletMapCounter}`;
    }
    return 'leaflet-map-0';
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const centerRef = useRef(center);

  // Update centerRef when center prop changes
  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  useEffect(() => {
    let Lmod: any;
    let mapInstance: any;
    let markerInstance: any;

    const init = async () => {
      if (!containerRef.current) return;
      const L = (await import('leaflet')).default;
      Lmod = L;
      // Fix Leaflet default icon path
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });

      // Create map using the current center from ref
      mapInstance = L.map(containerRef.current!, {
        scrollWheelZoom: !isReadOnly,
      }).setView(centerRef.current, 13);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstance);

      // Add marker using the current center from ref
      markerInstance = L.marker(centerRef.current).addTo(mapInstance);

      // Click handler
      if (!isReadOnly) {
        mapInstance.on('click', (e: any) => {
          const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
          markerInstance.setLatLng(latlng);
          onLocationSelected(latlng);
        });
      }

      mapRef.current = mapInstance;
      markerRef.current = markerInstance;
    };

    init();
    return () => {
      try {
        mapRef.current?.off();
        mapRef.current?.remove();
      } catch {}
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapKey]);

  // Update map center/marker when center prop changes
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView(center, 13);
      markerRef.current.setLatLng(center);
    }
  }, [center]);

  return (
    <ClientOnly>
      <div key={mapKey} className="relative w-full h-full">
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
          crossOrigin=""
        />
        <div
          id={`leaflet-container-${mapKey}`}
          ref={containerRef}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        />
      </div>
    </ClientOnly>
  );
}
