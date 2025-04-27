import { SearchBoxCore } from '@mapbox/search-js-core';
import { getCoordinatesFromMapboxId } from '../../utils/coordinates';

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
    result.suggestions = result.suggestions.slice(0, 3);

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
        const coordinatesString = suggestionFeatures.features[0]?.geometry.coordinates ? suggestionFeatures.features[0]?.geometry.coordinates.join(',') : []
        
        searchResults.innerHTML += `
        <a href="#" onclick="window.handleRouteSuggestionClick('${escapedName}', '${escapedPlaceFormatted}', '${coordinatesString}', '${escapedFullAddress}', '${suggestionData.feature_type || ''}', '${suggestionData.mapbox_id || ''}', ${suggestionData.distance || null}); return false;">
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
                                ${suggestionData.wheelchair_accessible ? `<strong class="bg-primary r-2 p-2 d-flex text-on-primary">${suggestion.distance ? (suggestion.distance/1000).toFixed(1) + 'km' : ''}</strong>` : ''}
                            </div>
                        </div>
                    </div>
                    
                </div>
            </li>
        </a>`;
    }
};