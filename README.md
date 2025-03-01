<div align="center">
    <a href="https://waypointuq.com">
        <img src="./src/assets/logos/logoWhite1024x300.png" width="1024" height="303" alt="Waypoint logo">
    </a>
    <p>
        <strong>Framework7</strong> &bull; <strong>Vite</strong> &bull; <strong>Google Maps</strong>
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

> 👉 Create `.env` from `env.sample`

```env
GOOGLE_API_KEY=your-api-key
```

> 👉 Install npm dependencies

```bash
npm install
```

> 👉 Run NPM scrips

* 🔥 `start` - run development server
* 🔧 `dev` - run development server
* 🔧 `build` - build web app for production

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



## Documentation & Resources

* [Framework7 Core Documentation](https://framework7.io/docs/)



* [Framework7 Icons Reference](https://framework7.io/icons/)
* [Community Forum](https://forum.framework7.io)

## Support Framework7

Love Framework7? Support project by donating or pledging on:
- Patreon: https://patreon.com/framework7
- OpenCollective: https://opencollective.com/framework7