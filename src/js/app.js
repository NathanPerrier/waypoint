import Framework7 from 'framework7/bundle';

// Import F7 Styles
import 'framework7/css/bundle';

import 'mapbox-gl/dist/mapbox-gl.css';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';
import '../css/theme.css';
import '../css/format.css';

// Import Routes
import routes from './routes.js';

// Import main app component
import App from '../app.f7';

// Import Config Initializer
import { initializeConfig } from './config.js'; // Import only the initializer function

import jQuery from 'jquery';


window.jQuery = jQuery;
window.$ = jQuery;

(async () => {
  // Initialize Framework7 app
  var app = new Framework7({
      name: 'Waypoint', // App name
      theme: 'md', // auto
      colors: {
          primary: '#782cf6',
      },
      darkMode: false,
      el: '#app', // App root element
      component: App, // App main component

      // App routes
      routes: routes,
      
  });

  // Expose app globally
  window.app = app;

  // Initialize config by passing the app instance
  await initializeConfig(app);
})();

