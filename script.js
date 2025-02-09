let scene, camera, renderer, cube;
let canvas;
let vertexElements = [];
let svgContainer;
let fractalPlane;
let time = 0;

// Mouse/Touch tracking
const mouse = { 
    x: 0, 
    y: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    velocityY: 0
};

// Rotation speed variables
const BASE_ROTATION_SPEED = 0.004;
const BOOST_ROTATION_SPEED = 0.128 * 4; // 32x faster
let currentRotationSpeedX = BASE_ROTATION_SPEED;
let currentRotationSpeedY = BASE_ROTATION_SPEED;
let rotationBoostStartTime = 0;
const BOOST_DURATION = 500; // 0.5 seconds

// Damping and inertia variables
const DRAG_DAMPING = 0.95; // Reduces velocity over time
const MAX_VELOCITY = 0.5; // Limit maximum rotation speed
const MIN_VELOCITY = 0.0005; // Minimum velocity to keep cube slowly rotating

// Touch sensitivity adjustment
const TOUCH_SENSITIVITY = 0.003; // Lower sensitivity for touch
const MOUSE_SENSITIVITY = 0.005; // Keep original mouse sensitivity

// Quadratic easing function
function quadEaseInOut(t) {
    return t < 0.5 
        ? 2 * t * t 
        : (-2 * t * t) + (4 * t) - 1;
}

function createVertexMarker(index) {
    const marker = document.createElement('input');
    marker.type = 'text';
    marker.className = 'vertex-marker';
    marker.value = ``;
    // document.body.appendChild(marker);
    return marker;
}

function init() {
    // Get SVG container
    svgContainer = document.querySelector('.svg-container');

    // Get canvas
    canvas = document.getElementById('cubeCanvas');
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Create cube using EdgesGeometry to show only edges
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const edges = new THREE.EdgesGeometry(boxGeometry);
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    cube = new THREE.LineSegments(edges, material);
    scene.add(cube);

    // Create vertex markers
    for (let i = 0; i < 8; i++) {
        vertexElements.push(createVertexMarker(i));
    }
}

function updateVertexMarkers() {
    const vertices = cube.geometry.attributes.position.array;
    const tempVector = new THREE.Vector3();
    
    for (let i = 0; i < 8; i++) {
        // Get vertex position from original box geometry
        tempVector.set(
            (i & 1) ? 1 : -1,
            (i & 2) ? 1 : -1,
            (i & 4) ? 1 : -1
        );
        tempVector.multiplyScalar(1); // Scale to match cube size
        
        // Apply cube's transformation
        tempVector.applyMatrix4(cube.matrixWorld);
        
        // Project to screen space
        tempVector.project(camera);
        
        // Convert to screen coordinates
        const x = (tempVector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-tempVector.y * 0.5 + 0.5) * window.innerHeight;
        
        // Update marker position
        if (tempVector.z < 1) { // Only show if vertex is in front of camera
            vertexElements[i].style.transform = `translate(${x - 32}px, ${y - 32}px)`;
            vertexElements[i].style.display = 'block';
        } else {
            vertexElements[i].style.display = 'none';
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Apply inertia and damping to rotation
    if (!mouse.isDragging) {
        // Gradually reduce velocity
        mouse.velocityX *= DRAG_DAMPING;
        mouse.velocityY *= DRAG_DAMPING;

        // Add minimum velocity with small random direction
        if (Math.abs(mouse.velocityX) < MIN_VELOCITY) {
            mouse.velocityX = mouse.velocityX >= 0 ? MIN_VELOCITY : -MIN_VELOCITY;
        }
        if (Math.abs(mouse.velocityY) < MIN_VELOCITY) {
            mouse.velocityY = mouse.velocityY >= 0 ? MIN_VELOCITY : -MIN_VELOCITY;
        }
    }

    // Limit maximum rotation speed
    mouse.velocityX = Math.max(Math.min(mouse.velocityX, MAX_VELOCITY), -MAX_VELOCITY);
    mouse.velocityY = Math.max(Math.min(mouse.velocityY, MAX_VELOCITY), -MAX_VELOCITY);

    // Rotate cube based on velocity
    cube.rotation.x += mouse.velocityY;
    cube.rotation.y += mouse.velocityX;

    // Move SVG container based on rotation speed
    if (svgContainer) {
        const moveFactorX = mouse.velocityY * 50;
        const moveFactorY = mouse.velocityX * 50;

        svgContainer.style.transform = `translate(calc(-50% + ${moveFactorY}px), calc(-50% + ${moveFactorX}px))`;
    }

    cube.updateMatrixWorld();
    updateVertexMarkers();

    // Render main scene
    renderer.render(scene, camera);
}

function onMouseMove(event) {
    event.preventDefault();
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (mouse.isDragging) {
        // Calculate velocity based on mouse movement
        const deltaX = event.clientX - mouse.lastX;
        const deltaY = event.clientY - mouse.lastY;

        mouse.velocityX = deltaX * MOUSE_SENSITIVITY;
        mouse.velocityY = deltaY * MOUSE_SENSITIVITY;

        // Update last mouse position
        mouse.lastX = event.clientX;
        mouse.lastY = event.clientY;
    }
}

function onTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        
        // Normalize touch coordinates
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        if (mouse.isDragging) {
            // Calculate velocity based on touch movement
            const deltaX = touch.clientX - mouse.lastX;
            const deltaY = touch.clientY - mouse.lastY;

            mouse.velocityX = deltaX * TOUCH_SENSITIVITY;
            mouse.velocityY = deltaY * TOUCH_SENSITIVITY;

            // Update last touch position
            mouse.lastX = touch.clientX;
            mouse.lastY = touch.clientY;
        }
    }
}

function onMouseDown(event) {
    event.preventDefault();
    // Start dragging
    mouse.isDragging = true;
    mouse.lastX = event.clientX;
    mouse.lastY = event.clientY;
    
    // Reset velocities
    mouse.velocityX = 0;
    mouse.velocityY = 0;
}

function onTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        // Start dragging
        mouse.isDragging = true;
        mouse.lastX = touch.clientX;
        mouse.lastY = touch.clientY;
        
        // Reset velocities
        mouse.velocityX = 0;
        mouse.velocityY = 0;
    }
}

function onMouseUp(event) {
    event.preventDefault();
    // Stop dragging
    mouse.isDragging = false;
}

function onTouchEnd(event) {
    event.preventDefault();
    // Stop dragging
    mouse.isDragging = false;
}

function onMouseClick() {
    // Start the rotation boost
    rotationBoostStartTime = performance.now();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Event Listeners
window.addEventListener('mousemove', onMouseMove, { passive: false });
window.addEventListener('mousedown', onMouseDown, { passive: false });
window.addEventListener('mouseup', onMouseUp, { passive: false });
window.addEventListener('mouseleave', onMouseUp, { passive: false });
window.addEventListener('click', onMouseClick);

// Touch event listeners
window.addEventListener('touchstart', onTouchStart, { passive: false });
window.addEventListener('touchmove', onTouchMove, { passive: false });
window.addEventListener('touchend', onTouchEnd, { passive: false });
window.addEventListener('touchcancel', onTouchEnd, { passive: false });

window.addEventListener('resize', onWindowResize);

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
}); 