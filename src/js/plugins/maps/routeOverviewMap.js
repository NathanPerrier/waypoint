import mapboxgl from 'mapbox-gl';

export async function createStaticRouteMap(app, containerId) {
  const map = new mapboxgl.Map({
    container: containerId,
    style: app.MAP_LIGHT_STYLE,
    center: app.START_LOCATION,
    zoom: 14,
    minZoom: 14,
    maxZoom: 18,
    pitch: 0,
    maxPitch: 0,
    minPitch: 0,
    accessToken: app.MAPBOX_ACCESS_TOKEN,
    bounds: app.MAP_LOCATION_BOUNDS_LNGLATLIKE,
    refreshExpiredTiles: false,
  });

  // Add start position marker
  if (app.NAVIGATION_ROUTE && app.NAVIGATION_ROUTE.length > 0) {
    new mapboxgl.Marker({ color: app.PRIMARY_COLOR, offset: [0, 0] })
      .setLngLat(app.NAVIGATION_ROUTE[0]) // Use exact coordinates from NAVIGATION_ROUTE
      .addTo(map);
  }

  // Add destination marker
  if (app.NAVIGATION_ROUTE && app.NAVIGATION_ROUTE.length > 1) {
    new mapboxgl.Marker({ color: app.SECONDARY_COLOR, offset: [0, 0] })
      .setLngLat(app.NAVIGATION_ROUTE[app.NAVIGATION_ROUTE.length - 1]) // Use exact coordinates from NAVIGATION_ROUTE
      .addTo(map);
  }

  console.log('Navigation route:', app.NAVIGATION_ROUTE);

  // Add route line
  if (app.NAVIGATION_ROUTE && Array.isArray(app.NAVIGATION_ROUTE)) {
    map.on('load', () => {
        // Ensure the source is added correctly
        map.addSource('route', {
        type: 'geojson',
        data: {
            type: 'Feature',
            geometry: {
            type: 'LineString',
            coordinates: app.NAVIGATION_ROUTE,
            },
        },
        });

        // Add the dashed route layer
        map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
            'line-join': 'round',
            'line-cap': 'round',
        },
        paint: {
            'line-color': app.PRIMARY_COLOR,
            'line-width': 8,
            // 'line-dasharray': [2, 4], // Dashed line pattern
        },
        });
    });
    } else {
    console.error('NAVIGATION_ROUTE_COORDINATES is missing or not in the correct format.');
    }
};

export function createLiveRouteMap(app, containerId) {
  const map = new mapboxgl.Map({
    container: containerId,
    style: app.MAP_LIGHT_STYLE,
    center: app.START_LOCATION,
    zoom: 14,
    minZoom: 14,
    maxZoom: 18,
    pitch: 0,
    maxPitch: 0,
    minPitch: 0,
    accessToken: app.MAPBOX_ACCESS_TOKEN,
    bounds: app.MAP_LOCATION_BOUNDS_LNGLATLIKE,
    refreshExpiredTiles: false,
  });

  // Add start position marker
  if (app.NAVIGATION_ROUTE && app.NAVIGATION_ROUTE.length > 0) {
    new mapboxgl.Marker({ color: app.PRIMARY_COLOR, anchor: 'bottom' })
      .setLngLat(app.NAVIGATION_ROUTE[0]) // Use exact coordinates from NAVIGATION_ROUTE
      .addTo(map);
  }

  // Add destination marker
  if (app.NAVIGATION_ROUTE && app.NAVIGATION_ROUTE.length > 1) {
    new mapboxgl.Marker({ color: app.SECONDARY_COLOR, anchor: 'bottom' })
      .setLngLat(app.NAVIGATION_ROUTE[app.NAVIGATION_ROUTE.length - 1]) // Use exact coordinates from NAVIGATION_ROUTE
      .addTo(map);
  }

  // Add route line
  if (app.NAVIGATION_ROUTE) {
    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: app.NAVIGATION_ROUTE,
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
          'line-color': app.PRIMARY_COLOR,
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