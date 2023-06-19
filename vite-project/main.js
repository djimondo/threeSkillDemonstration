import './style.css'

import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene = new THREE.Scene();
let gui, mixer, actions, activeAction, loader, model,  animations;

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

camera.position.set( -1, 1.5, 5 );
camera.lookAt( 0, 1.5, 0 );

scene = new THREE.Scene();
scene.background = new THREE.Color( 0xe0e0e0 );
scene.fog = new THREE.Fog( 0xe0e0e0, 20, 100 );

let clock = new THREE.Clock();

// lights

const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d );
hemiLight.position.set( 0, 20, 0 );
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set( 0, 20, 10 );
scene.add( dirLight );

// ground

const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
mesh.rotation.x = - Math.PI / 2;
scene.add( mesh );

const grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
grid.material.opacity = 0.2;
grid.material.transparent = true;
scene.add( grid );

window.addEventListener( 'resize', onWindowResize );


//load model


await loadModel();
createGUI(model, animations);



animate();

function animate(){
  const dt = clock.getDelta();

  requestAnimationFrame( animate );
  renderer.render(scene, camera);
}

async function loadModel() {
  loader = new GLTFLoader();
  let gltf = await loader.loadAsync("ed.glb");
  model = gltf.scene.children[0];
  animations = gltf.animations;
  scene.add(model);
  
    
  
  
}

function createGUI(model, animations){
  gui = new GUI();
  mixer = new THREE.AnimationMixer( model );

	actions = {};
  console.log(model);
  let ed = model.getObjectByName("ED2");
  //change from expressions to singular tense
  const expressions = Object.keys(ed.morphTargetDictionary);
  const expressionFolder = gui.addFolder('Expressions');
  expressionFolder.add( ed.morphTargetInfluences, 0, 0, 1, 0.01).name( 'talking shape key' );
  const clip = animations[ 0 ];
  activeAction = mixer.clipAction( clip );
  activeAction.play();

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}