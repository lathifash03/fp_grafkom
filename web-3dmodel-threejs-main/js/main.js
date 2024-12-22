import { SceneManager } from './sceneSetup.js';
import { ModelLoader } from './modelLoader.js';

document.addEventListener('DOMContentLoaded', () => {
    const sceneManager = new SceneManager();
    
    const modelLoader = new ModelLoader(
        sceneManager.scene,
        document.getElementById('loading-info')
    );

  
    modelLoader.loadModel('./models/gallery.glb');

    
    sceneManager.setCollisionMeshes(modelLoader.getCollisionMeshes());

    sceneManager.animate();
});