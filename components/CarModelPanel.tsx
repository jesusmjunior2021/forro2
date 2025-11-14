import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface CarModelPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const CarModelPanel: React.FC<CarModelPanelProps> = ({ isOpen, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!isOpen || !mountRef.current || rendererRef.current) return;

    const currentMount = mountRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // gray-900

    // Camera setup
    const camera = new THREE.PerspectiveCamera(40, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
    camera.position.set(4, 2, -4);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 0.5, 0);
    controls.update();

    // Lighting setup
    const pLight = new THREE.PointLight(0xffffff, 1);
    pLight.position.set(2, 3, 2);
    scene.add(pLight);
    
    const pLight2 = new THREE.PointLight(0xffffff, 1);
    pLight2.position.set(-2, 3, -2);
    scene.add(pLight2);
    
    const aLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(aLight);

    // Model Loading
    const loader = new GLTFLoader();
    // Using a public domain model from Three.js examples for demonstration
    loader.load('https://threejs.org/examples/models/gltf/ferrari.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(1.5, 1.5, 1.5);
      model.position.y = 0.1;
      scene.add(model);
    }, undefined, (error) => {
      console.error('An error happened during model loading:', error);
    });
    
    // Resize handler
    const handleResize = () => {
        if (!currentMount) return;
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      if (!rendererRef.current) return; // Stop loop if component is unmounted
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount && rendererRef.current) {
        currentMount.removeChild(rendererRef.current.domElement);
      }
      if(rendererRef.current){
        rendererRef.current.dispose();
      }
      rendererRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col z-40 animate-fade-in">
      <header className="p-3 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-gray-200 flex items-center">
          <i className="fas fa-car mr-3 text-blue-400"></i>
          Visualizador de Modelo 3D
        </h2>
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center" 
          title="Fechar Visualizador"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </header>
      <main ref={mountRef} className="flex-1 overflow-hidden relative"></main>
    </div>
  );
};

export default CarModelPanel;
