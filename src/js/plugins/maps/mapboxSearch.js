import { SearchBoxCore } from '@mapbox/search-js-core';


export async function autocompleteSearch(searchInput, searchResults, startLocation) {
    const app = window.app;

    if (!startLocation) {
        startLocation = app.USER_LOCATION;
    }

    if (searchInput.value.length < app.MIN_SEARCH_LENGTH) {
        searchResults.innerHTML = '';
        return;
    }

    const search = new SearchBoxCore({ accessToken: app.MAPBOX_ACCESS_TOKEN, bbox: app.MAP_LOCATION_BOUNDS, countries: app.SEARCH_COUNTRY_RESTRICTIONS, types: app.SEARCH_TYPES, limit: app.SEARCH_RESULT_LIMIT, language: app.LANGUAGE, navigation_profile: app.TRANSPORTATION_MODE, proximity: app.USER_LOCATION, origin: startLocation }); 

    let mapSessionToken = app.MAP_SESSION_TOKEN;
    console.log(mapSessionToken);

    const result = await search.suggest(searchInput.value, { sessionToken : mapSessionToken });
    if (result.suggestions.length === 0) return;

    searchResults.innerHTML = '';

    console.log(result);

    for (const suggestion of result.suggestions) {
        //console.log(suggestion);
        searchResults.innerHTML += `
        <a onclick="searchPlace('${suggestion.name}, ${suggestion.place_formatted}', document.getElementById('search-input'), document.getElementById('search-results-list'))">
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
                        <div class="row h-100">
                            <strong class="align-vertically m-auto">${suggestion.distance/1000}km</strong>
                            <button class="button button-fill h-100 ml-2 r-2"><i class="fa fa-arrow-right"></i></button>
                        </div>
                    </div>
                </div>
            </li>
        </a>`;
    }
};

export async function validSearch(searchInput) {
    const result = await search.suggest(searchInput, { sessionToken });
    return [result.suggestions.length > 0, result.suggestions[0]];
}
