// ── RestroDyn Three.js Hero Scene ──
// Floating 3D geometric food-themed shapes with particles

import * as THREE from 'three';

export function initHeroScene(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Colors
  const amberColor = new THREE.Color(0xFFC107);
  const coralColor = new THREE.Color(0xFF6B6B);
  const purpleColor = new THREE.Color(0x7C4DFF);
  const tealColor = new THREE.Color(0x00BCD4);

  // ── Floating Shapes ──
  const shapes = [];

  // Torus (donut → food reference)
  const torusGeo = new THREE.TorusGeometry(3, 1.2, 16, 32);
  const torusMat = new THREE.MeshPhongMaterial({
    color: amberColor,
    transparent: true,
    opacity: 0.35,
    wireframe: false,
    shininess: 100,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.set(-12, 4, -5);
  shapes.push({ mesh: torus, speed: 0.003, axis: 'xy', floatAmp: 2, floatSpeed: 0.5 });
  scene.add(torus);

  // Icosahedron
  const icoGeo = new THREE.IcosahedronGeometry(2.5, 0);
  const icoMat = new THREE.MeshPhongMaterial({
    color: coralColor,
    transparent: true,
    opacity: 0.3,
    wireframe: true,
    shininess: 80,
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  ico.position.set(14, -3, -8);
  shapes.push({ mesh: ico, speed: 0.004, axis: 'yz', floatAmp: 1.5, floatSpeed: 0.7 });
  scene.add(ico);

  // Octahedron
  const octGeo = new THREE.OctahedronGeometry(2, 0);
  const octMat = new THREE.MeshPhongMaterial({
    color: purpleColor,
    transparent: true,
    opacity: 0.3,
    wireframe: true,
    shininess: 80,
  });
  const oct = new THREE.Mesh(octGeo, octMat);
  oct.position.set(10, 8, -12);
  shapes.push({ mesh: oct, speed: 0.005, axis: 'xz', floatAmp: 1.8, floatSpeed: 0.6 });
  scene.add(oct);

  // Small sphere cluster
  const sphereGroup = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const radius = 0.4 + Math.random() * 0.6;
    const sGeo = new THREE.SphereGeometry(radius, 16, 16);
    const sMat = new THREE.MeshPhongMaterial({
      color: tealColor,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.2,
    });
    const sphere = new THREE.Mesh(sGeo, sMat);
    sphere.position.set(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    );
    sphereGroup.add(sphere);
  }
  sphereGroup.position.set(-14, -6, -6);
  shapes.push({ mesh: sphereGroup, speed: 0.002, axis: 'xy', floatAmp: 2.5, floatSpeed: 0.4 });
  scene.add(sphereGroup);

  // Dodecahedron
  const dodGeo = new THREE.DodecahedronGeometry(2, 0);
  const dodMat = new THREE.MeshPhongMaterial({
    color: amberColor,
    transparent: true,
    opacity: 0.25,
    wireframe: true,
  });
  const dod = new THREE.Mesh(dodGeo, dodMat);
  dod.position.set(-6, -8, -10);
  shapes.push({ mesh: dod, speed: 0.003, axis: 'yz', floatAmp: 1.2, floatSpeed: 0.8 });
  scene.add(dod);

  // Torus Knot
  const knGeo = new THREE.TorusKnotGeometry(1.8, 0.5, 64, 16, 2, 3);
  const knMat = new THREE.MeshPhongMaterial({
    color: coralColor,
    transparent: true,
    opacity: 0.2,
    wireframe: true,
  });
  const knot = new THREE.Mesh(knGeo, knMat);
  knot.position.set(6, -7, -15);
  shapes.push({ mesh: knot, speed: 0.002, axis: 'xy', floatAmp: 1.5, floatSpeed: 0.5 });
  scene.add(knot);

  // ── Particles ──
  const particleCount = 300;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    sizes[i] = Math.random() * 2 + 0.5;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.PointsMaterial({
    color: 0xFFC107,
    size: 0.12,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ── Lights ──
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0xFFC107, 1.5, 50);
  pointLight1.position.set(10, 10, 10);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xFF6B6B, 1, 50);
  pointLight2.position.set(-10, -5, 10);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(0x7C4DFF, 0.8, 50);
  pointLight3.position.set(0, 15, -10);
  scene.add(pointLight3);

  // ── Mouse parallax ──
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── Animation Loop ──
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Rotate and float shapes
    shapes.forEach(({ mesh, speed, axis, floatAmp, floatSpeed }) => {
      if (axis.includes('x')) mesh.rotation.x += speed;
      if (axis.includes('y')) mesh.rotation.y += speed;
      if (axis.includes('z')) mesh.rotation.z += speed;
      mesh.position.y += Math.sin(t * floatSpeed) * 0.005 * floatAmp;
    });

    // Rotate particles slowly
    particles.rotation.y += 0.0003;
    particles.rotation.x += 0.0001;

    // Mouse parallax on camera
    camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  // ── Resize ──
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
