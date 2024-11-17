import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

import WebGPU from 'three/addons/capabilities/WebGPU.js';

const pixelResolution = 256;

let camera, scene, renderer, aspectResolution;

if (WebGPU.isAvailable()) {
  
  init();
  render();

} else {
  
  const warning = WebGPU.getErrorMessage();
  document.getElementById( 'container' ).appendChild( warning );

}

function init() {

  aspectResolution = window.innerWidth / window.innerHeight;

  renderer = new THREE.WebGPURenderer( { antialias: false } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( Math.min(window.innerWidth, pixelResolution * aspectResolution), Math.min(window.innerHeight, pixelResolution), false );
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1;
  document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 45, aspectResolution, 1, 2000 );
  camera.position.set( 0, 5, 0 );

  const environment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator( renderer );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xbbbbbb );
  scene.environment = pmremGenerator.fromScene( environment ).texture;
  environment.dispose();

  const grid = new THREE.GridHelper( 500, 10, 0xffffff, 0xffffff );
  grid.material.opacity = 0.5;
  grid.material.depthWrite = false;
  grid.material.transparent = true;
  scene.add( grid );

  const light = new THREE.AmbientLight();
  scene.add( light );

  const maxAnisotropy = renderer.getMaxAnisotropy();
  console.log(maxAnisotropy);
  const loader = new GLTFLoader().setPath( './models/gltf/' );
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

  const controls = new OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'change', render );
  controls.update();

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

  aspectResolution = window.innerWidth / window.innerHeight;
  camera.aspect = aspectResolution;
  camera.updateProjectionMatrix();

  renderer.setSize( Math.min(window.innerWidth, pixelResolution * aspectResolution), Math.min(window.innerHeight, pixelResolution), false );

  render();

}

function render() {

  renderer.render( scene, camera );

}