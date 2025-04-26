import mapboxgl from 'mapbox-gl';

export function createStaticRouteMap(app, containerId) {
  const map = new mapboxgl.Map({
    container: containerId,
    style: app.MAP_LIGHT_STYLE,
    center: app.START_LOCATION,
    zoom: 14,
    accessToken: app.MAPBOX_ACCESS_TOKEN,
  });

  // Add start position marker
  new mapboxgl.Marker({ color: 'green' })
    .setLngLat([app.START_LOCATION.lng, app.START_LOCATION.lat])
    .addTo(map);

  // Add destination marker
  new mapboxgl.Marker({ color: 'red' })
    .setLngLat([app.DESTINATION_LOCATION_COORDINATES.lng, app.DESTINATION_LOCATION_COORDINATES.lat])
    .addTo(map);

  // Add route line
  if (app.NAVIGATION_ROUTE) {
    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: app.NAVIGATION_ROUTE_COORDINATES.map(coord => [coord.lng, coord.lat]),
          },
        },
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#782cf6',
          'line-width': 4,
        },
      });
    });
  }
}

export function createLiveRouteMap(app, containerId) {
  const map = new mapboxgl.Map({
    container: containerId,
    style: app.MAP_LIGHT_STYLE,
    center: app.START_LOCATION,
    zoom: 14,
    accessToken: app.MAPBOX_ACCESS_TOKEN,
  });

  // Add start position marker
  new mapboxgl.Marker({ color: 'green' })
    .setLngLat([app.START_LOCATION.lng, app.START_LOCATION.lat])
    .addTo(map);

  // Add destination marker
  new mapboxgl.Marker({ color: 'red' })
    .setLngLat([app.DESTINATION_LOCATION_COORDINATES.lng, app.DESTINATION_LOCATION_COORDINATES.lat])
    .addTo(map);

  // Add route line
  if (app.NAVIGATION_ROUTE) {
    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: app.NAVIGATION_ROUTE_COORDINATES.map(coord => [coord.lng, coord.lat]),
          },
        },
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#782cf6',
          'line-width': 4,
        },
      });
    });
  }

  // Update user position in real-time
  const userMarker = new mapboxgl.Marker({ color: 'blue' });

  function updateUserPosition() {
    if (app.USER_LOCATION) {
      userMarker.setLngLat([app.USER_LOCATION[0], app.USER_LOCATION[1]]).addTo(map);
      map.setCenter([app.USER_LOCATION[0], app.USER_LOCATION[1]]);
    }
  }

  setInterval(updateUserPosition, 5000); // Update every 5 seconds
}