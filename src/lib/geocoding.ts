export async function searchLocation(query: string) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=1`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        name: data[0].display_name,
        coordinates: {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      };
    }
    return null;
  } catch (error) {
    console.error('Error searching location:', error);
    return null;
  }
}

export async function getLocationName(lat: number, lng: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.display_name || 'Unknown location';
  } catch (error) {
    console.error('Error getting location name:', error);
    return 'Unknown location';
  }
}