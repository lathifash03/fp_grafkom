import * as THREE from 'three';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export class ModelLoader {
    constructor(scene, loadingInfoElement) {
        this.scene = scene;
        this.loadingInfo = loadingInfoElement;
        
        this.mtlLoader = new MTLLoader();
        this.objLoader = new OBJLoader();
    }

    loadModel(mtlPath, objPath) {
        this.loadingInfo.textContent = 'Loading materials...';
        
        this.mtlLoader.setMaterialOptions({
            side: THREE.DoubleSide,
            wrap: THREE.ClampToEdgeWrapping
        });

        this.mtlLoader.load(
            mtlPath,
            (materials) => {
                materials.preload();
                
                // Configure all materials
                Object.values(materials.materials).forEach(material => {
                    // Convert basic materials to standard materials for better rendering
                    if (material instanceof THREE.MeshBasicMaterial) {
                        const standardMat = new THREE.MeshStandardMaterial({
                            color: material.color,
                            map: material.map,
                            side: THREE.DoubleSide,
                            roughness: 0.7,
                            metalness: 0.3
                        });
                        Object.assign(material, standardMat);
                    }
                    
                    material.side = THREE.DoubleSide;
                    material.wireframe = false;
                    material.needsUpdate = true;

                    if (material.map) {
                        material.map.colorSpace = THREE.SRGBColorSpace;
                        material.map.needsUpdate = true;
                    }
                });

                this.objLoader.setMaterials(materials);
                this.loadOBJ(objPath);
            },
            (xhr) => {
                if (xhr.lengthComputable) {
                    const percentComplete = (xhr.loaded / xhr.total) * 100;
                    this.loadingInfo.textContent = `Loading materials: ${Math.round(percentComplete)}%`;
                }
            },
            (error) => {
                this.loadingInfo.textContent = 'Error loading materials';
                console.error('MTL loading error:', error);
                this.loadOBJ(objPath);
            }
        );
    }

    loadOBJ(objPath) {
        this.objLoader.load(
            objPath,
            (object) => {
                // Center the object
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                object.position.sub(center);

                // Scale if needed
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 10) {
                    const scale = 10 / maxDim;
                    object.scale.set(scale, scale, scale);
                }

                // Process all meshes
                object.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        // Create default material if none exists
                        if (!child.material) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x808080,
                                roughness: 0.7,
                                metalness: 0.3,
                                side: THREE.DoubleSide
                            });
                        }

                        // Handle both single and multiple materials
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        
                        materials.forEach(material => {
                            if (material instanceof THREE.MeshBasicMaterial) {
                                const standardMat = new THREE.MeshStandardMaterial({
                                    color: material.color,
                                    map: material.map,
                                    side: THREE.DoubleSide,
                                    roughness: 0.7,
                                    metalness: 0.3
                                });
                                Object.assign(material, standardMat);
                            }
                            
                            material.wireframe = false;
                            material.side = THREE.DoubleSide;
                            material.needsUpdate = true;

                            if (material.map) {
                                material.map.colorSpace = THREE.SRGBColorSpace;
                                material.map.needsUpdate = true;
                            }
                        });

                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.scene.add(object);
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
                console.error('OBJ loading error:', error);
            }
        );
    }
}