import { SearchBoxCore } from '@mapbox/search-js-core';
import { getCoordinatesFromMapboxId } from '../../utils/coordinates';
import debounce from 'lodash/debounce';

const searchCache = new Map(); // Cache for search results

export async function autocompleteSearch(searchInput, searchResults, startLocation) {
    const app = window.app;

    if (!startLocation) {
        startLocation = {lng: app.USER_LOCATION[0], lat: app.USER_LOCATION[1]};
    }

    const debouncedSearch = debounce(async () => {
        if (searchInput.value.length < app.MIN_SEARCH_LENGTH) { 
            searchResults.innerHTML = '';
            return;
        }

        if (searchCache.has(searchInput.value)) {
            // Use cached results if available
            const cachedHTML = searchCache.get(searchInput.value);
            searchResults.innerHTML = cachedHTML;
            return;
        }

        const search = new SearchBoxCore({ 
            accessToken: app.MAPBOX_ACCESS_TOKEN, 
            bbox: app.MAP_LOCATION_BOUNDS, 
            countries: app.SEARCH_COUNTRY_RESTRICTIONS, 
            types: app.SEARCH_TYPES, //! fix
            limit: app.SEARCH_RESULT_LIMIT, // Limit suggestions to 5
            language: app.LANGUAGE, 
            navigation_profile: app.TRANSPORTATION_MODE, 
            proximity: app.USER_LOCATION, 
            origin: startLocation 
        }); 

        let mapSessionToken = app.MAP_SESSION_TOKEN;
        if (!mapSessionToken) {
            mapSessionToken = app.MAP_SESSION_TOKEN = new SessionToken(); // Reuse session token
        }

        const result = await search.suggest(searchInput.value, { sessionToken : mapSessionToken });
        if (result.suggestions.length === 0) return;

        result.suggestions = result.suggestions.slice(0, 3);

        let suggestionsHTML = ''; // Initialize an empty string to accumulate HTML
        for (const suggestion of result.suggestions) {
            const suggestionFeatures = await getCoordinatesFromMapboxId(suggestion.mapbox_id, mapSessionToken) || [];

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
    }, 300); // Debounce delay of 300ms

    debouncedSearch();
}