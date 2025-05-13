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


## About The Project

This website brings an innovative solution to navigating the University of Queensland campus through using AR directions. This website also introduces native mobile design features to the web to seemlessly integrate with both desktop and mobile.

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

Framework7

vite

AR.JS

Mapbox

## Design Choices

No Nav

