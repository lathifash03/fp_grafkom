import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);
        
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupFirstPersonControls();
        
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, -1.7, 0);
        
        // Create a camera holder to handle rotation properly
        this.cameraHolder = new THREE.Object3D();
        this.cameraHolder.position.copy(this.camera.position);
        this.scene.add(this.cameraHolder);
        this.cameraHolder.add(this.camera);
        
        // Reset camera position relative to holder
        this.camera.position.set(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        document.body.appendChild(this.renderer.domElement);
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Additional point lights for better gallery illumination
        const pointLight1 = new THREE.PointLight(0xffffff, 0.5);
        pointLight1.position.set(-5, 3, -5);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
        pointLight2.position.set(5, 3, 5);
        this.scene.add(pointLight2);
    }

    setupFirstPersonControls() {
        this.moveSpeed = 0.05;
        this.rotationSpeed = 0.002;
        this.moveState = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        // Initialize rotation values
        this.rotation = {
            x: 0,
            y: 0
        };

        document.addEventListener('keydown', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w': this.moveState.forward = true; break;
                case 's': this.moveState.backward = true; break;
                case 'a': this.moveState.left = true; break;
                case 'd': this.moveState.right = true; break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w': this.moveState.forward = false; break;
                case 's': this.moveState.backward = false; break;
                case 'a': this.moveState.left = false; break;
                case 'd': this.moveState.right = false; break;
            }
        });

        // Mouse look control
        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === this.renderer.domElement) {
                // Update rotation values
                this.rotation.y -= event.movementX * this.rotationSpeed;
                this.rotation.x -= event.movementY * this.rotationSpeed;

                // Limit vertical rotation
                this.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation.x));

                // Apply rotation to camera holder
                this.cameraHolder.rotation.y = this.rotation.y;
                this.camera.rotation.x = this.rotation.x;
            }
        });

        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
        });
    }

    updateMovement() {
        if (this.moveState.forward || this.moveState.backward || this.moveState.left || this.moveState.right) {
            // Get forward direction from camera holder
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.cameraHolder.quaternion);
            direction.y = 0; // Keep movement horizontal
            direction.normalize();

            // Get right direction
            const right = new THREE.Vector3(1, 0, 0);
            right.applyQuaternion(this.cameraHolder.quaternion);
            right.normalize();

            // Apply movement
            if (this.moveState.forward) {
                this.cameraHolder.position.addScaledVector(direction, this.moveSpeed);
            }
            if (this.moveState.backward) {
                this.cameraHolder.position.addScaledVector(direction, -this.moveSpeed);
            }
            if (this.moveState.left) {
                this.cameraHolder.position.addScaledVector(right, -this.moveSpeed);
            }
            if (this.moveState.right) {
                this.cameraHolder.position.addScaledVector(right, this.moveSpeed);
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.updateMovement();
        this.renderer.render(this.scene, this.camera);
    }
}