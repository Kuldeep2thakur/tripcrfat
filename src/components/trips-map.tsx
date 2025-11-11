'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Trip } from '@/lib/types';
import Link from 'next/link';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';

// Fix for default marker icon in react-leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  // Add custom styles for tooltips
  const style = document.createElement('style');
  style.textContent = `
    .leaflet-tooltip {
      background-color: rgba(0, 0, 0, 0.85) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      color: white !important;
      padding: 0 !important;
    }
    .leaflet-tooltip-top:before {
      border-top-color: rgba(0, 0, 0, 0.85) !important;
    }
    .leaflet-tooltip-bottom:before {
      border-bottom-color: rgba(0, 0, 0, 0.85) !important;
    }
    .leaflet-tooltip-left:before {
      border-left-color: rgba(0, 0, 0, 0.85) !important;
    }
    .leaflet-tooltip-right:before {
      border-right-color: rgba(0, 0, 0, 0.85) !important;
    }
  `;
  if (!document.querySelector('#leaflet-custom-tooltip-styles')) {
    style.id = 'leaflet-custom-tooltip-styles';
    document.head.appendChild(style);
  }
}

interface TripsMapProps {
  trips: Trip[];
}

function MapBounds({ trips }: { trips: Trip[] }) {
  const map = useMap();

  useEffect(() => {
    const tripsWithLocation = trips.filter(trip => trip.location?.coordinates);
    
    if (tripsWithLocation.length === 0) {
      map.setView([20, 0], 2);
      return;
    }

    if (tripsWithLocation.length === 1) {
      const trip = tripsWithLocation[0];
      map.setView([trip.location!.coordinates.lat, trip.location!.coordinates.lng], 10);
      return;
    }

    const bounds = L.latLngBounds(
      tripsWithLocation.map(trip => [
        trip.location!.coordinates.lat,
        trip.location!.coordinates.lng
      ])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [trips, map]);

  return null;
}

export function TripsMap({ trips }: TripsMapProps) {
  const [mounted, setMounted] = useState(false);
  
  // Generate a stable ID for this component instance
  const mapId = useMemo(() => `map-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('TripsMap received trips:', trips);
    trips.forEach((trip, index) => {
      console.log(`Trip ${index} - "${trip.title}":`, {
        id: trip.id,
        hasLocation: !!trip.location,
        hasCoordinates: !!trip.location?.coordinates,
        locationData: trip.location,
        lat: trip.location?.coordinates?.lat,
        lng: trip.location?.coordinates?.lng,
        name: trip.location?.name
      });
    });
  }, [trips]);

  if (!mounted) {
    return (
      <div className="h-[600px] w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  const tripsWithLocation = trips.filter(trip => {
    const hasLocation = trip.location?.coordinates;
    if (!hasLocation) {
      console.log(`Trip "${trip.title}" filtered out - no location:`, trip.location);
    }
    return hasLocation;
  });

  console.log(`Trips with valid locations: ${tripsWithLocation.length} out of ${trips.length}`);
  console.log('Trips to display on map:', tripsWithLocation);

  if (tripsWithLocation.length === 0) {
    return (
      <div className="h-[600px] w-full rounded-lg overflow-hidden bg-muted flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">No trips with locations to display</p>
        <p className="text-sm text-muted-foreground">Add locations to your trips to see them on the map</p>
      </div>
    );
  }

  return (
    <div id={mapId} className="h-[600px] w-full rounded-lg overflow-hidden border shadow-lg">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds trips={tripsWithLocation} />
        {tripsWithLocation.map((trip) => (
          <Marker
            key={trip.id}
            position={[trip.location!.coordinates.lat, trip.location!.coordinates.lng]}
            eventHandlers={{
              mouseover: (e) => {
                e.target.openTooltip();
              },
            }}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -20]} 
              opacity={1}
              permanent={false}
              sticky={true}
            >
              <div className="p-3 min-w-[200px]">
                <h3 className="font-semibold text-sm mb-2 text-white">{trip.title}</h3>
                {trip.location?.name && (
                  <p className="text-xs text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <span>📍</span>
                    <span>{trip.location.name}</span>
                  </p>
                )}
                {trip.startDate && trip.endDate && (
                  <p className="text-xs text-gray-300 flex items-center gap-1.5">
                    <span>📅</span>
                    <span>{trip.startDate} - {trip.endDate}</span>
                  </p>
                )}
                {trip.description && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{trip.description}</p>
                )}
              </div>
            </Tooltip>
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-base mb-1">{trip.title}</h3>
                {trip.location?.name && (
                  <p className="text-sm text-muted-foreground mb-2">{trip.location.name}</p>
                )}
                {trip.startDate && trip.endDate && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {trip.startDate} - {trip.endDate}
                  </p>
                )}
                {trip.description && (
                  <p className="text-sm mb-3 line-clamp-2">{trip.description}</p>
                )}
                <Button asChild size="sm" className="w-full">
                  <Link href={`/trips/${trip.id}`}>
                    View Trip
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
