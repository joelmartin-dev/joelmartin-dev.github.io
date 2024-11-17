import * as THREE from 'three/webgpu';
//import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

import WebGPU from 'three/addons/capabilities/WebGPU.js';

const pixelResolution = 256;
const moveSpeed = 50.0;

let camera, scene, renderer, aspectResolution, controls;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

if (WebGPU.isAvailable()) {
  
  init();
  render();

} else {
  
  const warning = WebGPU.getErrorMessage();
  document.getElementById( 'container' ).appendChild( warning );

}

function init() {

  aspectResolution = window.innerWidth / window.innerHeight;

  camera = new THREE.PerspectiveCamera( 45, aspectResolution, 1, 2000 );
  camera.position.set( 0, 5, 0 );

  const environment = new RoomEnvironment();

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xbbbbbb );
  environment.dispose();

  const grid = new THREE.GridHelper( 500, 10, 0xffffff, 0xffffff );
  grid.material.opacity = 0.5;
  grid.material.depthWrite = false;
  grid.material.transparent = true;
  scene.add( grid );

  const light = new THREE.AmbientLight();
  scene.add( light );

  controls = new PointerLockControls( camera, document.body );
  document.body.addEventListener( 'click', function () {
    controls.lock();
  });
  
  controls.addEventListener( 'change', render );
  controls.update();

  scene.add(controls.object);

  const onKeyDown = function ( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;

      case 'KeyQ':
        moveUp = true;
        break;

      case 'KeyE':
        moveDown = true;
        break;

    }

  };

  const onKeyUp = function ( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;

      case 'KeyQ':
        moveUp = false;
        break;
      
      case 'KeyE':
        moveDown = false;
        break;
    }

  };

  document.addEventListener( 'keydown', onKeyDown );
  document.addEventListener( 'keyup', onKeyUp );

  renderer = new THREE.WebGPURenderer( { antialias: false } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( Math.min(window.innerWidth, pixelResolution * aspectResolution), Math.min(window.innerHeight, pixelResolution), false );
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setAnimationLoop( animate );
  document.body.appendChild( renderer.domElement );

  const maxAnisotropy = renderer.getMaxAnisotropy();
  const loader = new GLTFLoader().setPath( 'models/gltf/' );
  loader.load( 'sponza/Sponza.gltf', function ( gltf ) {

    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        const m = child;
        m.material.map.anisotropy = maxAnisotropy;
        //m.material.map.minFilter = THREE.NearestMipMapNearestFilter;
      }
    });
    scene.add( gltf.scene );

    render();
  }, undefined, function ( error ) {
    console.log( error );
  } );

  window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {

  aspectResolution = window.innerWidth / window.innerHeight;
  camera.aspect = aspectResolution;
  camera.updateProjectionMatrix();

  renderer.setSize( Math.min(window.innerWidth, pixelResolution * aspectResolution), Math.min(window.innerHeight, pixelResolution), false );

  render();

}

function animate() {
  const time = performance.now();

  if ( controls.isLocked === true ) {
    const delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= velocity.y * 10.0 * delta;

    direction.z = Number( moveForward ) - Number( moveBackward );
    direction.x = Number( moveRight ) - Number( moveLeft );
    direction.y = Number( moveUp ) - Number( moveDown );
    direction.normalize(); // this ensures consistent movements in all directions

    if ( moveForward || moveBackward ) velocity.z -= direction.z * moveSpeed * delta;
    if ( moveLeft || moveRight ) velocity.x -= direction.x * moveSpeed * delta;
    if ( moveUp || moveDown ) velocity.y -= direction.y * moveSpeed * delta;

    controls.moveRight( - velocity.x * delta );
    controls.moveForward( - velocity.z * delta );

    controls.object.position.y -= ( velocity.y * delta );
  }

  prevTime = time;

  render();
}

function render() {

  renderer.render( scene, camera );

}