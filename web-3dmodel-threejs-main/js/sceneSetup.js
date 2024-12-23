import * as THREE from 'three';
import { EXRLoader } from '../../node_modules/three/examples/jsm/loaders/EXRLoader.js';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);
        
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupFirstPersonControls();
        this.loadEnvironmentTexture();
        this.setupBackgroundMusic();
        
        this.collisionMeshes = [];
        this.raycaster = new THREE.Raycaster();
        this.playerRadius = 0.5; // Collision radius
        
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, -1.9, 4);
        
        this.cameraHolder = new THREE.Object3D();
        this.cameraHolder.position.copy(this.camera.position);
        this.scene.add(this.cameraHolder);
        this.cameraHolder.add(this.camera);
        
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
        document.body.appendChild(this.renderer.domElement);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        const pointLight1 = new THREE.PointLight(0xffffff, 0.5);
        pointLight1.position.set(-5, 3, -5);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
        pointLight2.position.set(5, 3, 5);
        this.scene.add(pointLight2);
    }
    

loadEnvironmentTexture() {
    const loader = new EXRLoader();
    loader.load(
        './models/mud_road_puresky_4k.exr', 
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
            this.scene.environment = texture;
        },
        undefined,
        (error) => {
            console.error('Error loading environment texture:', error);
        }
    );
}

    setCollisionMeshes(meshes) {
        this.collisionMeshes = meshes;
    }

    checkCollision(position) {
        
        const directions = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(1, 0, 1).normalize(),
            new THREE.Vector3(-1, 0, 1).normalize(),
            new THREE.Vector3(1, 0, -1).normalize(),
            new THREE.Vector3(-1, 0, -1).normalize()
        ];

        for (let direction of directions) {
            this.raycaster.set(position, direction);
            const intersects = this.raycaster.intersectObjects(this.collisionMeshes);
            
            if (intersects.length > 0 && intersects[0].distance < this.playerRadius) {
                return true; // Collision detected
            }
        }
        return false; // No collision
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

        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === this.renderer.domElement) {
                this.rotation.y -= event.movementX * this.rotationSpeed;
                this.rotation.x -= event.movementY * this.rotationSpeed;
                this.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation.x));
                
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
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.cameraHolder.quaternion);
            direction.y = 0;
            direction.normalize();

            const right = new THREE.Vector3(1, 0, 0);
            right.applyQuaternion(this.cameraHolder.quaternion);
            right.normalize();

            const newPosition = this.cameraHolder.position.clone();

            if (this.moveState.forward) {
                newPosition.addScaledVector(direction, this.moveSpeed);
            }
            if (this.moveState.backward) {
                newPosition.addScaledVector(direction, -this.moveSpeed);
            }
            if (this.moveState.left) {
                newPosition.addScaledVector(right, -this.moveSpeed);
            }
            if (this.moveState.right) {
                newPosition.addScaledVector(right, this.moveSpeed);
            }

            // Only update position if there's no collision
            if (!this.checkCollision(newPosition)) {
                this.cameraHolder.position.copy(newPosition);
            }
        }
    }

    setupBackgroundMusic() {
        const listener = new THREE.AudioListener();
        this.camera.add(listener);

        this.backgroundMusic = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('./audio/background-music.m4a', (buffer) => {
            this.backgroundMusic.setBuffer(buffer);
            this.backgroundMusic.setLoop(true);
            this.backgroundMusic.setVolume(0.5);
            this.backgroundMusic.play();
        });

        // Add toggle music control
        this.musicPlaying = true;
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'm') {
                this.toggleMusic();
            }
        });
    }
    
    toggleMusic() {
        if (this.musicPlaying) {
            this.backgroundMusic.pause();
        } else {
            this.backgroundMusic.play();
        }
        this.musicPlaying = !this.musicPlaying;
    }

    setCollisionMeshes(meshes) {
        this.collisionMeshes = meshes;
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