import Config from '../../config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const config = Config.config;

    mapboxgl.accessToken = config.MAPBOX_ACCESS_TOKEN;

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
    console.log('settings-map element found:', mapContainer);


    var map = new mapboxgl.Map({
        container: mapContainer, //id element html
        zoom: 16, // starting zoom
        center: config.MAP_LOCATION_CENTER, // starting position [lng, lat]
        pitch: 60,
        maxBounds: config.MAP_LOCATION_BOUNDS_LNGLATLIKE, //[[west, south], [east, north]]
    });

    var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        zoom: 6,
        maxBounds: config.MAP_LOCATION_BOUNDS_LNGLATLIKE,
    });


    map.addControl(
        geocoder
    );

    let marker = null
    map.on('click', function (e) {
        mapClickFn(e.lngLat);

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



    function mapClickFn(coordinates) {
        const url =
            "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
            coordinates.lng +
            "," +
            coordinates.lat +
            ".json?access_token=" +
            mapboxgl.accessToken

        fetch(url).then(res => res.json()).then((data) => {
            if (data.features.length > 0) {
                const address = data.features[0].place_name;
                document.getElementById("startLocation").value = address;
            } else {
                document.getElementById("startLocation").value = "No address found";
            }
        });
    }

    let currentLocationBtn = document.getElementById('startLocationButton');

    currentLocationBtn.addEventListener('click', () => {
        mapClickFn({ lng: config.USER_LOCATION[0], lat: config.USER_LOCATION[1] });
    });

    //if viewport width changes, resize map
    window.addEventListener('resize', function () {
        map.resize();
    });
});

