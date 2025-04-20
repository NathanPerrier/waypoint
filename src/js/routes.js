
import HomePage from '../pages/home.f7';
import RoutePage from '../pages/route.f7';
import RouteDesktopPage from '../pages/routeDesktop.f7';

import NotFoundPage from '../pages/404.f7';

import initializeConfig from './config.js';
import PopupComponent from 'framework7/components/popup';
import { append } from 'three/src/nodes/TSL.js';

let config;

// Initialize the configuration before defining routes
(async () => {
    config = await initializeConfig();
})();

var routes = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/route/',
    component: RoutePage,
    keepAlive: true,
    beforeEnter: function ({ resolve, reject }) {
      const router = this;
      var app = router.app

      if (!config.DESKTOP_DEVICE) {
        if (config.WEBCAM_ENABLED) {
          resolve();
        } else {
          app.dialog.create({
            title: "AR Features Disabled", 
            text: 'Webcam not detected. It is required for AR Features. Please check your webcam settings and try again.',
            buttons: [
              {
                text: 'OK',
                onClick: function() {
                  router.navigate('/routeDesktop/');
                }
              }
            ]
          }).open();
          reject();
          router.navigate('/routeDesktop/');
          return;
        }
      } else {
        try {
          reject();
          router.navigate('/routeDesktop/');
          return;
        } catch (error) {
          console.log(error);
        }
      };
    },
  },
  {
    path: '/routeDesktop/',
    component: RouteDesktopPage,
    keepAlive: true,
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;