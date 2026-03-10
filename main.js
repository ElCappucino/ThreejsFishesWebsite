import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();

const canvas = document.getElementById("experience-canvas");
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const loader = new GLTFLoader();

loader.load( 
    "./fishes.glb", 
    function ( glb ) {
    glb.scene.traverse((child)=>{
        if (child.isMesh)
        {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
  scene.add( glb.scene );

}, undefined, function ( error ) {

  console.error( error );

} );

const sun = new THREE.DirectionalLight( 0xFFFFFF );
sun.castShadow = true;
sun.shadow.normalBias = 0.1;
sun.position.set(0, 20, 0);
scene.add( sun );

const shadowHelper = new THREE.CameraHelper( sun.shadow.camera );
scene.add( shadowHelper );
const helper = new THREE.DirectionalLightHelper( sun, 5 );
scene.add( helper );

const light = new THREE.AmbientLight( 0x404040, 3); // soft white light
scene.add( light );


const camera = new THREE.PerspectiveCamera
( 
    75, 
    sizes.width / sizes.height, 
    0.1, 
    1000 
);

const controls = new OrbitControls( camera, canvas );
controls.update();

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

camera.position.z = 5;

function handleResize()
{
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize( sizes.width, sizes.height );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

}

window.addEventListener("resize", handleResize);

function animate( time ) {

	// cube.rotation.x += 0.01;
	// cube.rotation.y += 0.01;

	renderer.render( scene, camera );

}

renderer.setAnimationLoop(animate);