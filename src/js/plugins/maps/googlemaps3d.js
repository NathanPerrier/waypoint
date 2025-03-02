import * as THREE from "three";
import { ThreeJSOverlayView, latLngToVector3 } from "@googlemaps/three";

// when loading via UMD, remove the imports and use this instead:
// const { ThreeJSOverlayView, latLngToVector3 } = google.maps.plugins.three;

const map = new google.maps.Map(document.getElementById("map"), mapOptions);
const overlay = new ThreeJSOverlayView({
  map,
  upAxis: "Y",
  anchor: mapOptions.center,
});

// create a box mesh
const box = new THREE.Mesh(
  new THREE.BoxGeometry(10, 50, 10),
  new THREE.MeshMatcapMaterial()
);
// move the box up so the origin of the box is at the bottom
box.geometry.translateY(25);

// set position at center of map
box.position.copy(overlay.latLngAltitudeToVector3(mapOptions.center));

// add box mesh to the scene
overlay.scene.add(box);

// rotate the box using requestAnimationFrame
const animate = () => {
  box.rotateY(THREE.MathUtils.degToRad(0.1));

  requestAnimationFrame(animate);
};

// start animation loop
requestAnimationFrame(animate);