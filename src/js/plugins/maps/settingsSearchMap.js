/**
 * Creates the settings map that allows desktop users to click on the map to set a new start location.
 * 
 * @async
 * 
 * @param {HTMLElement} mapContainer - The container element for the Mapbox map.
 * 
 * @returns {Promise<Object>} - A promise that resolves to an object containing the map instance and a marker.
 * @throws {Error} - If the map container is not found or if the Mapbox access token is missing.
 * 
 */
export async function initSettingsMap(mapContainer) {
    const app = window.app;

    mapboxgl.accessToken = app.MAPBOX_ACCESS_TOKEN;

    // Check if the map container is defined
    if (!mapContainer) {
        app.dialog.alert('Map container not found', 'Error');
        return;
    }

    // create a new Mapbox map instance
    const map = new mapboxgl.Map({
        container: mapContainer, 
        zoom: 16, 
        minZoom: 15,
        maxZoom: 18,
        center: app.START_LOCATION,  
        pitch: 0,
        maxPitch: 0,
        minPitch: 0,
        refreshExpiredTiles: false,
        style: app.MAP_LIGHT_STYLE,
        maxBounds: app.MAP_LOCATION_BOUNDS_LNGLATLIKE,
    });

    // on map load, resize the map
    map.on('load', () => {
        map.resize();
    });

    // create a geocoder control for searching locations
    var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        maxBounds: app.MAP_LOCATION_BOUNDS_LNGLATLIKE,
    });

    // add the geocoder control to the map
    map.addControl(
        geocoder
    );

    // create a marker for the start location and add it to the map at the initial start location
    let marker = null
    marker = new mapboxgl.Marker({
        color: "#762CEF",
        draggable: true,
        offset: [0, 0],
        anchor: 'bottom',
        
    })
    .setLngLat(app.START_LOCATION)
    .addTo(map);


    // update the start location when the marker is dragged or map is clicked
    map.on('click', function (e) {
        app.START_LOCATION = {lng: e.lngLat.lng, lat: e.lngLat.lat};

        // Update the marker position
        if (marker == null) {
            marker = new mapboxgl.Marker(
                {
                    color: "#762CEF",
                    draggable: true,
                    offset: [-width / 2, -height],
                    anchor: 'bottom',
                }
            )
            .setLngLat(e.lngLat)
            .addTo(map);
        } else {
            marker.setLngLat(e.lngLat)
        }
    });

    // Resize the map when the window is resized
    window.addEventListener('resize', function () {
        map.resize();
    });

    return {map: map, marker: marker};
};

