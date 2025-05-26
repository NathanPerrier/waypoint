<div align="center">
    <a href="https://waypointuq.com">
        <img src="./public/icons/128x128.png" width="64" height="64" alt="Waypoint logo">
    </a>
    <h1>
        <a href="https://github.com/NathanPerrier/waypoint">
            WAYPOINT
        </a>
    </h1>
    <p>
        <strong>Framework7</strong> &bull; <strong>Vite</strong> &bull; <strong>Mapbox</strong> &bull; <strong>LocarJS/ARJS</strong>
    </p>     
</div>

<br />

<img src="./public/images/gif-demo.gif" width="100%">

<br />

## About The Project

Project for DECO1400 | Asessment 1 & 2 

Waypoint is an innovative solution for navigating the University of Queensland campus, using augmented reality (AR) directions to guide students and visitors with clarity and ease. By overlaying real-time navigation cues onto the physical environment, Waypoint transforms how users explore the university — whether finding lecture halls, libraries, or student events. Beyond navigation, the platform introduces native mobile design features directly into the web experience, offering a seamless and responsive interface that feels intuitive on both desktop and mobile. This ensures every user, regardless of device, enjoys a smooth and immersive experience that bridges the gap between physical and digital spaces.

Built with HTML, CSS, and JS.

Waypoint is your campus companion!

<br />

## Manual Build 

> 👉 Download code

```bash
git https://github.com/NathanPerrier/waypoint
cd Waypoint
```

> 👉 Create `.env` in `./src/`

```env
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

> 👉 Install npm dependencies

```bash
npm install
```

> 👉 Run NPM scrips

* 🔧 `npm run dev` - run development server
* 🔧 `npm build` - build web app for production

## Vite

There is a [Vite](https://vitejs.dev) bundler setup. It compiles and bundles all "front-end" resources. You should work only with files located in `/src` folder. Vite config located in `vite.config.js`.

## Assets

Assets (icons, splash screens) source images located in `assets-src` folder. To generate your own icons and splash screen images, you will need to replace all assets in this directory with your own images (pay attention to image size and format), and run the following command in the project directory:

```
framework7 assets
```

Or launch UI where you will be able to change icons and splash screens:

```
framework7 assets --ui
```

## Code Choices

The technologies for Waypoint were selected to create a fast, interactive, and mobile-first experience, diverging from traditional website conventions to deliver an application that feels native to mobile devices while remaining accessible on desktops.

*   **Framework7**: Chosen for its comprehensive set of UI components and routing capabilities specifically designed for building web apps with a native iOS and Android look and feel. This was crucial for achieving the project's goal of a seamless mobile experience, rather than a standard multi-page website structure.

*   **Vite**: Selected as the build tool for its extremely fast Hot Module Replacement (HMR) and efficient production builds. This modern tooling enhances developer productivity and ensures a performant application, which is vital for a smooth user experience, especially with interactive map and AR features.

*   **LocarJS/AR.JS**: These libraries are the cornerstone of the AR navigation feature. Integrating AR directly into a web platform offers an innovative navigation solution, moving beyond the capabilities of a typical static website by overlaying directions onto the real world.

*   **Mapbox**: Utilized for its powerful and customizable mapping functionalities, including 3D terrain and route display. Mapbox provides the detailed and interactive map experience necessary for a navigation-focused application, offering more advanced features than standard embedded maps.

*   **Single Page Application (SPA) Architecture**: The application is built as an SPA. This approach allows for fluid transitions between views and a more app-like feel, avoiding full page reloads characteristic of traditional websites. This is primarily managed by Framework7's routing.

*   **Custom `.f7` File Extension for Components/Pages**: Framework7 encourages a component-based architecture using `.f7` files. These files encapsulate the template, script, and style for different views, aligning with modern JavaScript framework practices for better organization and maintainability, rather than using traditional separate HTML, CSS, and JS files for each "page".

*   **Exclusion of Typical Semantic HTML Elements (e.g., `<section>`, `<article>`)**: While standard HTML5 semantic tags are best practice for document structure on traditional websites, Framework7's component-driven approach often provides its own structural elements (like `<div class="page">`, `<div class="block">`). The focus is on building UI components that mimic native app views, where these specific semantic tags might not directly map or offer the same styling and behavioral benefits provided by the framework's own elements.

## Design Choices

The design choices reinforce the mobile-first, app-like experience.

*   **No Traditional Website Navigation Bar**: Instead of a typical top navigation bar found on most websites, Waypoint utilizes navigation patterns common in mobile applications, such as tab bars, back buttons within views, and modal sheets. This is a deliberate choice to make the interface feel intuitive and familiar to mobile users.
*   **Mobile-First Responsive Design**: The UI is designed primarily for mobile screens and then adapted for desktop. This ensures that the core experience is optimized for on-the-go use, which is central to a navigation application.
*   **Emphasis on Touch Interactions**: The design incorporates swipe gestures and touch-friendly controls (e.g., swipe-to-close sheets), further enhancing the native mobile feel.




