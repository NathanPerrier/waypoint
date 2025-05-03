


export async function initSettingsMap(mapContainer) {
    const app = window.app;

    mapboxgl.accessToken = app.MAPBOX_ACCESS_TOKEN;

    if (!mapContainer) {
        app.dialog.alert('Map container not found', 'Error');
        return;
    }


    var map = new mapboxgl.Map({
        container: mapContainer, 
        zoom: 16, 
        minZoom: 14,
        maxZoom: 18,
        center: app.START_LOCATION,  
        pitch: 0,
        maxPitch: 0,
        minPitch: 0,
        refreshExpiredTiles: false,
        style: app.MAP_LIGHT_STYLE,
    });

    map.on('load', () => {
        map.resize();
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
        draggable: true,
        offset: [0, 0],
        anchor: 'bottom',
        
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

    window.addEventListener('resize', function () {
        map.resize();
    });

    return map;
};

