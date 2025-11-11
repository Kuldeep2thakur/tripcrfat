'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Search, MapPin } from 'lucide-react';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { MapPicker } from './map-picker';
import { ClientOnly } from './client-only';

interface LocationPickerProps {
  onLocationSelected?: (location: { name: string; coordinates: { lat: number; lng: number } }) => void;
  onLocationSelect?: (location: { name: string; coordinates: { lat: number; lng: number } }) => void;
  defaultLocation?: { name: string; coordinates: { lat: number; lng: number } };
}

export function LocationPicker({ onLocationSelected, onLocationSelect, defaultLocation }: LocationPickerProps) {
  const [searchInput, setSearchInput] = useState('');
  const [open, setOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultName, setSearchResultName] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number]>(
    defaultLocation ? [defaultLocation.coordinates.lat, defaultLocation.coordinates.lng] : [51.505, -0.09]
  ); // Default to London

  useEffect(() => {
    if (open) setOpenCount((c) => c + 1);
  }, [open]);

  // Update selectedLocation when defaultLocation changes
  useEffect(() => {
    if (defaultLocation) {
      setSelectedLocation([defaultLocation.coordinates.lat, defaultLocation.coordinates.lng]);
    }
  }, [defaultLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput) return;

    setIsSearching(true);
    setSearchResultName('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchInput
        )}`
      );
      const data = await response.json();

      if (data && data[0]) {
        const { lat, lon: lng, display_name } = data[0];
        setSelectedLocation([parseFloat(lat), parseFloat(lng)]);
        setSearchResultName(display_name);
      } else {
        setSearchResultName('No results found');
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      setSearchResultName('Error searching location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (latlng: [number, number]) => {
    setSelectedLocation(latlng);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchResultName('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setSearchResultName('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('Live location received:', { latitude, longitude, accuracy });
        
        const newLocation: [number, number] = [latitude, longitude];
        setSelectedLocation(newLocation);
        
        // Force map to re-center by incrementing the instance key
        setOpenCount((c) => c + 1);
        
        // Get the location name using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          console.log('Reverse geocoding result:', data);
          setSearchResultName(`Current location: ${data.display_name || 'Unknown'} (±${Math.round(accuracy)}m)`);
        } catch (error) {
          console.error('Error getting location name:', error);
          setSearchResultName(`Current location set (±${Math.round(accuracy)}m)`);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Try again.';
            break;
        }
        
        setSearchResultName(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleConfirm = async () => {
    try {
      console.log('Confirming location with coordinates:', selectedLocation);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLocation[0]}&lon=${selectedLocation[1]}`
      );
      const data = await response.json();

      const payload = {
        name: data.display_name || 'Selected Location',
        coordinates: {
          lat: selectedLocation[0],
          lng: selectedLocation[1],
        },
      };
      console.log('Location payload being sent:', payload);
      if (onLocationSelected) onLocationSelected(payload);
      if (onLocationSelect) onLocationSelect(payload);
      setOpen(false);
    } catch (error) {
      console.error('Error getting location details:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Search className="mr-2 h-4 w-4" />
          Pick Location
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pick a Location</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search for a location..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          <Button 
            type="button" 
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as any);
            }}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
        <div className="mb-4">
          <Button 
            type="button" 
            variant="secondary"
            onClick={handleUseMyLocation}
            disabled={isGettingLocation}
            className="w-full"
          >
            <MapPin className="mr-2 h-4 w-4" />
            {isGettingLocation ? 'Getting your location...' : 'Use My Current Location'}
          </Button>
        </div>
        {searchResultName && (
          <p className="text-sm mb-2 text-green-600">
            Found: {searchResultName}
          </p>
        )}
        {defaultLocation && (
          <p className="text-sm text-muted-foreground mb-2">
            Current: {defaultLocation.name}
          </p>
        )}
        <p className="text-xs text-muted-foreground mb-2">
          Selected coordinates: {selectedLocation[0].toFixed(4)}, {selectedLocation[1].toFixed(4)}
        </p>
        {open && (
          <ClientOnly>
            <div className="h-[400px] w-full">
              <MapPicker instanceKey={openCount} center={selectedLocation} onLocationSelected={handleLocationSelect} />
            </div>
          </ClientOnly>
        )}
        <Button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleConfirm();
          }} 
          className="mt-4"
        >
          Confirm Location
        </Button>
      </DialogContent>
    </Dialog>
  );
}