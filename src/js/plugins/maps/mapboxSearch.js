import { SearchBoxCore, SessionToken, LngLatBounds} from '@mapbox/search-js-core'

// get user coordinates
let userLocation;
navigator.geolocation.getCurrentPosition(function(position) {
    userLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
    };
});

const bbox = new LngLatBounds([152.998221, -27.505890], [153.019359, -27.490149]);

const sessionToken = new SessionToken();

export async function autocompleteSearch(searchInput, searchResults, startLocation) {
    if (!startLocation) {
        startLocation = userLocation;
    }

    if (searchInput.value.length < 3) {
        searchResults.innerHTML = '';
        return;
    }

    const search = new SearchBoxCore({ accessToken: 'pk.eyJ1IjoibmF0aGFuLXBlcnJpZXIyMyIsImEiOiJjbG8ybW9pYnowOTRiMnZsZWZ6NHFhb2diIn0.NDD8iEfYO1t9kg6q_vkVzQ', bbox: bbox, countries: 'au', types: ['poi', 'address'], limit: 3, language: 'en', navigation_profile: "walking", proximity: userLocation, origin: startLocation }); 

    const result = await search.suggest(searchInput.value, { sessionToken });
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
