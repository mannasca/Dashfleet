import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./TruckViewer.css";

const AREA_LABELS = {
  brakes: "Brakes",
  transmission: "Transmission",
  battery: "Battery",
  suspension: "Suspension",
  tires: "Tires",
  cooling: "Cooling System",
  electrical: "Electrical"
};

export default function TruckViewer({ highlightAreas = [] }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const componentsRef = useRef({});
  const [hoveredArea, setHoveredArea] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup with dark background for black theme
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // Very dark gray, almost black
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(6, 4, 6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.8, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 3;
    controls.maxDistance = 12;

    // Lights - VERY BRIGHT to show red highlights clearly
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(8, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -8;
    dirLight.shadow.camera.right = 8;
    dirLight.shadow.camera.top = 8;
    dirLight.shadow.camera.bottom = -8;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Additional front light to illuminate problem areas
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.6);
    frontLight.position.set(0, 3, 8);
    scene.add(frontLight);

    // Ground
    const groundGeom = new THREE.CircleGeometry(10, 64);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create simplified truck model with component groups
    const truckGroup = new THREE.Group();
    const components = {};
    componentsRef.current = components;

    // Default material (white/gray truck for black theme)
    const defaultMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.4,
      roughness: 0.6
    });

    // Problem material (pulsing red)
    const createProblemMaterial = () => new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.3,
      roughness: 0.5,
      emissive: 0xff0000,
      emissiveIntensity: 0.6
    });

    // Cabin (engine inside)
    const cabinGeom = new THREE.BoxGeometry(1.4, 1.1, 1.5);
    const cabin = new THREE.Mesh(cabinGeom, defaultMat.clone());
    cabin.position.set(1.6, 0.95, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    cabin.userData.area = 'engine';
    truckGroup.add(cabin);
    components.engine = [cabin];

    // Cargo bed (transmission)
    const bedGeom = new THREE.BoxGeometry(2.2, 0.9, 1.5);
    const bed = new THREE.Mesh(bedGeom, defaultMat.clone());
    bed.position.set(-0.6, 0.85, 0);
    bed.castShadow = true;
    bed.receiveShadow = true;
    bed.userData.area = 'transmission';
    truckGroup.add(bed);
    components.transmission = [bed];

    // Hood (cooling system - front)
    const hoodGeom = new THREE.BoxGeometry(0.7, 0.35, 1.3);
    const hood = new THREE.Mesh(hoodGeom, defaultMat.clone());
    hood.position.set(2.6, 0.65, 0);
    hood.castShadow = true;
    hood.receiveShadow = true;
    hood.userData.area = 'cooling';
    truckGroup.add(hood);
    components.cooling = [hood];

    // Battery compartment (visible box on side of cabin)
    const batteryGeom = new THREE.BoxGeometry(0.35, 0.3, 0.3);
    const batteryMat = new THREE.MeshStandardMaterial({ 
      color: 0xfbbf24, 
      metalness: 0.6, 
      roughness: 0.4,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.2
    });
    const battery = new THREE.Mesh(batteryGeom, batteryMat);
    battery.position.set(0.8, 0.8, 0.9); // Moved higher and back to avoid wheel overlap
    battery.castShadow = true;
    battery.userData.area = 'battery';
    truckGroup.add(battery);
    components.battery = [battery];
    components.electrical = [battery];

    // Transmission (box under bed center) - additional visual indicator
    const transmissionGeom = new THREE.BoxGeometry(0.6, 0.3, 0.5);
    const transmissionMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.5 });
    const transmission = new THREE.Mesh(transmissionGeom, transmissionMat);
    transmission.position.set(0, 0.35, 0);
    transmission.castShadow = true;
    transmission.userData.area = 'transmission';
    truckGroup.add(transmission);
    components.transmission.push(transmission);

    // Cooling radiator (grid pattern on front)
    const radiatorGeom = new THREE.BoxGeometry(0.15, 0.6, 1.0);
    const radiatorMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 });
    const radiator = new THREE.Mesh(radiatorGeom, radiatorMat);
    radiator.position.set(2.9, 0.65, 0);
    radiator.castShadow = true;
    radiator.userData.area = 'cooling';
    truckGroup.add(radiator);
    components.cooling.push(radiator);

    // Wheels (4) - tires
    const wheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 20);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.1, roughness: 0.8 });
    const wheelPositions = [
      [1.3, 0.38, -0.85],
      [1.3, 0.38, 0.85],
      [-1.1, 0.38, -0.85],
      [-1.1, 0.38, 0.85]
    ];

    const wheels = [];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat.clone());
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      wheel.userData.area = 'tires';
      truckGroup.add(wheel);
      wheels.push(wheel);
    });
    components.tires = wheels;

    // Brake discs (visible behind wheels) - brakes
    const brakeGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 24);
    const brakeMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5, roughness: 0.3 });
    
    const brakes = [];
    wheelPositions.forEach((pos) => {
      const brake = new THREE.Mesh(brakeGeom, brakeMat.clone());
      brake.rotation.z = Math.PI / 2;
      brake.position.set(pos[0], pos[1], pos[2]);
      brake.userData.area = 'brakes';
      truckGroup.add(brake);
      brakes.push(brake);
    });
    components.brakes = brakes;

    // Suspension (struts connecting axles to body) - suspension
    const suspensionGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12);
    const suspensionMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.4, roughness: 0.5 });
    
    const suspensions = [];
    wheelPositions.forEach((pos) => {
      const strut = new THREE.Mesh(suspensionGeom, suspensionMat.clone());
      strut.position.set(pos[0], pos[1] + 0.4, pos[2] * 0.6);
      strut.userData.area = 'suspension';
      truckGroup.add(strut);
      suspensions.push(strut);
    });
    components.suspension = suspensions;

    scene.add(truckGroup);

    // Store original materials for reset
    const originalMaterials = new Map();
    Object.entries(components).forEach(([area, meshes]) => {
      if (Array.isArray(meshes)) {
        meshes.forEach((mesh) => {
          originalMaterials.set(mesh, {
            color: mesh.material.color.getHex(),
            emissive: mesh.material.emissive.getHex(),
            emissiveIntensity: mesh.material.emissiveIntensity || 0
          });
        });
      }
    });

    // Highlight problem areas with DRAMATIC effect
    const highlightComponents = (areas) => {
      console.log('Highlighting areas:', areas);
      
      // First, reset ALL components to normal
      Object.entries(components).forEach(([area, meshes]) => {
        if (Array.isArray(meshes)) {
          meshes.forEach((mesh) => {
            const original = originalMaterials.get(mesh);
            if (original) {
              mesh.material.color.setHex(original.color);
              mesh.material.emissive.setHex(0x000000);
              mesh.material.emissiveIntensity = 0;
            }
          });
        }
      });

      // Then apply BRIGHT RED highlighting to problem areas
      areas.forEach((area) => {
        console.log('Applying highlight to:', area);
        const meshes = components[area];
        if (meshes && Array.isArray(meshes)) {
          console.log('Found', meshes.length, 'meshes for', area);
          meshes.forEach((mesh) => {
            // SUPER BRIGHT RED - impossible to miss!
            mesh.material.color.setHex(0xff0000);
            mesh.material.emissive.setHex(0xff0000);
            mesh.material.emissiveIntensity = 1.5; // VERY strong glow
            mesh.material.needsUpdate = true;
          });
        }
      });
    };

    // Initial highlight
    if (highlightAreas.length > 0) {
      highlightComponents(highlightAreas);
    }

    // Animation loop with STRONG pulsing effect for highlighted areas
    let animationId;
    let pulseTime = 0;
    function animate() {
      animationId = requestAnimationFrame(animate);
      pulseTime += 0.05; // faster pulsing
      
      // DRAMATIC pulse effect for highlighted components
      highlightAreas.forEach((area) => {
        const meshes = components[area];
        if (meshes && Array.isArray(meshes)) {
          // Pulse between 1.2 and 2.0 - VERY noticeable!
          const intensity = 1.6 + Math.sin(pulseTime * 3) * 0.4;
          meshes.forEach((mesh) => {
            mesh.material.emissiveIntensity = intensity;
            mesh.material.needsUpdate = true;
          });
        }
      });
      
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    function onResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [highlightAreas]); // Re-run when highlight areas change

  return (
    <div className="truck-viewer-container">
      <div className="truck-canvas" ref={containerRef} />
      {highlightAreas.length > 0 && (
        <div className="highlight-info">
          <strong>⚠️ Problem Areas:</strong>
          <div className="problem-tags">
            {highlightAreas.map(area => (
              <span key={area} className="problem-tag">{AREA_LABELS[area] || area}</span>
            ))}
          </div>
        </div>
      )}
      <div className="truck-legend">
        <div className="legend-item">
          <div className="legend-dot problem" />
          <span>Problem Area (Pulsing Red)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot normal" />
          <span>Normal</span>
        </div>
      </div>
    </div>
  );
}
