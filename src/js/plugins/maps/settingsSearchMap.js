import { waitForElement } from "../../utils/dom";

document.addEventListener('DOMContentLoaded', async () => {
    const app = window.app;

    mapboxgl.accessToken = app.MAPBOX_ACCESS_TOKEN;

    const mapContainer = await waitForElement('settings-map');
    if (!mapContainer) {
        console.error("Map container not found. Cannot initialize map.");
        return;
    }


    var map = new mapboxgl.Map({
        container: mapContainer, 
        zoom: 16, 
        maxZoom: 20,
        center: app.START_LOCATION,  
        pitch: 0,
        maxPitch: 0,
        minPitch: 0,
        refreshExpiredTiles: false,
        style: app.MAP_LIGHT_STYLE,
    });

    var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        maxBounds: app.MAP_LOCATION_BOUNDS_LNGLATLIKE,
    });


    map.addControl(
        geocoder
    );

    let marker = null

    marker = new mapboxgl.Marker({
        color: "#762CEF",
        draggable: true
    })
    .setLngLat(app.START_LOCATION)
    .addTo(map);


    map.on('click', function (e) {
        app.START_LOCATION = {lng: e.lngLat.lng, lat: e.lngLat.lat};
        console.log('Updated startLocation input value:', app.START_LOCATION);

        if (marker == null) {
            marker = new mapboxgl.Marker(
                {
                    color: "#762CEF",
                    draggable: true
                }
            )
            .setLngLat(e.lngLat)
            .addTo(map);
        } else {
            marker.setLngLat(e.lngLat)
        }
    });

    window.addEventListener('resize', function () {
        map.resize();
    });
});

