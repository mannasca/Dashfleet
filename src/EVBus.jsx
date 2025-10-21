// src/EVBus.jsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function EVBus() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    // ----- Renderer -----
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ----- Scene & Camera -----
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      2000
    );
    camera.position.set(8, 5.5, 12);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.6, 0);

    // ----- Lights -----
    scene.add(new THREE.HemisphereLight(0xcfe7ff, 0x0c0f18, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(6, 10, 4);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    scene.add(dir);

    // ----- Ground -----
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(50, 64),
      new THREE.MeshStandardMaterial({ color: 0x0c142c, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ----- Materials -----
    const paintMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, metalness: 0.1, roughness: 0.6 });
    const altPaintMat = new THREE.MeshStandardMaterial({ color: 0xf6b73c, metalness: 0.1, roughness: 0.6 });
    const windowMat = new THREE.MeshPhysicalMaterial({
      color: 0x88b7ff, roughness: 0.15, transmission: 0.5, transparent: true, opacity: 0.98, thickness: 0.1
    });
    const blackRubberMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.05 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdfe7ef, metalness: 0.9, roughness: 0.2 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff6da, emissive: 0x886622, emissiveIntensity: 0.5 });

    // Optional texture from /public/bus.jpg (CRA serves it at /bus.jpg)
    const texLoader = new THREE.TextureLoader();
    let busTexture = null;
    texLoader.load('/bus.jpg', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      busTexture = tex;
    }, undefined, () => { /* ignore 404 */ });

    const paintOrTexture = (fallback) =>
      busTexture
        ? new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.7, map: busTexture })
        : fallback;

    // ----- Build Bus -----
    const bus = new THREE.Group();
    bus.name = 'Bus';
    scene.add(bus);

    const L = 8.0, W = 2.6, bodyH = 2.2;

    // Chassis (unclickable)
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(L * 0.95, 0.2, W * 0.95),
      new THREE.MeshStandardMaterial({ visible: false })
    );
    chassis.position.y = 0.6;
    chassis.name = 'Chassis';
    chassis.visible = false;
    chassis.raycast = () => {}; // ignore for raycaster
    bus.add(chassis);

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(L, bodyH, W), paintOrTexture(paintMat));
    body.position.y = 0.6 + bodyH / 2;
    body.castShadow = true; body.receiveShadow = true;
    body.name = 'Body'; body.userData.health = 86;
    bus.add(body);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(L * 0.98, 0.45, W * 0.98), altPaintMat);
    roof.position.y = body.position.y + bodyH / 2 + 0.225;
    roof.castShadow = true; roof.receiveShadow = true;
    roof.name = 'Roof'; roof.userData.health = 92;
    bus.add(roof);

    // Bumper
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, W * 0.9), chromeMat);
    bumper.position.set(L/2 + 0.075, 0.8, 0);
    bumper.castShadow = true; bumper.receiveShadow = true;
    bumper.name = 'Front Bumper'; bumper.userData.health = 73;
    bus.add(bumper);

    // Headlights
    const headGeo = new THREE.BoxGeometry(0.05, 0.15, 0.25);
    const headL = new THREE.Mesh(headGeo, lightMat);
    headL.position.set(L/2 + 0.05, 0.95,  W*0.25);
    headL.name = 'Left Headlight'; headL.userData.health = 88;
    const headR = headL.clone(); headR.position.z = -W*0.25; headR.name = 'Right Headlight'; headR.userData.health = 90;
    [headL, headR].forEach(h => { h.castShadow = true; h.receiveShadow = true; bus.add(h); });

    // Door (right side)
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.8, 1.0), chromeMat);
    door.position.set(-L*0.1, 1.5, -W/2 - 0.025);
    door.rotation.y = Math.PI / 2;
    door.castShadow = true; door.receiveShadow = true;
    door.name = 'Door'; door.userData.health = 81;
    bus.add(door);

    // Windows
    const winH = 0.9, winY = body.position.y + 0.25;
    const winGeo = new THREE.BoxGeometry(L * 0.9, winH, 0.04);
    const windowsLeft  = new THREE.Mesh(winGeo, windowMat);
    windowsLeft.position.set(0, winY,  W/2 + 0.021);
    windowsLeft.name = 'Windows (Left)'; windowsLeft.userData.health = 95;
    const windowsRight = windowsLeft.clone();
    windowsRight.position.z = -W/2 - 0.021;
    windowsRight.name = 'Windows (Right)'; windowsRight.userData.health = 94;
    bus.add(windowsLeft, windowsRight);

    // Wheels (upright; spin around Z)
    function makeWheel(name, x, z) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 24), blackRubberMat);
      wheel.rotation.x = Math.PI / 2; // axle along Z (upright)
      wheel.position.set(x, 0.55, z);
      wheel.castShadow = true; wheel.receiveShadow = true;
      wheel.name = name; wheel.userData.health = Math.floor(70 + Math.random() * 25);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.36, 24), chromeMat);
      rim.rotation.x = Math.PI / 2;
      wheel.add(rim);
      return wheel;
    }
    const ax = L * 0.35, zx = W * 0.45;
    const wheelFL = makeWheel('Wheel (Front Left)' ,  ax,  zx);
    const wheelFR = makeWheel('Wheel (Front Right)',  ax, -zx);
    const wheelRL = makeWheel('Wheel (Rear Left)'  , -ax,  zx);
    const wheelRR = makeWheel('Wheel (Rear Right)' , -ax, -zx);
    bus.add(wheelFL, wheelFR, wheelRL, wheelRR);

    // Tail lights
    const tailGeo = new THREE.BoxGeometry(0.05, 0.2, 0.25);
    const tailL = new THREE.Mesh(tailGeo, new THREE.MeshStandardMaterial({ color: 0xff5544, emissive: 0x661111, emissiveIntensity: 0.6 }));
    tailL.position.set(-L/2 - 0.05, 1.0,  W*0.25);
    tailL.name = 'Left Tail Light'; tailL.userData.health = 89;
    const tailR = tailL.clone(); tailR.position.z = -W*0.25; tailR.name = 'Right Tail Light'; tailR.userData.health = 87;
    bus.add(tailL, tailR);

    // ----- Interaction (raycaster climbs to health-bearing parent) -----
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selected = null;

    function onPointerDown(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * -2 + 1;
      mouse.set(x, y);
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects([bus], true);
      if (!hits.length) { selected = null; return; }

      let obj = hits[0].object;
      while (obj && !(typeof obj.userData?.health === 'number')) obj = obj.parent;
      selected = obj || null;
      // Log to console so you can see the selection
      if (selected) console.log('Selected:', selected.name, 'health=', selected.userData.health);
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // ----- Render Loop -----
    const clock = new THREE.Clock();
    let raf;
    const animate = () => {
      const dt = clock.getDelta();
      const spin = dt * 1.5;
      [wheelFL, wheelFR, wheelRL, wheelRR].forEach(w => (w.rotation.z += spin)); // correct axis
      bus.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.02;

      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    // ----- Resize -----
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    onResize();
    window.addEventListener('resize', onResize);

    // Expose health API
    window.updateHealth = (nameOrRegex, value) => {
      const matcher = nameOrRegex instanceof RegExp
        ? (n) => nameOrRegex.test(n)
        : (n) => n === nameOrRegex;
      bus.traverse(o => { if (o.isMesh && matcher(o.name)) o.userData.health = value; });
      if (selected && matcher(selected.name)) {
        console.log('Updated', selected.name, '→', value + '%');
      }
    };

    // Cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
}
