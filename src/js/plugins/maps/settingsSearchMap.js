mapboxgl.accessToken = 'pk.eyJ1IjoibmF0aGFuLXBlcnJpZXIyMyIsImEiOiJjbG8ybW9pYnowOTRiMnZsZWZ6NHFhb2diIn0.NDD8iEfYO1t9kg6q_vkVzQ';
var map = new mapboxgl.Map({
    container: 'map', //id element html
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 9 // starting zoom
});

var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false,
    zoom: 20
});


map.addControl(
    geocoder
);

let marker = null
map.on('click', function (e) {
    mapClickFn(e.lngLat);

    if (marker == null) {
        marker = new mapboxgl.Marker()
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
