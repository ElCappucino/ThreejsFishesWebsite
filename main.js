import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();

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

let currentAnimationIndex = 0;

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
	sound.setVolume( 1.0 );
	
});

const controls = new OrbitControls( camera, canvas );
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;
controls.update();
camera.position.z = 5;



let transitionState = "IDLE"; // IDLE, EXITING, ENTERING
let pendingModelPath = null;
let t_transition = 0;
let currentRotation = 0;
let targetRotationTransition = 0;
const rotationThreshold = THREE.MathUtils.degToRad(360);
const transitionSpeed = 0.01; // Speed of the slide
const exitThreshold = -8;     // How far down the model goes before disappearing
const targetY = 0;            // The original resting Y position

// function ----------------------------------------------------------------------

function triggerFireworkBurst() {
    if (!model) return;

    const particleCount = 3; // Number of small Capoos to launch
    const gravity = -0.01;   // How fast they fall

    for (let i = 0; i < particleCount; i++) {

        const particle = model.clone();
        
        particle.scale.set(0.2, 0.2, 0.2);
        particle.position.copy(model.position);
        particle.position.y += 0.5;
        
        scene.add(particle);

        const velocity = {
            x: (Math.random() - 0.5) * 0.2,
            y: Math.random() * 0.2 + 0.1,
            z: (Math.random() - 0.5) * 0.2
        };

        // Opacity/Life tracker
        let life = 1.0;

        function animateParticle() {
            // Apply velocity to position
            particle.position.x += velocity.x;
            particle.position.y += velocity.y;
            particle.position.z += velocity.z;

            // Apply gravity to Y velocity
            velocity.y += gravity;

            // Rotate them randomly for a "tumbling" effect
            particle.rotation.x += 0.1;
            particle.rotation.y += 0.1;

            // Fade out
            life -= 0.02;
            
            // Traverse to change opacity of all meshes in the clone
            particle.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone(); // Clone material to avoid fading original
                    child.material.transparent = true;
                    child.material.opacity = life;
                }
            });

            if (life > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                scene.remove(particle);
                // Clean up geometries and materials
                particle.traverse((child) => {
                    if (child.isMesh) {
                        child.geometry.dispose();
                        child.material.dispose();
                    }
                });
            }
        }
        animateParticle();
    }
}



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
            pendingModelPath = path; // Store the next model to load
            transitionState = "EXITING"; // Let the animate loop slide it down
            t_transition = 0;
            currentRotation = model.rotation.y;
            targetRotationTransition = currentRotation + rotationThreshold;
        } else {
            loadNewModel(path);
        }
        
    });
});

function loadNewModel(path) {
    loader.load(path, (glb) => {
            
        model = glb.scene;
        model.animations = glb.animations;
        model.rotation.y = -Math.PI / 4;
        model.position.y = exitThreshold;
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
        transitionState = "ENTERING";
        t_transition = 0;
        currentRotation = model.rotation.y;
        targetRotationTransition = currentRotation + rotationThreshold;
        document.querySelectorAll('.model-item').forEach(i => i.classList.remove('active'));

    }, undefined, (error) => console.error(error));
}
function playNextAnimation() {
    if (!model || !mixer || !model.animations || model.animations.length == 0) {
        startSquash();
        triggerFireworkBurst();

        if (sound.isPlaying) sound.stop();
        sound.play();
        return;
    }

    mixer.stopAllAction();

    // Increment and wrap around
    currentAnimationIndex = (currentAnimationIndex + 1) % model.animations.length;
    console.log("Playing animation index:", currentAnimationIndex);

    const action = mixer.clipAction(model.animations[currentAnimationIndex]);
    
    action.stop(); 
    action.setLoop(THREE.LoopOnce); 
    action.clampWhenFinished = true; 
    action.play();

    if (sound.isPlaying) sound.stop();
    sound.play();
}

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

        
        playNextAnimation();
    }
});

window.addEventListener('keydown', function (e) {
    if (e.code === 'Space') {
        // Prevent default spacebar action (scrolling down)
        e.preventDefault();
        
        playNextAnimation();
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

function easeOutSine(x)  {
  return Math.sin((x * Math.PI) / 2);
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

    if (model) {

        if (transitionState === "EXITING") {
            t_transition = Math.min(t_transition + transitionSpeed, 1);
            const eased = easeOutSine(t_transition);

            model.position.y = targetY + (exitThreshold - targetY) * eased;
            model.rotation.y = currentRotation + (targetRotationTransition - currentRotation) * eased;
            if (model.position.y <= exitThreshold) {
                // Once fully out of scene, remove and load new one
                scene.remove(model);
                loadNewModel(pendingModelPath);
                transitionState = "LOADING"; 
            }
        } else if (transitionState === "ENTERING") {
            t_transition = Math.min(t_transition + transitionSpeed, 1);
            const eased = easeOutSine(t_transition);

            model.position.y = exitThreshold + (targetY - exitThreshold) * eased;
            model.rotation.y = currentRotation + (targetRotationTransition - currentRotation) * eased;
            if (model.position.y >= targetY) {
                model.position.y = targetY; // Snap to center
                transitionState = "IDLE";
            }
        }

        if (isSquashing)
        {
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
        
    }

    renderer.render(scene, camera);

}

renderer.setAnimationLoop(animate);

