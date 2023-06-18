import './style.css'

import * as THREE from 'three';

const scene = new THREE.Scene();

const camera  = new THREE.PerspectiveCamera (75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

const geo = new THREE.BoxGeometry(3,3,3);
const material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, wireframe: true});
const mesh = new THREE.Mesh(geo, material);

scene.add(mesh);

animate();

function animate(){
  mesh.rotation.y += 0.01;
  mesh.rotation.z += 0.01;
  requestAnimationFrame( animate );
  renderer.render(scene, camera);
}