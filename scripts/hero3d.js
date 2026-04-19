/* =========================================================
   HERO 3D BACKGROUND
   Simple but interactive — an ambient field of floating
   metallic/glass shards that respond to the cursor.
   Uses Three.js r160 via CDN (loaded in the page).
========================================================= */

(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0e0e0e, 0.055);

  const camera = new THREE.PerspectiveCamera(
    50, canvas.clientWidth / canvas.clientHeight, 0.1, 100
  );
  camera.position.set(0, 0, 14);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: window.devicePixelRatio <= 1,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  /* ---- Lighting (warm / cinematic) ---- */
  const ambient = new THREE.AmbientLight(0x2a1a14, 0.6);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0xff7a3d, 4.2, 40, 1.5);
  keyLight.position.set(6, 3, 6);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0xffcf90, 2.4, 30, 1.6);
  fillLight.position.set(-6, -2, 4);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffb4a5, 2.0, 30, 2);
  rimLight.position.set(0, 6, -3);
  scene.add(rimLight);

  /* ---- Central "auteur" object: slow-spinning faceted form ---- */
  const centralGeo = new THREE.IcosahedronGeometry(2.4, 1);
  const centralMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a1a,
    metalness: 0.9,
    roughness: 0.25,
    clearcoat: 1.0,
    clearcoatRoughness: 0.2,
    flatShading: true,
    emissive: 0x2a0f08,
    emissiveIntensity: 0.4,
  });
  const central = new THREE.Mesh(centralGeo, centralMat);
  scene.add(central);

  // Wireframe overlay
  const wireGeo = new THREE.IcosahedronGeometry(2.42, 1);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffb4a5,
    wireframe: true,
    transparent: true,
    opacity: 0.18
  });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wire);

  /* ---- Orbiting shards ---- */
  const shardsGroup = new THREE.Group();
  scene.add(shardsGroup);

  const shardGeo = new THREE.TetrahedronGeometry(0.35, 0);
  const shardMat = new THREE.MeshPhysicalMaterial({
    color: 0x0e0e0e,
    metalness: 1.0,
    roughness: 0.3,
    clearcoat: 0.8,
    emissive: 0x1a0805,
    emissiveIntensity: 0.6,
  });

  const shards = [];
  const SHARD_COUNT = 18;
  for (let i = 0; i < SHARD_COUNT; i++) {
    const m = new THREE.Mesh(shardGeo, shardMat);
    const radius = 4.2 + Math.random() * 3.6;
    const angle = (i / SHARD_COUNT) * Math.PI * 2 + Math.random() * 0.5;
    const yOff = (Math.random() - 0.5) * 4;
    m.userData = {
      radius,
      angle,
      yOff,
      speed: 0.04 + Math.random() * 0.08,
      spin: (Math.random() - 0.5) * 0.02,
      scale: 0.6 + Math.random() * 1.3,
    };
    m.scale.setScalar(m.userData.scale);
    shardsGroup.add(m);
    shards.push(m);
  }

  /* ---- Dust particles (fine points for depth) ---- */
  const dustGeo = new THREE.BufferGeometry();
  const dustCount = 280;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3 + 0] = (Math.random() - 0.5) * 30;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xffcf90,
    size: 0.025,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ---- Interaction: mouse follow ---- */
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };

  function onPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    target.x = x;
    target.y = y;
  }
  window.addEventListener('pointermove', (e) => onPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) onPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  /* ---- Resize ---- */
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---- Animate ---- */
  const clock = new THREE.Clock();
  let rafId;

  function tick() {
    const t = clock.getElapsedTime();

    // Smooth cursor lerp
    current.x += (target.x - current.x) * 0.04;
    current.y += (target.y - current.y) * 0.04;

    // Central shape: slow tumble + mouse-driven tilt
    central.rotation.x = t * 0.08 + current.y * 0.4;
    central.rotation.y = t * 0.12 + current.x * 0.6;
    wire.rotation.copy(central.rotation);
    wire.rotation.y += 0.003;

    // Gentle breathing scale
    const breath = 1 + Math.sin(t * 0.6) * 0.02;
    central.scale.setScalar(breath);
    wire.scale.setScalar(breath * 1.005);

    // Orbit shards
    shardsGroup.rotation.y = current.x * 0.3;
    shardsGroup.rotation.x = current.y * -0.2;
    for (const s of shards) {
      const d = s.userData;
      d.angle += d.speed * 0.01;
      s.position.x = Math.cos(d.angle) * d.radius;
      s.position.z = Math.sin(d.angle) * d.radius;
      s.position.y = d.yOff + Math.sin(t * 0.3 + d.angle * 2) * 0.4;
      s.rotation.x += d.spin;
      s.rotation.y += d.spin * 0.7;
    }

    // Dust drift
    dust.rotation.y = t * 0.01;
    dust.position.x = current.x * 0.3;

    // Camera micro-parallax
    camera.position.x = current.x * 0.6;
    camera.position.y = current.y * 0.4;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }

  // Respect reduced motion
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    renderer.render(scene, camera);
  } else {
    tick();
  }

  // Pause when offscreen to save battery
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        if (!rafId && !reduced) tick();
      } else {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    });
  }, { threshold: 0.01 });
  io.observe(canvas);
})();
