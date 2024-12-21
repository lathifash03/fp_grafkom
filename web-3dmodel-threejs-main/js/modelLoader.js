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
        
        this.mtlLoader.load(
            mtlPath,
            (materials) => {
                materials.preload();
                this.loadOBJ(objPath, materials);
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
            }
        );
    }

    loadOBJ(objPath, materials) {
        this.objLoader.setMaterials(materials);

        this.objLoader.load(
            objPath,
            (object) => {
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                object.position.sub(center);

                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 10) {
                    const scale = 10 / maxDim;
                    object.scale.set(scale, scale, scale);
                }

                object.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
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