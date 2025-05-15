import { SearchBoxCore } from '@mapbox/search-js-core';
import { getCoordinatesFromMapboxId } from '../../utils/coordinates';

export async function placeSuggestion(app) {
    const url = ` https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${app.USER_LOCATION[0]},${app.USER_LOCATION[1]}.json?radius=${app.AR_SUGGESTION_RADIUS}&dedupe&layers=poi_label&geometry=point&access_token=${app.MAPBOX_ACCESS_TOKEN}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fretch suggestions from Mapbox.');
    }
    const data = await response.json();

    if (data.features.length === 0) {
        return;
    }

    for (const suggestion of data.features) {
        if (app.AR_SUGGESTIONS.some(s => s.geometry.coordinates === suggestion.geometry.coordinates)) {
            console.log('Suggestion already exists in AR_SUGGESTIONS');
            continue;
        }
        app.AR_SUGGESTIONS.push(suggestion);
    }
}