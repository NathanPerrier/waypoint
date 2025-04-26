import HomePage from '../pages/home.f7';
import RoutePage from '../pages/route.f7';
import RouteDesktopPage from '../pages/routeDesktop.f7';
import NavPage from '../pages/navigation.f7';

import NotFoundPage from '../pages/404.f7';

import { createRouteGuard, checkForURLParams } from './utils/routes.js';

var routes = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/route/',
    component: RoutePage,
    keepAlive: true,
    beforeEnter: createRouteGuard([
      {
        condition: (app) => !!app.USER_LOCATION,
        redirectPath: '/',
        title: 'User Location Missing',
        description: 'The application could not determine your location. Please enable location services and try again.',
        severity: 'error',
      },
      {
        condition: (app) => !!app.AR,
        redirectPath: '/routeDesktop/',
        title: 'AR Library Not Loaded',
        description: 'The AR library is not available on this device. Desktop environment detected. Please use a mobile device for AR features.',
        severity: 'warn',
        
      },
      {
        condition: (app) => !!app.WEBCAM_ENABLED,
        redirectPath: '/routeDesktop/',
        title: 'Webcam Not Enabled',
        description: 'The application requires webcam access. Please enable your webcam and try again.',
        deviceCheck: true, 
        severity: 'error',
      },
      {
        condition: (app) => !!app.RENDERER && !!app.LOCAR_SCENE && !!app.LOCAR_CAMERA && !!app.CAM && !!app.DEVICE_ORIENTATION_CONTROLS,
        redirectPath: '/routeDesktop/',
        title: 'AR Components Not Initialized',
        description: 'The AR components are not initialized correctly. Please check your device and try again.',
        severity: 'error',
      },
      {
        condition: (app) => !!app.MAPBOX_ACCESS_TOKEN && !!app.MAP_SESSION_TOKEN && !!app.TRANSPORTATION_MODE && !!app.MAP_LOCATION_CENTER && !!app.MAP_LOCATION_BOUNDS,
        redirectPath: '/',
        title: 'Mapbox Access Token Missing',
        description: 'Mapbox failed to initialised. Navagtion services are not available. Please try again.',
        severity: 'error',
      }
    ]),
  },
  {
    path: '/routeDesktop/',
    component: RouteDesktopPage,
    beforeEnter: createRouteGuard([
      {
        condition: (app) => !!app.USER_LOCATION,
        redirectPath: '/',
        title: 'User Location Missing',
        description: 'The application could not determine your location. Please enable location services and try again.',
        severity: 'error',
      },
      {
        condition: (app) => !!app.MAPBOX_ACCESS_TOKEN && !!app.MAP_SESSION_TOKEN && !!app.TRANSPORTATION_MODE && !!app.MAP_LOCATION_CENTER && !!app.MAP_LOCATION_BOUNDS,
        redirectPath: '/',
        title: 'Mapbox Access Token Missing',
        description: 'Mapbox failed to initialised. Navagtion services are not available. Please try again.',
        severity: 'error',
      }

      //! Add more checks as needed
    ]),
  },
  {
    path: '/navigation/',
    component: NavPage,
    keepAlive: true,
    beforeEnter: function () {
        createRouteGuard([
        {
          condition: (app) => !!app.USER_LOCATION,
          redirectPath: '/',
          title: 'User Location Missing',
          description: 'The application could not determine your location. Please enable location services and try again.',
          severity: 'error',
        },
        {
          condition: (app) => !!app.AR,
          redirectPath: '/routeDesktop/',
          title: 'AR Library Not Loaded',
          description: 'The AR library is not available on this device. Desktop environment detected. Please use a mobile device for AR features.',
          severity: 'warn',
          
        },
        {
          condition: (app) => !!app.WEBCAM_ENABLED,
          redirectPath: '/routeDesktop/',
          title: 'Webcam Not Enabled',
          description: 'The application requires webcam access. Please enable your webcam and try again.',
          deviceCheck: true, 
          severity: 'error',
        },
        {
          condition: (app) => !!app.RENDERER && !!app.LOCAR_SCENE && !!app.LOCAR_CAMERA && !!app.CAM && !!app.DEVICE_ORIENTATION_CONTROLS,
          redirectPath: '/routeDesktop/',
          title: 'AR Components Not Initialized',
          description: 'The AR components are not initialized correctly. Please check your device and try again.',
          severity: 'error',
        },
        {
          condition: (app) => !!app.MAPBOX_ACCESS_TOKEN && !!app.MAP_SESSION_TOKEN && !!app.TRANSPORTATION_MODE && !!app.MAP_LOCATION_CENTER && !!app.MAP_LOCATION_BOUNDS,
          redirectPath: '/',
          title: 'Mapbox Access Token Missing',
          description: 'Mapbox failed to initialised. Navagtion services are not available. Please try again.',
          severity: 'error',
        }
      ]);

      checkForURLParams(app, this.router); // Call the function to check for URL parameters
    }
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;