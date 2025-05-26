import HomePage from '../pages/home.f7';
import RoutePage from '../pages/route.f7';
import RouteDesktopPage from '../pages/routeDesktop.f7';
import NavigationDesktopPage from '../pages/navigationDesktop.f7';
import NavigationPage from '../pages/navigation.f7';

import NotFoundPage from '../pages/404.f7';

import { createRouteGuard } from './utils/routes.js';

import { checkForURLParams } from './utils/routes.js';

var routes = [
  {
    path: '/',
    component: HomePage,
    on: {
      pageInit: function (page) {
        const app = this.app;
        // check if the app initialization promise is set
        if (!app.initializationPromise) {
          console.error("App initialization promise is not set. Cannot proceed.");
          return;
        }
        // Ensure the app has been initialized and configuration is ready
        app.initializationPromise.then(() => {
          const preloader = document.getElementById('app-preloader');
          if (preloader && preloader.style) {
            // if AR is disabled, set the hrefs for go-back and hero-button to view-route-desktop
            if (!app.AR) {
              const go_back = document.getElementById('go-back');
              const hero_button = document.getElementById('hero-button');
              go_back.href = '#view-route-desktop';
              hero_button.href = '#view-route-desktop';
            }
            
            // Check for URL parameters and handle them
            checkForURLParams(app, this);
            
            // Hide the preloader once the app is initialized
            preloader.style.display = 'none';
          }
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
        condition: (app) => !!app.MAPBOX_ACCESS_TOKEN && !!app.MAP_SESSION_TOKEN && !!app.TRANSPORTATION_MODE && !!app.MAP_LOCATION_CENTER,
        redirectPath: '/',
        title: 'Mapbox Access Token Missing',
        description: 'Mapbox failed to initialised. Navagtion services are not available. Please try again.',
        severity: 'error',
      },
      {
        condition: (app) => !!app.WEBCAM_ENABLED,
        redirectPath: '/',
        title: 'Webcam Access Denied',
        description: 'The application could not access your webcam. Please enable webcam access and try again.',
        severity: 'error',
      }
    ]),
  },
  {
    path: '/routeDesktop/',
    component: RouteDesktopPage,
  },
  {
    path: '/navigation/',
    component: NavigationPage,
  },
  {
    path: '/navigationDesktop/',
    component: NavigationDesktopPage,
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;