import * as THREE from 'three';

// Initialize variables at module level
let scene, camera, renderer, material, plane, geometry, balls, animationId;
const baseSpeed = 0.001;
const resolution = 1 / 2;

// Setup function that initializes Three.js scene
function setupScene(canvasElement) {
    if (!canvasElement) return;

    const WIDTH = canvasElement.clientWidth;
    const HEIGHT = canvasElement.clientHeight;
    
    // Create scene, camera, and renderer
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    camera.position.z = 1;

    renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        antialias: false
    });
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Create a plane that fills the screen
    geometry = new THREE.PlaneGeometry(2, 2);

    balls = [];

    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * 2 * Math.PI;
        balls.push({
            position: new THREE.Vector2(
                Math.random() * 2 - 1, // Random x between -1 and 1
                Math.random() * 2 - 1  // Random y between -1 and 1
            ),
            angle: angle,
            velocity: new THREE.Vector2(baseSpeed * Math.cos(angle), baseSpeed * Math.sin(angle)),
            radius: Math.random() * 0.4 + 0.05 // Random radius between 0.05 and 0.3
        });
    }

    // Define vertex and fragment shaders
    const vertexShader = `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        #define COLOR_DEPTH 1.
        #define BALLS ${balls.length}
        #define THRESHOLD ${balls.length - 7}.

        uniform float time;
        uniform vec2 resolution;

        uniform vec2 ballPositions[BALLS];
        uniform float ballRadii[BALLS];

        uniform vec3 foregroundColor;
        uniform vec3 backgroundColor;

        const int bayerMatrix[64] = int[64](
            0, 32, 8, 40, 2, 34, 10, 42,
            48, 16, 56, 24, 50, 18, 58, 26,
            12, 44, 4, 36, 14, 46, 6, 38,
            60, 28, 52, 20, 62, 30, 54, 22,
            3, 35, 11, 43, 1, 33, 9, 41,
            51, 19, 59, 27, 49, 17, 57, 25,
            15, 47, 7, 39, 13, 45, 5, 37,
            63, 31, 55, 23, 61, 29, 53, 21
        );

        float getBayerThreshold(vec2 pixelCoord) {
            int x = int(mod(pixelCoord.x, 8.0));
            int y = int(mod(pixelCoord.y, 8.0));
            int index = y * 8 + x;
            return float(bayerMatrix[index]) / 64.0;
        }

        vec3 dither(vec3 color, vec2 pixelCoord) {
            // Get threshold from Bayer matrix
            float threshold = getBayerThreshold(pixelCoord);

            // Calculate the number of color levels based on bit depth
            float levels = pow(2.0, COLOR_DEPTH) - 1.0;

            // Apply dithering to each color channel
            vec3 result;
            result.r = floor(color.r * levels + threshold) / levels;
            result.g = floor(color.g * levels + threshold) / levels;
            result.b = floor(color.b * levels + threshold) / levels;

            return result;
        }

        // Convert from linear space to sRGB space (gamma correction)
        vec3 linearToSRGB(vec3 linearColor) {
            return pow(linearColor, vec3(1.0/2.2));
        }

        void main() {
            vec2 uv = -1. + 2. *gl_FragCoord.xy / resolution.xy;
            uv.x *= resolution.x / resolution.y;

            float sum = 0.;

            for (int i = 0; i < BALLS; i++) {
                vec2 ballPosition = ballPositions[i];
                float ballRadius = ballRadii[i];

                float distance = length(uv - ballPosition);

                sum += ballRadius / distance;
            }

            float threshold = smoothstep(THRESHOLD, THRESHOLD - 1., sum);
            vec2 pixelCoord = gl_FragCoord.xy;
            vec3 ditheredColor = dither(vec3(threshold, threshold, threshold), pixelCoord);

            // since it's monochrome, we can just use the red channel
            float color = ditheredColor.r;

            // Convert from linear to sRGB before output
            vec3 srgbColor = linearToSRGB(mix(foregroundColor, backgroundColor, color));
            gl_FragColor = vec4(srgbColor, 1.);
        }
    `;

    // Create shader material
    material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            time: { value: 0.0 },
            resolution: { value: new THREE.Vector2(WIDTH, HEIGHT) },
            ballPositions: { value: balls.map(ball => ball.position) },
            ballRadii: { value: balls.map(ball => ball.radius) },
            foregroundColor: { value: new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--primary-color')) },
            backgroundColor: { value: new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--background-color')) },
        },
    });

    console.log(material.uniforms);

    handleResize();

    // Create mesh with geometry and material
    plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Start animation
    animate();
}

function handleResize() {
    if (!renderer) return;
    
    const canvasElement = document.querySelector('.canvas-1');
    if (!canvasElement) return;
    
    const WIDTH = canvasElement.clientWidth;
    const HEIGHT = canvasElement.clientHeight;
    
    renderer.setSize(WIDTH * resolution, HEIGHT * resolution, false);
    if (material && material.uniforms) {
        material.uniforms.resolution.value.x = WIDTH * resolution;
        material.uniforms.resolution.value.y = HEIGHT * resolution;
    }
}

// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (!material || !material.uniforms || !balls) return;
    
    // Update time uniform
    material.uniforms.time.value += 0.01;

    // Update ball positions based on velocity, then update velocity based on sine waves
    balls.forEach(ball => {
        ball.position.x += ball.velocity.x;
        ball.position.y += ball.velocity.y;

        if (ball.position.x < -1 || ball.position.x > 1) {
            ball.velocity.x *= -1;
        }
        if (ball.position.y < -1 || ball.position.y > 1) {
            ball.velocity.y *= -1;
        }

        balls.forEach(otherBall => {
            if (ball === otherBall) return;

            const dx = otherBall.position.x - ball.position.x;
            const dy = otherBall.position.y - ball.position.y;
            // const distance = ball.position.distanceTo(otherBall.position);
            const distance = Math.hypot(dx, dy);

            ball.velocity.x += dx / (200000 * distance ** 1);
            ball.velocity.y += dy / (200000 * distance ** 1);

            const s = Math.hypot(ball.velocity.x, ball.velocity.y);
            const f = Math.pow(2, -1 * Math.pow(s, 2) / 500000);

            ball.velocity.x *= f;
            ball.velocity.y *= f;
        });
    });
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Function to clean up resources
function cleanup() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    if (renderer) {
        renderer.dispose();
        renderer = null;
    }
    
    if (material) {
        material.dispose();
        material = null;
    }
    
    if (geometry) {
        geometry.dispose();
        geometry = null;
    }
    
    scene = null;
    camera = null;
    balls = null;
    plane = null;
}

// Event listener for canvas creation
document.addEventListener('canvasCreated', (event) => {
    // Check if the created canvas is the one we're looking for
    if (event.detail.canvasClass === 'canvas-1') {
        // First cleanup any existing setup
        cleanup();
        
        // Wait a bit for the DOM to update
        setTimeout(() => {
            const canvasElement = document.querySelector('.canvas-1');
            if (canvasElement) {
                setupScene(canvasElement);
            }
        }, 50);
    }
});

// Handle window resizing
window.addEventListener('resize', handleResize);

// Initial check for canvas on page load
window.addEventListener('DOMContentLoaded', () => {
    const canvasElement = document.querySelector('.canvas-1');
    if (canvasElement) {
        setupScene(canvasElement);
    }
});

// Check if we already have the canvas (might have been created before this script loaded)
const existingCanvas = document.querySelector('.canvas-1');
if (existingCanvas) {
    setupScene(existingCanvas);
} 