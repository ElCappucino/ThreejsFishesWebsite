import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = null;

const canvas = document.getElementById("experience-canvas");
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
renderer.setClearColor(0x000000, 0);
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const loader = new GLTFLoader();


let model = null;
let mixer = null;

loader.load( 
    "./models/capoo.glb", 
    function ( glb ) {

        
        model = glb.scene;
        model.animations = glb.animations;
        
        scene.add( model );
        model.rotation.y = -Math.PI / 4;
        model.traverse((child)=>{
            if (child.isMesh)
            {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

    }, undefined, function ( error ) {

  console.error( error );

} );

const sun = new THREE.DirectionalLight( 0xFFFFFF );
sun.castShadow = true;
sun.shadow.normalBias = 0.1;
sun.position.set(0, 20, 0);
scene.add( sun );

const light = new THREE.AmbientLight( 0x404040, 3); // soft white light
scene.add( light );

const camera = new THREE.PerspectiveCamera
( 
    75, 
    sizes.width / sizes.height, 
    0.1, 
    1000 
);

const listener = new THREE.AudioListener();
camera.add( listener );
const sound = new THREE.Audio( listener );

const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'sounds/pop1.mp3', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setVolume( 0.5 );
	
});


const controls = new OrbitControls( camera, canvas );

controls.update();

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

//const soundTrigger = document.getElementById('sound-trigger');
const modelTrigger = document.getElementById('model-trigger');
//const soundMenuPanel = document.getElementById('sound-menu-panel');
const modelMenuPanel = document.getElementById('model-menu-panel');

// soundTrigger
// Toggle the menu
// soundTrigger.addEventListener('click', (e) => {
//     e.stopPropagation(); // Prevents clicking through to the 3D model
//     soundMenuPanel.classList.toggle('hidden');
//     modelMenuPanel.classList.add('hidden');
// });

// // Close menu if clicking outside on the canvas
// window.addEventListener('click', (e) => {
//     if (!soundMenuPanel.contains(e.target) && e.target !== soundTrigger) {
//         soundMenuPanel.classList.add('hidden');
//     }
// });

// Sound Selection Logic
document.querySelectorAll('.sound-item').forEach(item => {
    item.addEventListener('click', () => {
        const soundPath = item.getAttribute('data-sound');
        
        // Load the new buffer
        audioLoader.load(soundPath, (buffer) => {
            sound.setBuffer(buffer);
            
            // Visual feedback: remove active from others, add to this
            document.querySelectorAll('.sound-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
});

// Model Trigger
// Toggle the menu
modelTrigger.addEventListener('click', (e) => {
    e.stopPropagation(); 
    modelMenuPanel.classList.toggle('hidden');
    //soundMenuPanel.classList.add('hidden');
});

// Close menu if clicking outside on the canvas
window.addEventListener('click', (e) => {
    if (!modelMenuPanel.contains(e.target) && e.target !== modelTrigger) {
        modelMenuPanel.classList.add('hidden');
    }
});

document.querySelectorAll('.model-item').forEach(item => {
    item.addEventListener('click', () => {
        const path = item.getAttribute('data-model');
        const soundPath = item.getAttribute('data-sound');
        
        // Load the new buffer
        audioLoader.load(soundPath, (buffer) => {
            sound.setBuffer(buffer);
            
            // Visual feedback: remove active from others, add to this
            document.querySelectorAll('.sound-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
        if (model) {
            scene.remove(model);
        }
        
        loader.load(path, (glb) => {
            
            
            model = glb.scene;
            model.animations = glb.animations;
            model.rotation.y = -Math.PI / 4;

            console.log("Animations found:", glb.animations);
    
            if (glb.animations.length > 0) {
                glb.animations.forEach((clip, index) => {
                    console.log(`Animation ${index}: ${clip.name}`);
                });
            } else {
                console.warn("This model has NO animations!");
            }

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

             if (glb.animations && glb.animations.length) {
                mixer = new THREE.AnimationMixer(model);
            }

            scene.add(model);
            document.querySelectorAll('.model-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        }, undefined, (error) => console.error(error));
    });
});



const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
    if (event.target.closest('#side-nav') || 
        event.target.closest('#sound-menu-panel') || 
        event.target.closest('#model-menu-panel')) {
        return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (!model) return;

    const intersects = raycaster.intersectObject(model, true);

    if (intersects.length > 0) {

        
        console.log("model.animations.length:", model.animations.length);

        if (mixer && model.animations && model.animations.length > 0) {
            const action = mixer.clipAction(model.animations[0]);
            
            action.stop(); 
            action.setLoop(THREE.LoopOnce); 
            action.clampWhenFinished = true; 
            action.play();
        }
        else
        {
            startSquash();
        }

        if (sound.isPlaying) sound.stop();
        sound.play();
    }
});

let lastTime = 0;

let squashTime = 0;
let isSquashing = false;
const squashDuration = 0.3;


function easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;

    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function startSquash(){
    squashTime = 0;
    isSquashing = true;
}

function animate( time ) {
    
	const delta = (time - lastTime) / 1000;
    lastTime = time;

    if (mixer) {
        mixer.update(delta);
    }

    if (isSquashing && model) {

        squashTime += delta;
        let t = squashTime / squashDuration;

        if (t >= 1) {
            t = 1;
            isSquashing = false;
        }

        const e = easeOutBack(t);

        const squash = Math.sin(e * Math.PI) * 0.35;

        const scaleX = 1 + squash;
        const scaleY = 1 - squash;
        const scaleZ = 1 + squash;

        model.scale.set(scaleX, scaleY, scaleZ);
    }

    renderer.render(scene, camera);

}

renderer.setAnimationLoop(animate);

