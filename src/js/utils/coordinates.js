/**
 * Fetches a address from Mapbox Geocoding API based on the provided latitude and longitude.
 * 
 * @async
 * 
 * @param {number} lat - The latitude of the location.
 * @param {number} lng - The longitude of the location.
 * 
 * @return {Promise<string>} - A promise that resolves to the address of the location.
 * @throws {Error} - If the fetch request fails or if the address cannot be found.
 * 
 */
export async function getAddressFromCoordinates(lat, lng) {
  // create url for Mapbox Geocoding API request
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${window.app.MAPBOX_ACCESS_TOKEN}`;

  // Fetch the address from Mapbox Geocoding API
  const response = await fetch(url);

  // Check if the response is ok, if not throw an error
  if (!response.ok) {
    throw new Error('Failed to fetch address from coordinates');
  }

  // Parse the response data
  const data = await response.json();

  // return the first feature's place name (address) or 'Unknown location' if not found
  return data.features[0]?.place_name || 'Unknown location';
}

/**
 * Fetches coordinates from Mapbox Geocoding API based on the provided address.
 * 
 * @async
 * 
 * @param {string} address - The address to geocode.
 * 
 * @return {Promise<Object>} - A promise that resolves to an object containing latitude and longitude.
 * @throws {Error} - If the fetch request fails or if the coordinates cannot be found.
 * 
 */
export async function getCoordinatesFromAddress(address) {
  // create url for Mapbox Geocoding API request
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${window.app.MAPBOX_ACCESS_TOKEN}`;

  // Fetch the coordinates from Mapbox Geocoding API
  const response = await fetch(url);

  // Check if the response is ok, if not throw an error
  if (!response.ok) {
    throw new Error('Failed to fetch coordinates from address');
  }

  // Parse the response data
  const data = await response.json();

  // return lat and lng
  const [lng, lat] = data.features[0]?.geometry?.coordinates || [];
  return { lat: lat, lng: lng };
}

/**
 * Fetches coordinates from Mapbox Searchbox API based on the provided Mapbox ID.
 * 
 * @async
 * 
 * @param {string} mapboxId - The Mapbox ID of the location.
 * @param {string} mapSessionToken - The session token for the Mapbox Searchbox API.
 * 
 * @return {Promise<Object>} - A promise that resolves to an object containing latitude and longitude.
 * @throws {Error} - If the fetch request fails or if the coordinates cannot be found.
 * 
 */
export async function getCoordinatesFromMapboxId(mapboxId, mapSessionToken) {
  // create url for Mapbox Searchbox API request
  const url =`https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${app.MAPBOX_ACCESS_TOKEN}&session_token=${mapSessionToken}`

  // Fetch the coordinates from Mapbox Searchbox API
  const response = await fetch(url);

  // Check if the response is ok, if not throw an error
  if (!response.ok) {
      window.app.dialog.alert('Failed to fetch coordinates from Mapbox ID', 'Error');
      throw new Error('Failed to fetch coordinates from address');
  }

  // Parse and return the response data
  const data = await response.json();
  return data; 
}