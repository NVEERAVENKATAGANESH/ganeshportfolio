'use strict';

let _bgMouseBound = false;

/* ── 1. GALAXY ── */
function initGalaxy() {
  if (reducedMotion) return; // skip all canvas animation for vestibular-disorder users
  const canvas = document.getElementById('galaxyCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars=[], nebulae=[], shooters=[];
  let rafId = null;
  const rand = (a,b) => Math.random()*(b-a)+a;

  function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }
  resize();
  window.addEventListener('resize', debounce(resize, 250)); // resize canvas only — no need to rebuild stars on every resize

  function build(){
    // More stars, each with autonomous drift velocity for a "flying through space" feel
    const N = Math.min(Math.floor(W*H/900), 3000);
    const COLORS = ['#ffffff','#fffde0','#c8e6ff','#ffd8d8','#d0ffe8','#a5b4fc'];
    stars = Array.from({length:N}, ()=>{
      const layer = Math.floor(Math.random()*3); // 0=far/slow, 1=mid, 2=near/fast
      const speed = [0.08, 0.22, 0.5][layer];
      const angle = rand(0, Math.PI*2);
      return {
        x:rand(0,W), y:rand(0,H),
        r:rand(0.2,1.0)+layer*0.5,
        a:rand(0.25,0.95),
        phase:rand(0,Math.PI*2),
        twinkle:rand(0.003,0.012),
        vx:Math.cos(angle)*speed,
        vy:Math.sin(angle)*speed,
        color:COLORS[Math.floor(Math.random()*COLORS.length)],
        layer
      };
    });
    nebulae = Array.from({length:5}, ()=>({
      x:rand(0,W), y:rand(0,H), rx:rand(120,350), ry:rand(80,220),
      col:['rgba(79,70,229,','rgba(6,182,212,','rgba(139,92,246,','rgba(16,185,129,'][Math.floor(Math.random()*4)],
      a:rand(0.018,0.05)
    }));
  }
  build();

  let mx=0, my=0;
  if(!IS_TOUCH){
    let _rafMx=false;
    if(!_bgMouseBound){ _bgMouseBound=true; window.addEventListener('mousemove', e=>{ if(_rafMx) return; _rafMx=true; requestAnimationFrame(()=>{ mx=(e.clientX/W-0.5)*2; my=(e.clientY/H-0.5)*2; _rafMx=false; }); },{passive:true}); }
  }

  let t=0;
  const PLX = [0.4, 1.0, 1.8]; // mouse parallax per layer
  function frame(){
    ctx.clearRect(0,0,W,H);
    nebulae.forEach(n=>{
      const maxR=Math.max(n.rx,n.ry);
      const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,maxR);
      g.addColorStop(0,n.col+n.a+')'); g.addColorStop(1,n.col+'0)');
      ctx.save(); ctx.scale(n.rx/maxR,n.ry/maxR);
      ctx.fillStyle=g; ctx.beginPath();
      ctx.arc(n.x*(maxR/n.rx),n.y*(maxR/n.ry),maxR,0,Math.PI*2); ctx.fill(); ctx.restore();
    });
    t+=0.008;
    stars.forEach(s=>{
      // Drift — wrap around edges for seamless infinite field
      s.x += s.vx; s.y += s.vy;
      if(s.x < -2) s.x = W+2; else if(s.x > W+2) s.x = -2;
      if(s.y < -2) s.y = H+2; else if(s.y > H+2) s.y = -2;
      const px = s.x + mx*PLX[s.layer];
      const py = s.y + my*PLX[s.layer];
      const tw = s.a*(0.55+0.45*Math.sin(t*s.twinkle*80+s.phase));
      ctx.globalAlpha=tw; ctx.fillStyle=s.color;
      ctx.beginPath(); ctx.arc(px,py,s.r,0,Math.PI*2); ctx.fill();
    });
    // Shooting stars — frequent so it feels alive
    if(Math.random()<0.018 && shooters.length<6){
      shooters.push({x:rand(0,W*0.8),y:rand(0,H*0.5),len:rand(90,220),speed:rand(8,18),angle:rand(0.3,0.7),life:1,decay:rand(0.018,0.04)});
    }
    shooters=shooters.filter(s=>s.life>0);
    shooters.forEach(s=>{
      ctx.globalAlpha=s.life*0.9; ctx.strokeStyle='#fff'; ctx.lineWidth=1.4;
      ctx.shadowBlur=8; ctx.shadowColor='#a8c8ff';
      ctx.beginPath(); ctx.moveTo(s.x,s.y);
      ctx.lineTo(s.x-Math.cos(s.angle)*s.len,s.y-Math.sin(s.angle)*s.len); ctx.stroke();
      ctx.shadowBlur=0; s.x+=Math.cos(s.angle)*s.speed; s.y+=Math.sin(s.angle)*s.speed; s.life-=s.decay;
    });
    ctx.globalAlpha=1;
    rafId = requestAnimationFrame(frame);
  }

  _galaxyCtrl = {
    start(){ if(!rafId) frame(); },
    stop(){ if(rafId){ cancelAnimationFrame(rafId); rafId=null; } ctx.clearRect(0,0,W,H); }
  };
}

/* ── 1b. 3D BACKGROUND (Three.js) — replaces 2D galaxy on desktop ── */
function init3DBackground() {
  if(typeof reducedMotion !== 'undefined' && reducedMotion){ initGalaxy(); return; }
  // Mobile fallback — use 2D galaxy instead
  if (window.innerWidth < 768 || IS_TOUCH) {
    initGalaxy();
    return;
  }
  if (typeof THREE === 'undefined') {
    initGalaxy();
    return;
  }
  const canvas = document.getElementById('galaxyCanvas');
  if (!canvas) { initGalaxy(); return; }

  try {

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(DPR);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const rand = (a, b) => Math.random() * (b - a) + a;

  // ── Particle layers — dense galaxy field with z-drift for "passing stars" feel ──
  const isMobile = window.innerWidth < 768;
  const layerDefs = [
    { count: Math.floor(2200 * (isMobile ? 0.5 : 1)), color: 0xffffff, spread: 18, depth: 22, size: 0.16, opacity: 1.0,  speedMul: 1.0,  vz: 0.014 },
    { count: Math.floor(1400 * (isMobile ? 0.5 : 1)), color: 0xa5b4fc, spread: 26, depth: 30, size: 0.11, opacity: 0.9,  speedMul: 0.65, vz: 0.008 },
    { count: Math.floor( 800 * (isMobile ? 0.5 : 1)), color: 0x67e8f9, spread: 36, depth: 40, size: 0.07, opacity: 0.75, speedMul: 0.35, vz: 0.004 },
  ];
  const particleGroups = layerDefs.map(def => {
    const positions = new Float32Array(def.count * 3);
    for (let i = 0; i < def.count; i++) {
      positions[i * 3]     = rand(-def.spread, def.spread);
      positions[i * 3 + 1] = rand(-def.spread, def.spread);
      positions[i * 3 + 2] = rand(-def.depth, 0);
    }
    const geo = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(positions, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', attr);
    const mat = new THREE.PointsMaterial({
      color: def.color, size: def.size, transparent: true,
      opacity: def.opacity, blending: THREE.AdditiveBlending, depthWrite: false,
      sizeAttenuation: true,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return { pts, geo, attr, speedMul: def.speedMul, origOp: def.opacity, vz: def.vz, spread: def.spread, depth: def.depth };
  });

  // ── Wire mesh plane ──
  const planeGeo  = new THREE.PlaneGeometry(300, 300, 15, 15);
  const planeMat  = new THREE.MeshBasicMaterial({
    color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.09,
  });
  const planeMesh = new THREE.Mesh(planeGeo, planeMat);
  planeMesh.position.set(0, -12, -30);
  scene.add(planeMesh);

  // ── Nebula blobs ──
  const nebulaColors = [0x6366f1, 0x06b6d4, 0x8b5cf6, 0x818cf8, 0x22d3ee];
  const nebulaOpacities = [0.045, 0.06, 0.07, 0.05, 0.08];
  nebulaColors.forEach((col, i) => {
    const geo = new THREE.SphereGeometry(rand(3, 7), 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: col, transparent: true, opacity: nebulaOpacities[i],
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(rand(-10, 10), rand(-6, 6), rand(-15, -5));
    scene.add(mesh);
  });

  // ── SPACESHIP ────────────────────────────────────────────────────────────
  // Build wireframe ship from explicit vertex pairs (no new allocs per frame)
  const _shipVerts = (() => {
    const v = [];
    const L = (ax,ay,az,bx,by,bz) => v.push(ax,ay,az,bx,by,bz);
    // Nose cone
    L( 1.0, 0,     0,     0.3,  0.13,  0   ); L( 1.0, 0,     0,     0.3, -0.13,  0   );
    L( 1.0, 0,     0,     0.3,  0,     0.1 ); L( 1.0, 0,     0,     0.3,  0,    -0.1 );
    // Front cross section
    L( 0.3, 0.13,  0,     0.3, -0.13,  0   ); L( 0.3,-0.13,  0,     0.3,  0,    -0.1 );
    L( 0.3, 0,    -0.1,   0.3,  0.13,  0   ); L( 0.3, 0.13,  0,     0.3,  0,     0.1 );
    L( 0.3, 0,     0.1,   0.3, -0.13,  0   );
    // Body sides front→rear
    L( 0.3, 0.13,  0,    -0.55, 0.13,  0   ); L( 0.3,-0.13,  0,    -0.55,-0.13,  0   );
    L( 0.3, 0,     0.1,  -0.55, 0,     0.1 ); L( 0.3, 0,    -0.1,  -0.55, 0,    -0.1 );
    // Rear cross section
    L(-0.55, 0.13, 0,    -0.55,-0.13,  0   ); L(-0.55,-0.13, 0,    -0.55, 0,    -0.1 );
    L(-0.55, 0,   -0.1,  -0.55, 0.13,  0   ); L(-0.55, 0.13, 0,    -0.55, 0,     0.1 );
    L(-0.55, 0,    0.1,  -0.55,-0.13,  0   );
    // Swept wings
    L( 0.1,  0.13, 0,    -0.3,  0.75,  0   ); L(-0.3,  0.75, 0,    -0.55, 0.13,  0   );
    L( 0.1, -0.13, 0,    -0.3, -0.75,  0   ); L(-0.3, -0.75, 0,    -0.55,-0.13,  0   );
    L(-0.3,  0.75, 0,    -0.2,  0.13,  0   ); L(-0.3, -0.75, 0,    -0.2, -0.13,  0   );
    // Engine nozzles
    L(-0.55, 0.08, 0,    -0.75, 0.08,  0   ); L(-0.55,-0.08, 0,    -0.75,-0.08,  0   );
    L(-0.75, 0.08, 0,    -0.75,-0.08,  0   );
    return new Float32Array(v);
  })();

  function makeShipLines(color, opacity) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(_shipVerts.slice(), 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
      color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
  }

  // (Ambient orbiting ship moved into initHeroSphere — same Three.js scene as sphere)
  // Galaxy canvas only handles the warp flyby

  // ── Warp flyby ship ──
  const flyShip = makeShipLines(0xc4b5fd, 0.0);
  flyShip.scale.setScalar(0.52);
  scene.add(flyShip);

  // Flyby streak trail
  const TRAIL = 10;
  const _trailBuf = new Float32Array(TRAIL * 3);
  const trailGeo  = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(_trailBuf, 3));
  trailGeo.setDrawRange(0, 0);
  const trailLine = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
    color:0x67e8f9, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  scene.add(trailLine);

  const _flyPos   = new THREE.Vector3(0, 999, 0);
  const _flyVel   = new THREE.Vector3();
  let   flyActive = false, flyNextT = 5, flyTrailN = 0;
  // ── END SPACESHIP SETUP ──────────────────────────────────────────────────

  // ── Shooting stars (line segments) ──
  const shooters3D = [];
  function spawnShooter() {
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    const pts = [];
    const sx = rand(-10, 10), sy = rand(2, 8), sz = rand(-5, 2);
    const angle = rand(0.35, 0.65);
    const len = rand(0.8, 2.2);
    pts.push(new THREE.Vector3(sx, sy, sz));
    pts.push(new THREE.Vector3(sx - Math.cos(angle) * len, sy - Math.sin(angle) * len, sz));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    shooters3D.push({
      line, mat, geo, pts,
      vx: Math.cos(angle) * rand(0.06, 0.18),
      vy: Math.sin(angle) * rand(0.06, 0.18),
      life: 1, decay: rand(0.025, 0.055),
    });
  }

  // ── Mouse parallax ──
  let mx = 0, my = 0;
  let _rafMx3D = false;
  const onMouseMove = e => {
    if(_rafMx3D) return; _rafMx3D = true;
    requestAnimationFrame(()=>{
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      _rafMx3D = false;
    });
  };
  if (!IS_TOUCH) {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
  }

  // ── Scroll parallax ──
  let scrollY = window.scrollY;
  const onScroll = () => { scrollY = window.scrollY; };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Resize ──
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  let rafId = null;
  const paralaxSpeeds = [0.0012, 0.0007, 0.0004];

  function frame() {
    rafId = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    planeMesh.rotation.y = t * 0.008;
    planeMesh.rotation.x = t * 0.003;

    particleGroups.forEach((pg, i) => {
      // Slow galaxy rotation + mouse parallax
      pg.pts.rotation.y = t * 0.006 * pg.speedMul + mx * 0.05 * pg.speedMul;
      pg.pts.rotation.x = t * 0.003 * pg.speedMul + my * 0.025 * pg.speedMul;
      pg.pts.position.y = -scrollY * paralaxSpeeds[i];
      // Z-drift: move each star toward camera, wrap back when it passes z=0
      const pos = pg.attr.array;
      for (let j = 2; j < pos.length; j += 3) {
        pos[j] += pg.vz;
        if (pos[j] > 1) {
          pos[j - 2] = rand(-pg.spread, pg.spread);
          pos[j - 1] = rand(-pg.spread, pg.spread);
          pos[j]     = -pg.depth;
        }
      }
      pg.attr.needsUpdate = true;
    });

    // Shooting stars
    if (Math.random() < 0.016 && shooters3D.length < 6) spawnShooter();
    for (let i = shooters3D.length - 1; i >= 0; i--) {
      const s = shooters3D[i];
      s.life -= s.decay;
      s.mat.opacity = s.life * 0.85;
      s.pts[0].x += s.vx; s.pts[0].y += s.vy;
      s.pts[1].x += s.vx; s.pts[1].y += s.vy;
      s.geo.setFromPoints(s.pts);
      if (s.life <= 0) {
        scene.remove(s.line);
        s.geo.dispose(); s.mat.dispose();
        shooters3D.splice(i, 1);
      }
    }

    // ── Warp flyby — fires every 10-14 s (ambient ship is in hero sphere scene)
    if (!flyActive && t > flyNextT) {
      flyActive  = true;
      flyTrailN  = 0;
      flyNextT   = t + rand(10, 14);
      const side = Math.random() > 0.5 ? 1 : -1;
      _flyPos.set(-side * 16, rand(-2.5, 2.5), rand(-5, -2));
      _flyVel.set(side * 0.26, rand(-0.004, 0.004), 0);
      flyShip.rotation.y = side > 0 ? 0 : Math.PI;
      flyShip.material.opacity   = 0.88;
      trailLine.material.opacity = 0.75;
    }
    if (flyActive) {
      _flyPos.addScaledVector(_flyVel, 1);
      flyShip.position.copy(_flyPos);
      // Shift trail history forward
      for (let i = TRAIL - 1; i > 0; i--) {
        _trailBuf[i*3]   = _trailBuf[(i-1)*3];
        _trailBuf[i*3+1] = _trailBuf[(i-1)*3+1];
        _trailBuf[i*3+2] = _trailBuf[(i-1)*3+2];
      }
      _trailBuf[0] = _flyPos.x; _trailBuf[1] = _flyPos.y; _trailBuf[2] = _flyPos.z;
      flyTrailN = Math.min(flyTrailN + 1, TRAIL);
      trailGeo.setDrawRange(0, flyTrailN);
      trailGeo.attributes.position.needsUpdate = true;
      // Fade out near edges
      const dist = Math.abs(_flyPos.x);
      const fade = Math.max(0, 1 - Math.max(0, dist - 11) * 0.12);
      flyShip.material.opacity   = 0.88 * fade;
      trailLine.material.opacity = 0.75 * fade;
      if (dist > 18) {
        flyActive = false;
        flyShip.position.set(0, 999, 0);
        trailGeo.setDrawRange(0, 0);
        trailLine.material.opacity = 0;
      }
    }
    // ── End ship animation ────────────────────────────────────────────────

    renderer.render(scene, camera);
  }

  // Start loop immediately — ship should always be visible
  frame();

  // _galaxyCtrl: light mode dims/hides particles but keeps ship animating
  _galaxyCtrl = {
    start() {
      particleGroups.forEach(pg => { pg.pts.material.opacity = pg.origOp; });
      planeMat.opacity = 0.09;
    },
    stop() {
      // Dim particles in light mode but keep RAF running (ship stays visible)
      particleGroups.forEach(pg => { pg.pts.material.opacity = 0.0; });
      planeMat.opacity = 0.0;
      renderer.clear();
    },
  };

  // Dispose on unload
  window._galaxyCleanup = () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };

  } catch(e) { initGalaxy(); }
}

/* ── 20. HERO SPHERE (Three.js wireframe) ── */
function initHeroSphere(){
  const container = document.getElementById('heroSphere');
  if(!container || typeof THREE === 'undefined') return;

  const W = container.offsetWidth  || 280;
  const H = container.offsetHeight || 260;

  // Scene + camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.z = 3.2;

  // Renderer — transparent background so hero gradient shows through
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Outer wireframe icosahedron (main sphere)
  const outerGeo   = new THREE.IcosahedronGeometry(1, 5);
  const outerEdges = new THREE.EdgesGeometry(outerGeo);
  const outerMat   = new THREE.LineBasicMaterial({
    color: 0xa5b4fc,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
  });
  const outerMesh = new THREE.LineSegments(outerEdges, outerMat);
  scene.add(outerMesh);

  // Inner counter-rotating icosahedron (depth / glow)
  const innerGeo   = new THREE.IcosahedronGeometry(0.62, 3);
  const innerEdges = new THREE.EdgesGeometry(innerGeo);
  const innerMat   = new THREE.LineBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
  });
  const innerMesh = new THREE.LineSegments(innerEdges, innerMat);
  scene.add(innerMesh);

  // Floating dot particles orbiting the sphere
  const pCount    = 220;
  const pPositions = new Float32Array(pCount * 3);
  for(let i = 0; i < pCount; i++){
    const r     = 1.25 + Math.random() * 0.75;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    pPositions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pPositions[i*3+2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xa5b4fc,
    size: 0.022,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // Mouse parallax
  let mx = 0, my = 0, tx = 0, ty = 0;
  const onMouseMove = e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = -(e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('mousemove', onMouseMove, {passive:true});

  // Resize
  const onResize = () => {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  // ── Orbiting spaceship — detailed interceptor ────────────────────────────
  const _sv = (() => {
    const v = [];
    const L = (ax,ay,az,bx,by,bz) => v.push(ax,ay,az,bx,by,bz);
    // Sharp nose
    L( 1.0,  0,     0,     0.4,  0.1,   0   ); L( 1.0,  0,     0,     0.4, -0.1,   0   );
    L( 1.0,  0,     0,     0.4,  0,     0.08); L( 1.0,  0,     0,     0.4,  0,    -0.08);
    // Front cross-section
    L( 0.4,  0.1,   0,     0.4,  0,     0.08); L( 0.4,  0,     0.08,  0.4, -0.1,   0   );
    L( 0.4, -0.1,   0,     0.4,  0,    -0.08); L( 0.4,  0,    -0.08,  0.4,  0.1,   0   );
    // Cockpit canopy (raised ridge on top)
    L( 0.55, 0.1,   0,     0.15, 0.18,  0.09); L( 0.55, 0.1,   0,     0.15, 0.18, -0.09);
    L( 0.15, 0.18,  0.09,  0.15, 0.18, -0.09); L( 0.4,  0.1,   0,     0.55, 0.1,   0   );
    // Hull longitudinal (4 edges)
    L( 0.4,  0.1,   0,    -0.85, 0.1,   0   ); L( 0.4, -0.1,   0,    -0.85,-0.1,   0   );
    L( 0.4,  0,     0.08, -0.85, 0,     0.13); L( 0.4,  0,    -0.08, -0.85, 0,    -0.13);
    // Mid cross-section
    L(-0.2,  0.1,   0,    -0.2,  0,     0.12); L(-0.2,  0,     0.12, -0.2, -0.1,   0   );
    L(-0.2, -0.1,   0,    -0.2,  0,    -0.12); L(-0.2,  0,    -0.12, -0.2,  0.1,   0   );
    // Rear cross-section
    L(-0.85, 0.1,   0,    -0.85, 0,     0.13); L(-0.85, 0,     0.13, -0.85,-0.1,   0   );
    L(-0.85,-0.1,   0,    -0.85, 0,    -0.13); L(-0.85, 0,    -0.13, -0.85, 0.1,   0   );
    // Delta wings — right (+z)
    L( 0.3,  0,     0.1,   0.0,  0,     0.82); L( 0.0,  0,     0.82, -0.6,  0,     0.88);
    L(-0.6,  0,     0.88, -0.85, 0,     0.13); L(-0.2,  0,     0.13, -0.25, 0,     0.52);
    L(-0.25, 0,     0.52, -0.6,  0,     0.88); // rib
    // Winglet tip (upswept)
    L(-0.6,  0,     0.88, -0.72, 0.22,  0.82); L(-0.72, 0.22,  0.82, -0.85, 0,     0.13);
    // Delta wings — left (-z)
    L( 0.3,  0,    -0.1,   0.0,  0,    -0.82); L( 0.0,  0,    -0.82, -0.6,  0,    -0.88);
    L(-0.6,  0,    -0.88, -0.85, 0,    -0.13); L(-0.2,  0,    -0.13, -0.25, 0,    -0.52);
    L(-0.25, 0,    -0.52, -0.6,  0,    -0.88);
    L(-0.6,  0,    -0.88, -0.72, 0.22, -0.82); L(-0.72, 0.22, -0.82, -0.85, 0,    -0.13);
    // Engine pods — right
    L(-0.35, 0,     0.65, -0.35,-0.16,  0.65); L(-0.35,-0.16,  0.65, -0.95,-0.16,  0.68);
    L(-0.35,-0.16,  0.65, -0.35,-0.16,  0.82); L(-0.35,-0.16,  0.82, -0.95,-0.16,  0.82);
    L(-0.95,-0.16,  0.68, -0.95,-0.16,  0.82); L(-0.95,-0.16,  0.68, -0.95, 0,     0.65);
    // Engine pods — left
    L(-0.35, 0,    -0.65, -0.35,-0.16, -0.65); L(-0.35,-0.16, -0.65, -0.95,-0.16, -0.68);
    L(-0.35,-0.16, -0.65, -0.35,-0.16, -0.82); L(-0.35,-0.16, -0.82, -0.95,-0.16, -0.82);
    L(-0.95,-0.16, -0.68, -0.95,-0.16, -0.82); L(-0.95,-0.16, -0.68, -0.95, 0,    -0.65);
    // Main engine nozzles (2 rear)
    L(-0.85, 0.06,  0.06, -1.05, 0.06,  0.07); L(-0.85, 0.06, -0.06, -1.05, 0.06, -0.07);
    L(-1.05, 0.06,  0.07, -1.05, 0.06, -0.07);
    L(-0.85,-0.06,  0.06, -1.05,-0.06,  0.07); L(-0.85,-0.06, -0.06, -1.05,-0.06, -0.07);
    L(-1.05,-0.06,  0.07, -1.05,-0.06, -0.07);
    // Pod nozzles
    L(-0.95,-0.16,  0.68, -1.05,-0.16,  0.68); L(-0.95,-0.16,  0.82, -1.05,-0.16,  0.82);
    L(-1.05,-0.16,  0.68, -1.05,-0.16,  0.82);
    L(-0.95,-0.16, -0.68, -1.05,-0.16, -0.68); L(-0.95,-0.16, -0.82, -1.05,-0.16, -0.82);
    L(-1.05,-0.16, -0.68, -1.05,-0.16, -0.82);
    return new Float32Array(v);
  })();
  const shipGeo = new THREE.BufferGeometry();
  shipGeo.setAttribute('position', new THREE.BufferAttribute(_sv, 3));
  const ship = new THREE.LineSegments(shipGeo, new THREE.LineBasicMaterial({
    color: 0xb8e8ff, transparent: true, opacity: 0.92,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  ship.scale.setScalar(0.22);
  scene.add(ship);

  // Twin engine glows (main nozzles + pod nozzles = 4 points)
  const _eBuf = new Float32Array(4 * 3);
  const eGeo  = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(_eBuf, 3));
  const eGlow = new THREE.Points(eGeo, new THREE.PointsMaterial({
    color: 0x67e8f9, size: 0.055, transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(eGlow);
  // Pre-compute local nozzle positions (in ship local space × scale)
  const sc = 0.22;
  const _nozzles = [
    new THREE.Vector3(-1.05 * sc,  0.06 * sc,  0   ),
    new THREE.Vector3(-1.05 * sc, -0.06 * sc,  0   ),
    new THREE.Vector3(-1.05 * sc, -0.16 * sc,  0.75 * sc),
    new THREE.Vector3(-1.05 * sc, -0.16 * sc, -0.75 * sc),
  ];
  const _eWP = new THREE.Vector3();

  // Orbit trail ring (72-point ellipse matching ship path)
  const _tilt = Math.PI * 0.30;
  const _oPts = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r = 1.10 + 0.12 * Math.cos(a);
    _oPts.push(Math.cos(a) * r, Math.sin(a) * Math.sin(_tilt) * r, Math.sin(a) * Math.cos(_tilt) * r);
  }
  const orbitRingGeo = new THREE.BufferGeometry();
  orbitRingGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(_oPts), 3));
  scene.add(new THREE.LineLoop(orbitRingGeo, new THREE.LineBasicMaterial({
    color: 0x818cf8, transparent: true, opacity: 0.12,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  // Exhaust trails — 4 lines, XLEN=8 points each
  const XLEN = 8;
  const _trails = _nozzles.map(() => {
    const buf = new Float32Array(XLEN * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(buf, 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0x67e8f9, transparent: true, opacity: 0.50,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(line);
    return { buf, geo };
  });

  // Nav lights — right winglet (red), left winglet (green)
  const _navR_buf = new Float32Array(3);
  const _navG_buf = new Float32Array(3);
  const _navRGeo = new THREE.BufferGeometry();
  const _navGGeo = new THREE.BufferGeometry();
  _navRGeo.setAttribute('position', new THREE.BufferAttribute(_navR_buf, 3));
  _navGGeo.setAttribute('position', new THREE.BufferAttribute(_navG_buf, 3));
  const navLightR = new THREE.Points(_navRGeo, new THREE.PointsMaterial({
    color: 0xff3333, size: 0.036, transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  const navLightG = new THREE.Points(_navGGeo, new THREE.PointsMaterial({
    color: 0x33ff66, size: 0.036, transparent: true, opacity: 0.0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(navLightR); scene.add(navLightG);
  // Winglet tip positions in ship local space × scale
  const _navTips = [
    new THREE.Vector3(-0.72 * sc,  0.22 * sc,  0.82 * sc),
    new THREE.Vector3(-0.72 * sc,  0.22 * sc, -0.82 * sc),
  ];
  const _nWP = new THREE.Vector3();
  // ── END ship setup ───────────────────────────────────────────────────────

  // Animate
  const clock = new THREE.Clock();
  let rafId = null;
  (function frame(){
    rafId = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    tx += (mx - tx) * 0.04;
    ty += (my - ty) * 0.04;

    outerMesh.rotation.y = t * 0.14 + tx * 0.28;
    outerMesh.rotation.x = t * 0.07 + ty * 0.18;

    innerMesh.rotation.y = -t * 0.22 + tx * 0.18;
    innerMesh.rotation.x = -t * 0.11 + ty * 0.12;

    points.rotation.y = t * 0.06;
    points.rotation.x = t * 0.04;

    // ── Ship orbit — Kepler ellipse with full effects ──
    const baseAngle = t * 0.45;
    const oa  = baseAngle - 0.14 * Math.sin(baseAngle);  // Kepler speed variation
    const oR  = 1.10 + 0.12 * Math.cos(oa);              // elliptical radius 1.10–1.22
    const tilt = Math.PI * 0.30;
    ship.position.x = Math.cos(oa) * oR + tx * 0.10;
    ship.position.y = Math.sin(oa) * Math.sin(tilt) * oR + ty * 0.06;
    ship.position.z = Math.sin(oa) * Math.cos(tilt) * oR;
    // Face direction of travel (tangent to orbit)
    const vx = -Math.sin(oa);
    const vy =  Math.cos(oa) * Math.sin(tilt);
    const vz =  Math.cos(oa) * Math.cos(tilt);
    ship.rotation.y = -Math.atan2(vx, vz);
    ship.rotation.x =  Math.atan2(vy, Math.sqrt(vx * vx + vz * vz));
    ship.rotation.z = -Math.cos(oa) * 0.32 + Math.sin(t * 0.9) * 0.04; // correct bank + drift wobble
    ship.scale.setScalar(0.22 * (1 + Math.sin(t * 0.7) * 0.014));       // size shimmer
    ship.updateMatrixWorld(true);
    // 4 engine glows
    for (let n = 0; n < 4; n++) {
      _eWP.copy(_nozzles[n]).applyMatrix4(ship.matrixWorld);
      _eBuf[n * 3]     = _eWP.x;
      _eBuf[n * 3 + 1] = _eWP.y;
      _eBuf[n * 3 + 2] = _eWP.z;
    }
    eGeo.attributes.position.needsUpdate = true;
    eGlow.material.size = 0.05 + Math.sin(t * 12) * 0.012;
    // Exhaust trails — shift history, inject current nozzle world position
    for (let n = 0; n < 4; n++) {
      _eWP.copy(_nozzles[n]).applyMatrix4(ship.matrixWorld);
      const { buf, geo } = _trails[n];
      buf.copyWithin(3, 0, (XLEN - 1) * 3); // shift older points back
      buf[0] = _eWP.x; buf[1] = _eWP.y; buf[2] = _eWP.z;
      geo.attributes.position.needsUpdate = true;
    }
    // Nav lights — red/green alternate blink
    const blink = Math.sin(t * 5.0) > 0.2 ? 1.0 : 0.0;
    _nWP.copy(_navTips[0]).applyMatrix4(ship.matrixWorld);
    _navR_buf[0] = _nWP.x; _navR_buf[1] = _nWP.y; _navR_buf[2] = _nWP.z;
    _navRGeo.attributes.position.needsUpdate = true;
    navLightR.material.opacity = blink;
    _nWP.copy(_navTips[1]).applyMatrix4(ship.matrixWorld);
    _navG_buf[0] = _nWP.x; _navG_buf[1] = _nWP.y; _navG_buf[2] = _nWP.z;
    _navGGeo.attributes.position.needsUpdate = true;
    navLightG.material.opacity = 1.0 - blink;

    renderer.render(scene, camera);
  })();

  // Scroll fade — sphere fades out as user scrolls down
  const heroWrap=document.querySelector('.hero-sphere-wrap');
  const onSphereScroll = heroWrap ? ()=>{
    const pct=Math.min(window.scrollY/(window.innerHeight*0.7),1);
    heroWrap.style.opacity=String(1-pct*0.85);
    heroWrap.style.transform=`scale(${1-pct*0.1})`;
  } : null;
  if(onSphereScroll) window.addEventListener('scroll', onSphereScroll, {passive:true});

  // Clean up if galaxy stops (dark→light) — reuse same lifecycle
  window._heroSphereCleanup = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onResize);
    if(onSphereScroll) window.removeEventListener('scroll', onSphereScroll);
    renderer.dispose();
  };
}
