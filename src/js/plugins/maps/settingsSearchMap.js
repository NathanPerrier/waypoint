document.addEventListener('DOMContentLoaded', async () => {
    const app = window.app;

    mapboxgl.accessToken = app.MAPBOX_ACCESS_TOKEN;

     // Wait for the settings-map element to be added to the DOM
     const waitForElement = (id) => {
        return new Promise((resolve) => {
            const element = document.getElementById(id);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.getElementById(id);
                if (element) {
                    resolve(element);
                    observer.disconnect();
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        });
    };

    const mapContainer = await waitForElement('settings-map');
    if (!mapContainer) {
        console.error("Map container not found. Cannot initialize map.");
        return;
    }


    var map = new mapboxgl.Map({
        container: mapContainer, //id element html
        zoom: 16, // starting zoom
        center: app.MAP_LOCATION_CENTER, // starting position [lng, lat]
        pitch: 60,
        maxBounds: app.MAP_LOCATION_BOUNDS_LNGLATLIKE, //[[west, south], [east, north]]
    });

    var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        zoom: 6,
        maxBounds: app.MAP_LOCATION_BOUNDS_LNGLATLIKE,
    });


    map.addControl(
        geocoder
    );

    let marker = null

    // Set initial marker to user's location
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

    //     // Optional: If you still want to display the address somewhere,
    //     // you could call mapClickFn here, but update a *different* element,
    //     // not the hidden startLocation input.
    //     // mapClickFn(coords); 
    });

    window.addEventListener('resize', function () {
        map.resize();
    });
});

