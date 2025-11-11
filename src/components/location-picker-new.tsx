'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from './ui/button';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import 'leaflet/dist/leaflet.css';

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);

interface LocationPickerProps {
  onLocationSelect: (location: { name: string; coordinates: { lat: number; lng: number } }) => void;
  defaultLocation?: { name: string; coordinates: { lat: number; lng: number } };
}

// Icon configuration for the marker
const icon = {
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
};

function MapEvents({ onLocationSelect }: { onLocationSelect: (latlng: { lat: number; lng: number }) => void }) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

export function LocationPicker({ onLocationSelect, defaultLocation }: LocationPickerProps) {
  const [searchInput, setSearchInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation);
  const [mapCenter, setMapCenter] = useState(defaultLocation?.coordinates || { lat: 20, lng: 0 });
  const [markerPosition, setMarkerPosition] = useState(defaultLocation?.coordinates);

  const handleMapClick = async (latlng: { lat: number; lng: number }) => {
    try {
      // Use Nominatim for reverse geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
      );
      const data = await response.json();
      const placeName = data.display_name || 'Unknown location';
      
      const newLocation = {
        name: placeName,
        coordinates: {
          lat: latlng.lat,
          lng: latlng.lng
        }
      };
      
      setSelectedLocation(newLocation);
      setMarkerPosition(newLocation.coordinates);
      onLocationSelect(newLocation);
    } catch (error) {
      console.error('Error getting location name:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    try {
      // Use Nominatim for geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput)}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon: lng, display_name } = data[0];
        const coordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };
        
        const newLocation = {
          name: display_name,
          coordinates
        };
        
        setSelectedLocation(newLocation);
        setMapCenter(coordinates);
        setMarkerPosition(coordinates);
        onLocationSelect(newLocation);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  // Don't render the map on the server
  if (typeof window === 'undefined') {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" type="button" className="w-full">
            {selectedLocation ? selectedLocation.name : 'Select Location'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pick a Location</DialogTitle>
          </DialogHeader>
          <div className="h-[400px] w-full rounded-lg bg-muted" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" type="button" className="w-full">
          {selectedLocation ? selectedLocation.name : 'Select Location'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pick a Location</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for a location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} type="button">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-[400px] w-full rounded-lg overflow-hidden">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={defaultLocation ? 13 : 2}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapEvents onLocationSelect={handleMapClick} />
              {markerPosition && (
                <Marker 
                  position={[markerPosition.lat, markerPosition.lng]} 
                  icon={icon}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}