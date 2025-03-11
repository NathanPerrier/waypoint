import { getUserLocation } from "../../userLocation";
import { LngLatBounds} from '@mapbox/search-js-core'

document.addEventListener('DOMContentLoaded', () => {

    mapboxgl.accessToken = 'pk.eyJ1IjoibmF0aGFuLXBlcnJpZXIyMyIsImEiOiJjbG8ybW9pYnowOTRiMnZsZWZ6NHFhb2diIn0.NDD8iEfYO1t9kg6q_vkVzQ';

    const mapContainer = document.getElementById('settings-map');

    const bbox = new LngLatBounds([152.998221, -27.505890], [153.019359, -27.490149]);

    let userLocation;
    navigator.geolocation.getCurrentPosition(function(position) {
        userLocation = [position.coords.longitude, position.coords.latitude];
    });

    var map = new mapboxgl.Map({
        container: mapContainer, //id element html
        center: userLocation, // starting position
        zoom: 5, // starting zoom
        maxBounds: [[152.998221, -27.505890], [153.019359, -27.490149]]

    });

    var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        zoom: 5,
        center: userLocation,
        maxBounds: [[152.998221, -27.505890], [153.019359, -27.490149]]
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
});