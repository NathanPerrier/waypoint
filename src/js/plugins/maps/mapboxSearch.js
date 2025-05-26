import { SearchBoxCore } from '@mapbox/search-js-core';
import { getCoordinatesFromMapboxId } from '../../utils/coordinates';
import debounce from 'lodash/debounce';

// Cache for search results
const searchCache = new Map(); 

/**
 * Performs an autocomplete search using Mapbox SearchBoxCore.
 * 
 * @param {HTMLInputElement} searchInput - The input element where the user types the search query.
 * @param {HTMLElement} searchResults - The element where the search results will be displayed.
 * @param {Object} [startLocation] - Optional starting location for the search, defaults to user's current location.
 * 
 * @returns {Promise<void>} - A promise that resolves when the search is complete.
 * 
 */
export async function autocompleteSearch(searchInput, searchResults, startLocation) {
    const app = window.app;

    // if startLocation is not provided, use the user's current location
    if (!startLocation) {
        startLocation = {lng: app.USER_LOCATION[0], lat: app.USER_LOCATION[1]};
    }

    // Debounce the search function to limit the number of API calls
    const debouncedSearch = debounce(async () => {
        // Clear previous results if input is empty or below minimum length
        if (searchInput.value.length < app.MIN_SEARCH_LENGTH) { 
            searchResults.innerHTML = '';
            return;
        }

        // Check if the search input is already cached
        if (searchCache.has(searchInput.value)) {
            const cachedHTML = searchCache.get(searchInput.value);
            searchResults.innerHTML = cachedHTML;
            return;
        }

        // Initialize SearchBoxCore with the necessary parameters
        const search = new SearchBoxCore({ 
            accessToken: app.MAPBOX_ACCESS_TOKEN, 
            bbox: app.MAP_LOCATION_BOUNDS, 
            countries: app.SEARCH_COUNTRY_RESTRICTIONS, 
            types: app.SEARCH_TYPES, 
            limit: app.SEARCH_RESULT_LIMIT, 
            language: app.LANGUAGE, 
            navigation_profile: app.TRANSPORTATION_MODE, 
            proximity: app.USER_LOCATION, 
            origin: startLocation 
        }); 

        // Check if SessionToken exists, if not create a new one
        let mapSessionToken = app.MAP_SESSION_TOKEN;
        if (!mapSessionToken) {
            mapSessionToken = app.MAP_SESSION_TOKEN = new SessionToken(); // Reuse session token
        }

        // Perform the search using the SearchBoxCore instance
        const result = await search.suggest(searchInput.value, { sessionToken : mapSessionToken });

        // Check if the result contains suggestions
        if (result.suggestions.length === 0) return;

        // Ensure only the first 3 suggestions are displayed
        result.suggestions = result.suggestions.slice(0, 3);

        // for each suggestion, fetch the coordinates and build the HTML
        let suggestionsHTML = '';
        for (const suggestion of result.suggestions) {
            // retrieve coordinates from Mapbox ID
            const suggestionFeatures = await getCoordinatesFromMapboxId(suggestion.mapbox_id, mapSessionToken) || [];

            // create a suggestion data object
            const suggestionData = {
                name: suggestion.name,
                place_formatted: suggestion.place_formatted,
                coordinates: suggestionFeatures.features[0]?.geometry.coordinates || [],
                full_address: suggestion.full_address,
                feature_type: suggestion.feature_type,
                mapbox_id: suggestion.mapbox_id,
                distance: suggestion.distance,
                wheelchair_accessible: suggestionFeatures.features[0]?.properties.metadata.wheelchair_accessible,
            };

            // Escape single quotes in the suggestion data to prevent breaking the HTML
            const escapedName = suggestionData.name.replace(/'/g, "\\'");
            const escapedPlaceFormatted = suggestionData.place_formatted?.replace(/'/g, "\\'") || '';
            const escapedFullAddress = suggestionData.full_address?.replace(/'/g, "\\'") || '';
            const coordinatesString = suggestionFeatures.features[0]?.geometry.coordinates ? suggestionFeatures.features[0]?.geometry.coordinates.join(',') : [];

            // Append suggestion HTML to the string variable
            suggestionsHTML += `
            <a href="#" onclick="window.handleRouteSuggestionClick('${searchInput.id}', '${searchResults.id}', '${escapedName}', '${escapedPlaceFormatted}', '${coordinatesString}', '${escapedFullAddress}', '${suggestionData.feature_type || ''}', '${suggestionData.mapbox_id || ''}', ${suggestionData.distance || null}); return false;">
                <li class="mx-2">
                    <div class="row w-100 h-100 mx-2">
                        <div class="col-7">
                            <div class="row">
                                <strong>${suggestion.name}</strong>
                            </div>
                            <div class="row">
                                <small style="font-size:small">${suggestion.place_formatted}</small>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="row h-100 justify-end align-vertical">
                                <div class="row d-flex justify-end align-vertical">

                                    ${suggestionData.wheelchair_accessible ? '<i class="mr-2 fas fa-wheelchair" title="Wheelchair Accessible"></i>' : ''}
                                    ${suggestion.distance ? `<strong class="bg-primary r-2 p-2 d-flex text-on-primary">${suggestion.distance ? (suggestion.distance/1000).toFixed(1) + 'km' : ''}</strong>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            </a>`;
        }
        // Update innerHTML once after the loop with the accumulated HTML
        searchResults.innerHTML = suggestionsHTML; 

        // Cache the results
        searchCache.set(searchInput.value, suggestionsHTML);
    }, app.DEBOUNCE_DELAY);

    debouncedSearch();
}