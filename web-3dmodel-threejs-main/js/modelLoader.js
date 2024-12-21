import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelLoader {
    constructor(scene, loadingInfoElement) {
        this.scene = scene;
        this.loadingInfo = loadingInfoElement;
        this.loader = new GLTFLoader();
        this.collisionMeshes = [];
    }

    loadModel(glbPath) {
        this.loadingInfo.textContent = 'Loading model...';
        
        this.loader.load(
            glbPath,
            (gltf) => {
                const model = gltf.scene;

                // Center the model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);

                // Scale if needed
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 10) {
                    const scale = 10 / maxDim;
                    model.scale.set(scale, scale, scale);
                }

                // Process materials and create collision meshes
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        // Setup materials
                        if (child.material) {
                            child.material.side = THREE.DoubleSide;
                            child.material.needsUpdate = true;
                            
                            // Handle textures if they exist
                            if (child.material.map) {
                                child.material.map.colorSpace = THREE.SRGBColorSpace;
                                child.material.map.needsUpdate = true;
                            }
                        }
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // Create collision mesh
                        const collisionGeometry = child.geometry.clone();
                        const collisionMesh = new THREE.Mesh(
                            collisionGeometry,
                            new THREE.MeshBasicMaterial({ 
                                visible: false,
                                transparent: true,
                                opacity: 0
                            })
                        );

                        // Copy transforms
                        collisionMesh.position.copy(child.position);
                        collisionMesh.rotation.copy(child.rotation);
                        collisionMesh.scale.copy(child.scale);
                        collisionMesh.updateMatrix();
                        collisionMesh.updateMatrixWorld(true);

                        // Store for collision detection
                        this.collisionMeshes.push(collisionMesh);
                        this.scene.add(collisionMesh);
                    }
                });

                this.scene.add(model);
                this.loadingInfo.textContent = 'Model loaded successfully!';
                setTimeout(() => this.loadingInfo.style.display = 'none', 2000);
            },
            (xhr) => {
                if (xhr.lengthComputable) {
                    const percentComplete = (xhr.loaded / xhr.total) * 100;
                    this.loadingInfo.textContent = `Loading model: ${Math.round(percentComplete)}%`;
                }
            },
            (error) => {
                this.loadingInfo.textContent = 'Error loading model';
                console.error('GLB loading error:', error);
            }
        );
    }

    getCollisionMeshes() {
        return this.collisionMeshes;
    }
}