import { SearchBoxCore } from '@mapbox/search-js-core';


async function retrieveCoordinates(name) {
    const app = window.app;

    try {
        // MapboxGeocoder doesn't have a direct method like forwardGeocode exposed easily
        // for programmatic use without a map or input element in its default setup.
        // A better approach is to use the Mapbox Geocoding API directly.

        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(name)}.json`;
        const params = new URLSearchParams({
            access_token: app.MAPBOX_ACCESS_TOKEN,
            limit: 1, // Get only the best match
            // You might want to add proximity, bbox, country restrictions like in SearchBoxCore
            countries: app.SEARCH_COUNTRY_RESTRICTIONS || 'au',
            types: app.SEARCH_TYPES || 'address',
            language: app.LANGUAGE || 'en',
        });

        const response = await fetch(`${endpoint}?${params.toString()}`);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const coordinates = data.features[0].geometry.coordinates;
            console.log(`Geocoded coordinates for ${name}:`, coordinates);
            return coordinates; // Returns [longitude, latitude]
        } else {
            console.warn(`No coordinates found for ${name}`);
            return null;
        }
    } catch (error) {
        console.error('Error during geocoding:', error);
        return null;
    }
}




export async function autocompleteSearch(searchInput, searchResults, startLocation) {
    const app = window.app;

    if (!startLocation) {
        startLocation = {lng: app.USER_LOCATION[0], lat: app.USER_LOCATION[1]};
    }

    if (searchInput.value.length < app.MIN_SEARCH_LENGTH) { 
        searchResults.innerHTML = '';
        return;
    }

    const search = new SearchBoxCore({ accessToken: app.MAPBOX_ACCESS_TOKEN, bbox: app.MAP_LOCATION_BOUNDS, countries: app.SEARCH_COUNTRY_RESTRICTIONS, types: app.SEARCH_TYPES, limit: app.SEARCH_RESULT_LIMIT, language: app.LANGUAGE, navigation_profile: app.TRANSPORTATION_MODE, proximity: app.USER_LOCATION, origin: startLocation }); 

    let mapSessionToken = app.MAP_SESSION_TOKEN;

    const result = await search.suggest(searchInput.value, { sessionToken : mapSessionToken });
    if (result.suggestions.length === 0) return;

    searchResults.innerHTML = '';

    for (const suggestion of result.suggestions) {
        //console.log(suggestion);
        // Prepare data to pass - stringify coordinates
        const suggestionData = {
            name: suggestion.name,
            place_formatted: suggestion.place_formatted,
            coordinates: suggestion.geometry?.coordinates, // Use optional chaining
            full_address: suggestion.full_address,
            feature_type: suggestion.feature_type,
            mapbox_id: suggestion.mapbox_id,
            distance: suggestion.distance // Keep distance if needed
        };

        // Escape single quotes in string data for the onclick attribute
        const escapedName = suggestionData.name.replace(/'/g, "\\'");
        const escapedPlaceFormatted = suggestionData.place_formatted?.replace(/'/g, "\\'") || '';
        const escapedFullAddress = suggestionData.full_address?.replace(/'/g, "\\'") || '';

        const coordinatesString = await retrieveCoordinates(suggestion.name +((", "+suggestion.full_address))) || '[]'; // Default to empty array if no coordinates

        searchResults.innerHTML += `
        <a href="#" onclick="window.handleRouteSuggestionClick('${escapedName}', '${escapedPlaceFormatted}', '${coordinatesString}', '${escapedFullAddress}', '${suggestionData.feature_type || ''}', '${suggestionData.mapbox_id || ''}', ${suggestionData.distance || null}); return false;">
            <li class="mx-2">
                <div class="row h-100 mx-2">
                    <div class="col-9">
                        <div class="row">
                            <strong>${suggestion.name}</strong>
                        </div>
                        <div class="row">
                            <small style="font-size:small">${suggestion.place_formatted}</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="row h-100 justify-end align-vertical">
                            <strong class="bg-primary r-2 p-2 d-flex text-on-primary">${suggestion.distance ? (suggestion.distance/1000).toFixed(1) + 'km' : ''}</strong>
                        </div>
                    </div>
                    
                </div>
            </li>
        </a>`;
    }
};