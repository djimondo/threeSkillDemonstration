import './style.css'

import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let scene = new THREE.Scene();
let gui, mixer, actions, activeAction, loader, actor1, actor2, animations, obj, vertexPoint;
let loggedWorldCoordinates = false;

//scene set up
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});
const controls = new OrbitControls( camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2.5;
controls.maxDistance = 10;
controls.minAzimuthAngle = - Math.PI / 2;
controls.maxAzimuthAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 1.8;
controls.target.set( 0, 1, 2);


renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
camera.position.setZ(30);

camera.position.set( -1, 1.5, 5 );
camera.lookAt( 0, 1, 2 );

scene = new THREE.Scene();
scene.background = new THREE.Color( 0xe0e0e0 );
scene.fog = new THREE.Fog( 0xe0e0e0, 20, 100 );

let clock = new THREE.Clock();

// lights, taken from three.js examples

const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d );
hemiLight.position.set( 0, 20, 0 );
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.castShadow = true;
dirLight.shadow.camera.top = 4;
dirLight.shadow.camera.bottom = - 4;
dirLight.shadow.camera.left = - 4;
dirLight.shadow.camera.right = 4;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 40;
dirLight.position.set( 0, 20, 10 );
scene.add( dirLight );

// ground, taken from three.js examples
const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
mesh.rotation.x = - Math.PI / 2;
mesh.receiveShadow = true;
scene.add( mesh );

const grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
grid.material.opacity = 0.2;
grid.material.transparent = true;
scene.add( grid );

//add dot indicator
let dot = new THREE.SphereGeometry(.01);
let redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
vertexPoint = new THREE.Mesh(dot, redMat);
scene.add(vertexPoint);


window.addEventListener( 'resize', onWindowResize );


await loadactors();
createGUI(animations);
animate();

function animate() {
  const dt = clock.getDelta();
  if ( mixer ) mixer.update( dt );
  //at 9 seconds log the world coordinates
  /*
  if(clock.elapsedTime > 9 && !loggedWorldCoordinates) {
    alert("vertex position at time: " + clock.elapsedTime + " " + stringifyVector3(actor1.getWorldPosition(new THREE.Vector3)));
    loggedWorldCoordinates = true;
  }*/

  if(areActorsFacingEachother()) {
    actor2.children[0].material.color.set(0x28bd32);
  }
  else {
    actor2.children[0].material.color.set(0x8f0000);
  }

  requestAnimationFrame( animate );
  renderer.render(scene, camera);
  
}

//loads in the actors needed for the scene
async function loadactors() {
  loader = new GLTFLoader();
  let gltf = await loader.loadAsync("ed.glb");
  actor1 = gltf.scene.children[0];
  actor1.traverse( (child => {
    if(child.isMesh){
      child.castShadow = true;
    }
  }))
  
  //actor1.position.set(0, 0, 0)
  animations = gltf.animations;
  scene.add(actor1);

  gltf = await loader.loadAsync("glozface.glb");
  
  actor2 = gltf.scene.children[0];
  actor2.traverse( (child => {
    if(child.isMesh){
      child.castShadow = true;
    }
  }))
  actor2.scale.set(1, 1, 1);
  actor2.position.set(2, 0, 2);
  scene.add(actor2);

}

//generates the gui and sets up the animationMixer
function createGUI( animations) {
  gui = new GUI();
  mixer = new THREE.AnimationMixer( actor1 );

	actions = {};
  let ed = actor1.getObjectByName("ED2");
  //change from expressions to singular tense
  gui.add( ed.morphTargetInfluences, 0, 0, 1, 0.01).name( 'talking shape key' );
  const clip = animations[ 0 ];
  activeAction = mixer.clipAction( clip );
  activeAction.play();


  
  gui.add(actor1.rotation, 'y', 0.01, 2* Math.PI).name("actor1 y rotation");
  gui.add(actor2.rotation, 'y', 0.01, 2* Math.PI).name("actor2 y rotation");
  gui.add(actor2.position, 'y', 0, 2, 0.1).name("actor2 y position");

  
  obj = {
    facingInfluence: 0.9,
    vertexIndex: 0,
    findBone: function() {alert(findClosestBone())},
    findVertex: function() {
      console.log(stringifyVector3(getVertexPosition(obj.vertexIndex)) + " at: " + clock.elapsedTime);
    }
  }
  gui.add(obj, 'facingInfluence', 0, 1, 0.01);
  gui.add(obj, 'vertexIndex', 0, ed.geometry.attributes.position.count-1, 1);
  gui.add(obj, 'findBone').name("Find Closest Bone");
  gui.add(obj, 'findVertex').name("Find Vertex Position");


}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

/* 
 * calculates if actor1 and actor2 are facing eachother
 * Achieved by taking the dot product of each actor with
 * the relativeDirection vector of the two actors
 * using the result of this dot product it can be determined
 * if the two actors are facing eachother, as if actor1 is facing
 * toward the relative direction from actor1 to actor2 and actor2 is
 * facing away from it (i.e. toward actor1) then it stands that the two
 * actors are facing eachother
 */
function areActorsFacingEachother() {
  const direction1 = new THREE.Vector3();
  actor1.getWorldDirection(direction1);

  const direction2 = new THREE.Vector3();
  actor2.getWorldDirection(direction2);

  //Calculate relative direction of the actors positions
  const relativeDirection = new THREE.Vector3();
  relativeDirection.subVectors(actor2.position, actor1.position);

  //Normalize all vectors
  direction1.normalize();
  direction2.normalize();
  relativeDirection.normalize();

  //Calculate the dot products
  const dotProduct1 = direction1.dot(relativeDirection);
  const dotProduct2 = direction2.dot(relativeDirection);

  // Compare dot products and return if they are facing eachother
  let scaled = obj.facingInfluence;
  return (dotProduct1 > scaled && dotProduct2 < (-1*scaled));
}

/*
 * Returns a string of the closest bone of actor1 to actor2's root bone
 */
function findClosestBone() {
  const actor2BonePosition = new THREE.Vector3();
  actor2.children[1].getWorldPosition(actor2BonePosition);
  let closestDistance = Infinity;
  let closestBone = null;

  actor1.traverse((child) => {
    if(child.isBone) {
      const distance  = child.getWorldPosition(new THREE.Vector3).distanceTo(actor2BonePosition);
      if(closestDistance > distance) {
        closestDistance = distance;
        closestBone = child;
      }
    }
  })

  return closestBone.name + " at " + stringifyVector3(closestBone.getWorldPosition(new THREE.Vector3)) 
  + "\n" + "Distance: " + closestDistance;
}

function getVertexPosition(vertexIndex) {
  let actor1Mesh = actor1.getObjectByName("ED2");
  let geometry = actor1Mesh.geometry;
  
  let position = new THREE.Vector3();
  position.fromBufferAttribute(geometry.attributes.position, vertexIndex);
  
  let skinIndices = new THREE.Vector4();
  skinIndices.fromBufferAttribute(geometry.attributes.skinIndex, vertexIndex);
  let skinWeights = new THREE.Vector4();
  skinWeights.fromBufferAttribute(geometry.attributes.skinWeight, vertexIndex);
  
  let boneMatrices = actor1Mesh.skeleton.boneMatrices;

  let morphedPosition = position.clone();

  // Apply the morph targets to the position.
  for (let i = 0; i < geometry.morphAttributes.position.length; i++) {
    let influence = actor1Mesh.morphTargetInfluences[i];
    if (influence !== 0) {
      let morphAttribute = geometry.morphAttributes.position[i];
      let morphTargetPosition = new THREE.Vector3();
      morphTargetPosition.fromBufferAttribute(morphAttribute, vertexIndex);
      morphedPosition.addScaledVector(morphTargetPosition, influence);
    }
  }

  let skinnedPosition = new THREE.Vector3();

  for (let i = 0; i < 4; i++) {
    let weight = skinWeights.getComponent(i);
    if (weight !== 0) {
      let boneMatrix = new THREE.Matrix4().fromArray(boneMatrices, skinIndices.getComponent(i) * 16);
      let transformed = morphedPosition.clone().applyMatrix4(boneMatrix);
      skinnedPosition.addScaledVector(transformed, weight);
    }
  }

  // Convert from local space to world space.
  actor1Mesh.localToWorld(skinnedPosition);
  let result = skinnedPosition;

  //update the indicator position
  vertexPoint.position.set(result.x, result.y, result.z);
  return result;  
}

//returns a string representation of THREE.Vector3, to 3 points of precision
function stringifyVector3(vector3) {
 return "(" +  vector3.x.toFixed(3) + ", " + vector3.y.toFixed(3) + ", " + vector3.z.toFixed(3) + ")";
}