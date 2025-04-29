import HomePage from '../pages/home.f7';
import RoutePage from '../pages/route.f7';
import RouteDesktopPage from '../pages/routeDesktop.f7';
import NavigationPage from '../pages/navigation.f7';

import NotFoundPage from '../pages/404.f7';

import { createRouteGuard } from './utils/routes.js';

var routes = [
  {
    path: '/',
    component: HomePage,
    on: {
      pageInit: function (page) {
        const app = this.app;
        // Check if the app is initialized and ready
        if (!app.initializationPromise) {
          console.error("App initialization promise is not set. Cannot proceed.");
          return;
        }
        // Wait for the config initialization promise to resolve
        app.initializationPromise.then(() => {
          console.log("App initialized successfully.");
          const preloader = document.getElementById('app-preloader');
          if (preloader && preloader.style) {
              // Use jQuery to hide the preloader
           
            preloader.style.display = 'none';
          }
          // Perform any additional actions after initialization here
        }).catch((error) => {
          console.error("Config initialization failed:", error);
        });
      }
    },
  },
  {
    path: '/route/',
    component: RoutePage,
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
      // {
      //   condition: (app) => !!app.RENDERER && !!app.LOCAR_SCENE && !!app.LOCAR_CAMERA && !!app.CAM && !!app.DEVICE_ORIENTATION_CONTROLS,
      //   redirectPath: '/routeDesktop/',
      //   title: 'AR Components Not Initialized',
      //   description: 'The AR components are not initialized correctly. Please check your device and try again.',
      //   severity: 'error',
      // },
      {
        condition: (app) => !!app.MAPBOX_ACCESS_TOKEN && !!app.MAP_SESSION_TOKEN && !!app.TRANSPORTATION_MODE && !!app.MAP_LOCATION_CENTER,
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
        condition: (app) => !!app.MAPBOX_ACCESS_TOKEN && !!app.MAP_SESSION_TOKEN && !!app.TRANSPORTATION_MODE && !!app.MAP_LOCATION_CENTER,
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
    component: NavigationPage,
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
      // {
      //   condition: (app) => !!app.RENDERER && !!app.LOCAR_SCENE && !!app.LOCAR_CAMERA && !!app.CAM && !!app.DEVICE_ORIENTATION_CONTROLS,
      //   redirectPath: '/routeDesktop/',
      //   title: 'AR Components Not Initialized',
      //   description: 'The AR components are not initialized correctly. Please check your device and try again.',
      //   severity: 'error',
      // },
      {
        condition: (app) => !!app.MAPBOX_ACCESS_TOKEN && !!app.MAP_SESSION_TOKEN && !!app.TRANSPORTATION_MODE && !!app.MAP_LOCATION_CENTER,
        redirectPath: '/',
        title: 'Mapbox Access Token Missing',
        description: 'Mapbox failed to initialised. Navagtion services are not available. Please try again.',
        severity: 'error',
      },
      // {
      //   condition: (app) => !!app.NAVIGATION_ROUTE_DATA && !!app.NAVIGATION_ROUTE && !!app.NAVIGATION_ROUTE_STEPS && !!app.DESTINATION_LOCATION_COORDINATES && !!app.DESTINATION_LOCATION && !!app.DESTINATION_LOCATION_DATA && !!app.START_LOCATION && !!app.TRANSPORTATION_MODE,
      //   redirectPath: '/route/',
      //   title: 'Route Data Missing',
      //   description: 'The route data is not available. Please check your route and try again.',
      //   severity: 'error',
      // }    
    ])
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;