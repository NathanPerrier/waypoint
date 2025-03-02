import $ from 'dom7';
import Framework7 from 'framework7/bundle';

// Import F7 Styles
import 'framework7/css/bundle';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';


// Import Routes
import routes from './routes.js';

// Import main app component
import App from '../app.f7';


var app = new Framework7({
  name: 'Waypoint', // App name
  theme: 'auto', // Automatic theme detection
  colors: {
    primary: '#782cf6',
  },
  darkMode: false,
  el: '#app', // App root element
  component: App, // App main component

  // App routes
  routes: routes,
});

// Expose app to the global scope
window.app = app;