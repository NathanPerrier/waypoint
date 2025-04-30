import { displayDialog } from './dialog.js';

export async function getAddressFromCoordinates(lat, lng) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${window.app.MAPBOX_ACCESS_TOKEN}`;
  const response = await fetch(url);
  if (!response.ok) {
    displayDialog(window.app, window.app.router, 'Error', 'Failed to fetch address from coordinates', '/');
    throw new Error('Failed to fetch address from coordinates');
  }
  const data = await response.json();
  return data.features[0]?.place_name || 'Unknown location';
}

export async function getCoordinatesFromAddress(address) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${window.app.MAPBOX_ACCESS_TOKEN}`;
  const response = await fetch(url);
  if (!response.ok) {
    displayDialog(window.app, window.app.router, 'Error', 'Failed to fetch coordinates from address', '/');
    throw new Error('Failed to fetch coordinates from address');
  }
  const data = await response.json();
  console.log("Coordinates from address:", data);
  const [lng, lat] = data.features[0]?.geometry?.coordinates || [];
  return { lat: lat, lng: lng };
}

export async function getCoordinatesFromMapboxId(mapboxId, mapSessionToken) {
    const url =`https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${app.MAPBOX_ACCESS_TOKEN}&session_token=${mapSessionToken}`
    const response = await fetch(url);
    if (!response.ok) {
        window.app.dialog.alert('Failed to fetch coordinates from Mapbox ID');
        throw new Error('Failed to fetch coordinates from address');
    }
    const data = await response.json();
    return data; 
}