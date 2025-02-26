import * as THREE from 'three';

// Create a simple scene with two spheres
class SimpleScene {
    constructor() {
        this.init();
        this.createShaderMaterial();
        this.createSpheres();
        this.render();
    }

    init() {
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        document.body.appendChild(this.renderer.domElement);

        // Setup scene
        this.scene = new THREE.Scene();
        
        // Setup camera - positioned to view both spheres
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.z = 5;
        
        // Add some light
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        this.scene.add(light);
        
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createSpheres() {
        // Create two spheres of the same size
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        
        // Create meshes using the shader material
        this.sphere1 = new THREE.Mesh(geometry, this.shaderMaterial);
        this.sphere2 = new THREE.Mesh(geometry, this.shaderMaterial);
        
        // Position spheres near each other
        this.sphere1.position.x = -1.5;
        this.sphere2.position.x = 1.5;
        
        // Add to scene
        this.scene.add(this.sphere1);
        this.scene.add(this.sphere2);
    }

    createShaderMaterial() {
        // Basic placeholder vertex shader
        const vertexShader = `
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        // Basic placeholder fragment shader
        const fragmentShader = `
            void main() {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            }
        `;

        // Create a shader material and make it available for the spheres
        this.shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            blending: THREE.NormalBlending
        });
    }

    render() {
        // Set up animation loop instead of rendering once
        const animate = () => {
            requestAnimationFrame(animate);
            this.renderer.render(this.scene, this.camera);
        };
        
        // Start the animation loop
        animate();
    }
}

// Initialize the scene when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new SimpleScene();
});
