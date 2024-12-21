import { SceneManager } from './sceneSetup.js';
import { ModelLoader } from './modelLoader.js';

document.addEventListener('DOMContentLoaded', () => {
    const sceneManager = new SceneManager();
    
    const modelLoader = new ModelLoader(
        sceneManager.scene,
        document.getElementById('loading-info')
    );

    // Update these paths to match your file structure
    modelLoader.loadModel(
        './models/grafkom (1).mtl',
        './models/grafkom (1).obj'
    );

    sceneManager.animate();
});