/* Módulo 30-secretos-3d — Secretos del Chef: modelos 3D (Three.js).
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

/* ==========================================================================
   MOTOR THREE.JS 3D MULTI-MODELO (60 FPS CON INSTANCING & SHADOWS)
   ========================================================================== */
let tamagoScene = null;
let tamagoCamera = null;
let tamagoRenderer = null;
let tamagoControls = null;
let tamagoEggGroup = null;
let tamagoPedestalGroup = null;
let tamagoAnimId = null;
let tamagoAutoRotate = true;
let tamagoInitialized = false;
let threeLoadingPromise = null;

function ensureThreeLoaded() {
  if (window.THREE && window.THREE.OrbitControls) {
    return Promise.resolve();
  }
  if (threeLoadingPromise) return threeLoadingPromise;

  threeLoadingPromise = new Promise((resolve, reject) => {
    const s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
      s2.onload = resolve;
      s2.onerror = reject;
      document.head.appendChild(s2);
    };
    s1.onerror = reject;
    document.head.appendChild(s1);
  });
  return threeLoadingPromise;
}

async function initOrResumeTamago3D(item) {
  const container = document.getElementById("tamago-3d-canvas-container");
  if (!container) return;

  if (!window.THREE || !window.THREE.OrbitControls) {
    container.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100%;color:#ffb300;font-weight:700;font-size:14px;">⏳ Preparando visualizador 3D...</div>';
    try {
      await ensureThreeLoaded();
    } catch(e) {
      container.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100%;color:#ef5350;font-weight:700;font-size:13px;">⚠️ Requiere conexión para descargar el motor 3D</div>';
      return;
    }
  }

  if (!tamagoInitialized) {
    setupTamagoScene(container, item);
    tamagoInitialized = true;
  } else {
    loadSecret3DModel(item);
    resizeTamagoViewport();
  }

  if (!tamagoAnimId) {
    animateTamago();
  }
}

function stopTamago3D() {
  if (tamagoAnimId) {
    cancelAnimationFrame(tamagoAnimId);
    tamagoAnimId = null;
  }
}

function setupTamagoScene(container, initialItem) {
  container.innerHTML = "";

  const width = container.clientWidth || 400;
  const height = container.clientHeight || 400;

  // 1. Escena
  tamagoScene = new THREE.Scene();
  tamagoScene.background = new THREE.Color(0x130a1c);

  // 2. Cámara
  tamagoCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  tamagoCamera.position.set(22, 16, 26);

  // 3. Renderer con WebGL nítido
  tamagoRenderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  tamagoRenderer.setSize(width, height);
  tamagoRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  tamagoRenderer.shadowMap.enabled = true;
  tamagoRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (THREE.sRGBEncoding) tamagoRenderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(tamagoRenderer.domElement);

  // 4. OrbitControls con rotación libre 360°
  tamagoControls = new THREE.OrbitControls(tamagoCamera, tamagoRenderer.domElement);
  tamagoControls.enableDamping = true;
  tamagoControls.dampingFactor = 0.05;
  tamagoControls.target.set(0, 6.8, 0);
  tamagoControls.minDistance = 10;
  tamagoControls.maxDistance = 75;
  tamagoControls.minPolarAngle = 0.04;
  tamagoControls.maxPolarAngle = Math.PI - 0.04;

  tamagoControls.addEventListener('start', () => {
    tamagoAutoRotate = false;
    updateTamagoAutoRotateBtn();
  });

  // 5. Iluminación multicapa
  const ambientLight = new THREE.AmbientLight(0xfff6ee, 0.9);
  tamagoScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.05);
  dirLight.position.set(22, 42, 22);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 5;
  dirLight.shadow.camera.far = 85;
  dirLight.shadow.bias = -0.0004;
  tamagoScene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xedd9ff, 0.55);
  fillLight.position.set(-22, 26, -22);
  tamagoScene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffca28, 0.4);
  rimLight.position.set(0, -15, 20);
  tamagoScene.add(rimLight);

  // 6. Pedestal Arcade
  tamagoPedestalGroup = new THREE.Group();

  const baseGeo = new THREE.CylinderGeometry(8, 9, 1.2, 36);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1d1329, roughness: 0.35 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.6;
  base.receiveShadow = true;
  tamagoPedestalGroup.add(base);

  const ringGeo = new THREE.TorusGeometry(8.5, 0.22, 16, 40);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.85, roughness: 0.2 });
  const goldRing = new THREE.Mesh(ringGeo, ringMat);
  goldRing.rotation.x = Math.PI / 2;
  goldRing.position.y = 1.15;
  tamagoPedestalGroup.add(goldRing);

  const pillarGeo = new THREE.CylinderGeometry(5.8, 6.3, 3.5, 36);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x301e44, roughness: 0.45 });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = 2.95;
  pillar.receiveShadow = true;
  tamagoPedestalGroup.add(pillar);

  const topGeo = new THREE.CylinderGeometry(7.5, 7, 0.6, 36);
  const topMat = new THREE.MeshStandardMaterial({ color: 0x140a1e, roughness: 0.25 });
  const topPlate = new THREE.Mesh(topGeo, topMat);
  topPlate.position.y = 4.95;
  topPlate.receiveShadow = true;
  tamagoPedestalGroup.add(topPlate);

  tamagoScene.add(tamagoPedestalGroup);

  // 7. Grupo de Modelo de Secreto
  tamagoEggGroup = new THREE.Group();
  tamagoEggGroup.position.set(0, 5.25, 0);
  tamagoScene.add(tamagoEggGroup);

  loadSecret3DModel(initialItem || CHEF_SECRETS[0]);

  window.addEventListener('resize', resizeTamagoViewport);
  setTimeout(resizeTamagoViewport, 60);
}

function clear3DGroup(group) {
  while (group.children.length > 0) {
    const obj = group.children[0];
    if (obj.geometry) obj.geometry.dispose();
    group.remove(obj);
  }
}

function loadSecret3DModel(item) {
  if (!tamagoEggGroup) return;
  clear3DGroup(tamagoEggGroup);

  if (!item) item = CHEF_SECRETS[currentSecretIndex];

  if (item.id === "tamago") {
    buildTamago3D(tamagoEggGroup);
  } else if (item.id === "chashu") {
    buildChashu3D(tamagoEggGroup);
  } else if (item.id === "fideos") {
    buildNoodles3D(tamagoEggGroup);
  } else if (item.id === "caldo_tonkotsu") {
    buildBrothCauldron3D(tamagoEggGroup);
  } else if (item.id === "alga_nori") {
    buildNori3D(tamagoEggGroup);
  } else if (item.id === "langostinos") {
    buildEbiShrimp3D(tamagoEggGroup);
  } else if (item.id === "shitake") {
    buildShiitake3D(tamagoEggGroup);
  } else if (item.id === "tofu") {
    buildTofu3D(tamagoEggGroup);
  } else if (item.id === "herramienta_benriner") {
    buildBenriner3D(tamagoEggGroup);
  } else if (item.category === "cuchillos") {
    buildKnife3D(tamagoEggGroup, item.id);
  } else if (item.category === "ramen") {
    buildDonburiRamen3D(tamagoEggGroup, item.id);
  } else {
    buildTamago3D(tamagoEggGroup);
  }
}

/* ==========================================================================
   CONSTRUCTORES ESPECÍFICOS DE MODELOS 3D
   ========================================================================== */

/* ==========================================================================
   HELPER VOXEL RENDERER: MICRO-VOXELS DE ALTA DEFINICIÓN (BLOQUE A BLOQUE)
   ========================================================================== */
function renderVoxelBuckets(group, buckets, mats, voxelSize, offsetY = 0) {
  // Geometría cúbica al 95% del tamaño de rejilla: define sutilmente los bordes de cada bloque
  // para mantener nítida la esencia de construcción bloque a bloque con máximo detalle
  const boxGeo = new THREE.BoxGeometry(voxelSize * 0.95, voxelSize * 0.95, voxelSize * 0.95);
  const dummy = new THREE.Object3D();
  
  for (const [key, positions] of Object.entries(buckets)) {
    if (!positions || positions.length === 0) continue;
    const mat = mats[key] || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });
    const instMesh = new THREE.InstancedMesh(boxGeo, mat, positions.length);
    
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      dummy.position.set(p.x, p.y + offsetY, p.z);
      dummy.updateMatrix();
      instMesh.setMatrixAt(i, dummy.matrix);
    }
    
    instMesh.instanceMatrix.needsUpdate = true;
    instMesh.castShadow = true;
    instMesh.receiveShadow = true;
    group.add(instMesh);
  }
}

/* ==========================================================================
   CONSTRUCTORES MICRO-VOXEL 100% PUROS PARA TODOS LOS MODELOS (ALTA RESOLUCIÓN)
   ========================================================================== */

// 1. HUEVO AJITSUKE MICRO-VOXEL
function buildTamago3D(group) {
  const vs = 0.16;
  const mats = {
    crust: new THREE.MeshStandardMaterial({ color: 0x703c19, roughness: 0.5 }),
    whiteOuter: new THREE.MeshStandardMaterial({ color: 0xebd3ba, roughness: 0.4 }),
    whiteInner: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }),
    yolkFirm: new THREE.MeshStandardMaterial({ color: 0xee9b00, roughness: 0.3 }),
    yolkGooey: new THREE.MeshStandardMaterial({ color: 0xc85a00, roughness: 0.15, metalness: 0.1 }),
    sesame: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
  };

  const Rx = 33, Ry = 24, Rz = 33;
  const buckets = { crust: [], whiteOuter: [], whiteInner: [], yolkFirm: [], yolkGooey: [], sesame: [] };

  for (let x = -Rx; x <= Rx; x++) {
    for (let y = -Ry; y <= 0; y++) {
      for (let z = -Rz; z <= Rz; z++) {
        const dist = (x * x) / (Rx * Rx) + (y * y) / (Ry * Ry) + (z * z) / (Rz * Rz);
        if (dist <= 1.0) {
          const rXZ = Math.sqrt(x * x + z * z);
          let key = null;

          if (y === 0) {
            // Cara de corte visible con todos los detalles concéntricos y semillas
            if (rXZ < 11) {
              if (rXZ < 6) {
                if ((Math.abs(x * 7 + z * 13) % 11 === 0 && rXZ > 1.5) || (x === 2 && z === -2) || (x === -3 && z === 1)) {
                  key = 'sesame';
                } else {
                  key = 'yolkGooey';
                }
              } else {
                key = 'yolkGooey';
              }
            } else if (rXZ < 18) {
              key = 'yolkFirm';
            } else if (rXZ < 28) {
              key = 'whiteInner';
            } else if (rXZ < 31) {
              key = 'whiteOuter';
            } else {
              key = 'crust';
            }
          } else {
            // Cúpula exterior visible
            if (dist > 0.88) {
              key = 'crust';
            } else if (dist > 0.76) {
              key = 'whiteOuter';
            }
          }

          if (key) {
            const posY = (y + Ry) * vs;
            buckets[key].push({ x: x * vs, y: posY, z: z * vs });
          }
        }
      }
    }
  }

  renderVoxelBuckets(group, buckets, mats, vs, 0);
}

// 2. CHASHU CARAMELIZADO (RODAJA MICRO-VOXEL CON ESPIRAL DE GRASA Y SOJA)
function buildChashu3D(group) {
  const vs = 0.16;
  const mats = {
    crust: new THREE.MeshStandardMaterial({ color: 0x4a2012, roughness: 0.55 }),
    meat: new THREE.MeshStandardMaterial({ color: 0xb55135, roughness: 0.4 }),
    fat: new THREE.MeshStandardMaterial({ color: 0xfaf3e3, roughness: 0.25 }),
    core: new THREE.MeshStandardMaterial({ color: 0x732415, roughness: 0.5 }),
    negi: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.4 }),
    sesame: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })
  };
  const buckets = { crust: [], meat: [], fat: [], core: [], negi: [], sesame: [] };

  const R = 30, H = 12;
  for (let x = -R; x <= R; x++) {
    for (let z = -R; z <= R; z++) {
      const r = Math.sqrt(x * x + z * z);
      if (r <= R) {
        for (let y = 0; y < H; y++) {
          if (y === 0 || y === H - 1 || r >= R - 4) {
            let key = 'meat';
            if (r >= R - 3) {
              key = 'crust';
            } else {
              const theta = Math.atan2(z, x) + Math.PI;
              const spiralVal = (r + (theta / (Math.PI * 2)) * 9.0) % 11.0;
              if (spiralVal < 3.2 && r > 6 && r < R - 3) {
                key = 'fat';
              } else if (r <= 6) {
                key = 'core';
              }
            }
            buckets[key].push({ x: x * vs, y: y * vs, z: z * vs });

            if (y === H - 1) {
              if ((Math.abs(x * 11 + z * 17) % 13 === 0) && r < R - 4 && r > 4) {
                buckets.negi.push({ x: x * vs, y: (y + 1) * vs, z: z * vs });
              } else if ((Math.abs(x * 13 + z * 5) % 19 === 0) && r < R - 4) {
                buckets.sesame.push({ x: x * vs, y: (y + 1) * vs, z: z * vs });
              }
            }
          }
        }
      }
    }
  }

  renderVoxelBuckets(group, buckets, mats, vs, 0);
}

// 3. FIDEOS KANSUI ARTESANALES (PALILLOS Y CASCADA MICRO-VOXEL)
function buildNoodles3D(group) {
  const vs = 0.16;
  const mats = {
    wood: new THREE.MeshStandardMaterial({ color: 0xbcaaa4, roughness: 0.5 }),
    noodle: new THREE.MeshStandardMaterial({ color: 0xffc107, roughness: 0.3 }),
    noodleDark: new THREE.MeshStandardMaterial({ color: 0xffa000, roughness: 0.35 }),
    steam: new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, roughness: 0.2 })
  };
  const buckets = { wood: [], noodle: [], noodleDark: [], steam: [] };

  // Palillos estilizados en ángulo
  for (let t = 0; t <= 75; t++) {
    const px1 = Math.round(18 - t * 0.45);
    const py1 = Math.round(38 - t * 0.28);
    const pz1 = Math.round(-2.5 + t * 0.05);

    const px2 = Math.round(19 - t * 0.45);
    const py2 = Math.round(39.5 - t * 0.28);
    const pz2 = Math.round(1.8 + t * 0.05);

    const thick = (t < 25) ? 2 : 1;
    for (let dx = 0; dx < thick; dx++) {
      for (let dy = 0; dy < thick; dy++) {
        buckets.wood.push({ x: (px1 + dx) * vs, y: (py1 + dy) * vs, z: pz1 * vs });
        buckets.wood.push({ x: (px2 + dx) * vs, y: (py2 + dy) * vs, z: pz2 * vs });
      }
    }
  }

  // 18 hebras de fideos que caen en cascada
  for (let strand = 0; strand < 18; strand++) {
    const angle = (strand / 18) * Math.PI * 2;
    const rad = 3.0 + Math.sin(strand * 1.5) * 1.5;
    const key = (strand % 2 === 0) ? 'noodle' : 'noodleDark';
    for (let y = 6; y <= 35; y++) {
      const waveX = Math.round(Math.sin(y * 0.4 + strand) * 2.5);
      const waveZ = Math.round(Math.cos(y * 0.35 + strand) * 2.2);
      const x = Math.round(Math.cos(angle) * rad + waveX);
      const z = Math.round(Math.sin(angle) * rad + waveZ);
      buckets[key].push({ x: x * vs, y: y * vs, z: z * vs });
    }
  }

  // Montículo de fideos en el pedestal
  const R = 24;
  for (let x = -R; x <= R; x++) {
    for (let z = -R; z <= R; z++) {
      const r = Math.sqrt(x * x + z * z);
      if (r <= R) {
        const maxH = Math.max(0, Math.floor((1 - (r / R)) * 12 + Math.sin(x * 0.6 + z * 0.8) * 3.0));
        for (let y = Math.max(0, maxH - 2); y <= maxH; y++) {
          const key = ((x + y + z) % 3 === 0) ? 'noodleDark' : 'noodle';
          buckets[key].push({ x: x * vs, y: y * vs, z: z * vs });
        }
      }
    }
  }

  // Partículas de vapor flotantes
  for (let s = 0; s < 25; s++) {
    const sx = Math.round(Math.sin(s * 1.7) * 6);
    const sy = Math.round(38 + s * 1.2);
    const sz = Math.round(Math.cos(s * 1.3) * 5);
    buckets.steam.push({ x: sx * vs, y: sy * vs, z: sz * vs });
  }

  renderVoxelBuckets(group, buckets, mats, vs, 0);
}

// 4. CALDO TONKOTSU EN CALDERO NABE (MICRO-VOXEL)
function buildBrothCauldron3D(group) {
  const vs = 0.16;
  const mats = {
    iron: new THREE.MeshStandardMaterial({ color: 0x1b1f1c, roughness: 0.75, metalness: 0.35 }),
    broth: new THREE.MeshStandardMaterial({ color: 0xfffaea, roughness: 0.15 }),
    oil: new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.2 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.5 })
  };
  const buckets = { iron: [], broth: [], oil: [], wood: [] };

  const H = 28;
  for (let y = 0; y <= H; y++) {
    const Rout = Math.round(22 + Math.sin((y / H) * Math.PI) * 8);
    const Rin = Rout - 3;
    for (let x = -Rout; x <= Rout; x++) {
      for (let z = -Rout; z <= Rout; z++) {
        const r = Math.sqrt(x * x + z * z);
        if (r <= Rout) {
          if (y <= 2) {
            buckets.iron.push({ x: x * vs, y: y * vs, z: z * vs });
          } else if (r >= Rin) {
            buckets.iron.push({ x: x * vs, y: y * vs, z: z * vs });
          } else if (y === 20) {
            const isOil = (Math.abs(x * 7 + z * 13) % 11 === 0);
            buckets[isOil ? 'oil' : 'broth'].push({ x: x * vs, y: y * vs, z: z * vs });
          }
        }
      }
    }
    // Asas laterales de hierro
    if (y >= 16 && y <= 22) {
      for (let w = Rout + 1; w <= Rout + 5; w++) {
        buckets.iron.push({ x: w * vs, y: y * vs, z: 0 });
        buckets.iron.push({ x: -w * vs, y: y * vs, z: 0 });
      }
    }
  }

  // Cucharón de madera
  for (let t = 0; t <= 50; t++) {
    const lx = Math.round(8 - t * 0.45);
    const ly = Math.round(26 + t * 0.18);
    const lz = Math.round(6 + t * 0.35);
    buckets.wood.push({ x: lx * vs, y: ly * vs, z: lz * vs });
  }

  renderVoxelBuckets(group, buckets, mats, vs, 0);
}

// 5. ALGA NORI DE ARIAKE (MICRO-VOXEL)
function buildNori3D(group) {
  const vs = 0.16;
  const mats = {
    noriDark: new THREE.MeshStandardMaterial({ color: 0x091a0f, roughness: 0.6 }),
    noriGreen: new THREE.MeshStandardMaterial({ color: 0x14351d, roughness: 0.5 }),
    noriGloss: new THREE.MeshStandardMaterial({ color: 0x1e4a29, roughness: 0.4 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.5 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.7, roughness: 0.3 })
  };
  const buckets = { noriDark: [], noriGreen: [], noriGloss: [], wood: [], gold: [] };

  // Peana ceremonial de madera
  for (let x = -20; x <= 20; x++) {
    for (let z = -8; z <= 8; z++) {
      for (let y = 0; y <= 4; y++) {
        if (y === 0 || y === 4 || Math.abs(x) === 20 || Math.abs(z) === 8) {
          buckets.wood.push({ x: x * vs, y: y * vs, z: z * vs });
        }
      }
    }
  }
  for (let x = -18; x <= 18; x++) {
    buckets.gold.push({ x: x * vs, y: 5 * vs, z: -8 * vs });
    buckets.gold.push({ x: x * vs, y: 5 * vs, z: 8 * vs });
  }

  // Hoja de nori ondulada en micro-voxels
  const W = 20, H = 54;
  for (let x = -W; x <= W; x++) {
    for (let y = 6; y <= H; y++) {
      const waveZ = Math.round(Math.sin(x * 0.2) * 3.0);
      for (let dz = 0; dz <= 1; dz++) {
        const z = waveZ + dz;
        const rand = Math.abs((x * 17 + y * 11) % 13);
        let key = 'noriDark';
        if (rand === 0 || rand === 1) key = 'noriGreen';
        else if (rand === 2) key = 'noriGloss';
        buckets[key].push({ x: x * vs, y: y * vs, z: z * vs });
      }
    }
  }

  renderVoxelBuckets(group, buckets, mats, vs, 0);
}

// 6. LANGOSTINO EBI REAL (ESCULTURA MICRO-VOXEL CONTINUA DE ALTA DEFINICIÓN)
function buildEbiShrimp3D(group) {
  const vs = 0.16;
  const mats = {
    redOrange: new THREE.MeshStandardMaterial({ color: 0xff5722, roughness: 0.28 }),
    deepCoral: new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.25 }),
    whiteMeat: new THREE.MeshStandardMaterial({ color: 0xfffcf7, roughness: 0.32 }),
    creamShell: new THREE.MeshStandardMaterial({ color: 0xffecb3, roughness: 0.35 }),
    tailRed: new THREE.MeshStandardMaterial({ color: 0xd50000, roughness: 0.22 }),
    tailGold: new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.2, metalness: 0.25 }),
    eyeBlack: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.45 }),
    rostrum: new THREE.MeshStandardMaterial({ color: 0xff6f00, roughness: 0.25 }),
    antenna: new THREE.MeshStandardMaterial({ color: 0xff7043, roughness: 0.3 }),
    pleopod: new THREE.MeshStandardMaterial({ color: 0xffab91, roughness: 0.4 }),
    bamboo: new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.45 }),
    bambooVein: new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.35 })
  };
  const buckets = {
    redOrange: [], deepCoral: [], whiteMeat: [], creamShell: [],
    tailRed: [], tailGold: [], eyeBlack: [], rostrum: [],
    antenna: [], pleopod: [], bamboo: [], bambooVein: []
  };

  const occupied = new Set();
  function addVoxel(key, x, y, z) {
    const code = `${x},${y},${z}`;
    if (!occupied.has(code)) {
      occupied.add(code);
      buckets[key].push({ x: x * vs, y: y * vs, z: z * vs });
    }
  }

  // 1. Hoja ceremonial de bambú Sasa sobre la base del pedestal
  for (let bx = -16; bx <= 16; bx++) {
    for (let bz = -22; bz <= 22; bz++) {
      const leafW = Math.max(0, 11 * (1 - Math.pow(bz / 24, 2)));
      if (Math.abs(bx) <= leafW) {
        const k = (Math.abs(bx) <= 1) ? 'bambooVein' : 'bamboo';
        addVoxel(k, bx, 0, bz);
      }
    }
  }

  // 2. Columna vertebral continua y arco elíptico (cero huecos entre segmentos)
  const steps = 68;
  const spine = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps; // 0 = cabeza, 1 = cola
    const angle = u * Math.PI * 0.78;
    const cy = 4 + Math.round(Math.sin(angle) * 22 + (1 - u) * 4);
    const cz = Math.round(-18 + Math.sin(u * Math.PI * 0.85) * 8 + u * 34);
    const cx = Math.round(Math.sin(u * Math.PI) * 1.5);
    
    // Radios anatómicos elípticos
    let rx, ry;
    if (u < 0.28) {
      // Cefalotórax / Cabeza robusta
      const t = u / 0.28;
      rx = 5.5 + Math.sin(t * Math.PI * 0.7) * 2.0;
      ry = 6.0 + Math.sin(t * Math.PI * 0.7) * 2.5;
    } else {
      // Abdomen que se estiliza gradualmente hacia la cola
      const t = (u - 0.28) / 0.72;
      rx = 7.0 * (1 - t * 0.62);
      ry = 8.0 * (1 - t * 0.65);
      // Crestas de solapamiento de placas de caparazón (tergitos)
      const segmentPhase = ((u - 0.28) * 10) % 1.0;
      if (segmentPhase < 0.25) {
        rx += 0.8;
        ry += 0.8;
      }
    }
    spine.push({ u, cx, cy, cz, rx: Math.max(2.2, rx), ry: Math.max(2.5, ry) });
  }

  // Relleno tridimensional continuo y sólido (carne blanca, caparazón coral y crema)
  for (let i = 0; i < spine.length; i++) {
    const pt = spine[i];
    const u = pt.u;
    const rxCeil = Math.ceil(pt.rx);
    const ryCeil = Math.ceil(pt.ry);
    const segIdx = Math.floor((u - 0.22) * 8);
    const isRedBand = (segIdx % 2 === 0);

    for (let dx = -rxCeil; dx <= rxCeil; dx++) {
      for (let dy = -ryCeil; dy <= ryCeil; dy++) {
        const normDist = (dx * dx) / (pt.rx * pt.rx) + (dy * dy) / (pt.ry * pt.ry);
        if (normDist <= 1.0) {
          let key = 'whiteMeat';
          const isShell = normDist > 0.68;
          const isDorsal = dy > 0.5;
          const isVentral = dy < -0.4;
          if (isShell) {
            if (isDorsal) {
              key = (dy > pt.ry * 0.75) ? 'deepCoral' : (isRedBand ? 'redOrange' : 'creamShell');
            } else if (isVentral) {
              key = 'whiteMeat';
            } else {
              key = isRedBand ? 'redOrange' : 'whiteMeat';
            }
          }
          addVoxel(key, pt.cx + dx, pt.cy + dy, pt.cz);
        }
      }
    }

    // Pleópodos (swimmerets / patitas ventrales pareadas)
    if (u > 0.28 && u < 0.85 && (i % 6 === 0)) {
      for (const side of [-1, 1]) {
        const legX = pt.cx + Math.round(side * (pt.rx * 0.45));
        const legY = pt.cy - Math.round(pt.ry) - 1;
        addVoxel('pleopod', legX, legY, pt.cz);
        addVoxel('pleopod', legX + side, legY - 1, pt.cz - 1);
      }
    }
  }

  // 3. Cabeza frontal: Rostrum (espina dorsal puntiaguda), ojos salientes y antenas curvadas
  const headPt = spine[0];
  for (let rz = 1; rz <= 10; rz++) {
    const rHeight = Math.max(1, Math.round(3 - rz * 0.25));
    for (let h = 0; h < rHeight; h++) {
      addVoxel('rostrum', headPt.cx, headPt.cy + 3 + h, headPt.cz - rz);
    }
  }

  // Ojos negros esféricos
  for (const side of [-1, 1]) {
    const eyeX = headPt.cx + Math.round(side * (headPt.rx * 0.95));
    const eyeY = headPt.cy + 2;
    const eyeZ = headPt.cz - 3;
    for (let ox = 0; ox <= 1; ox++) {
      for (let oy = 0; oy <= 1; oy++) {
        addVoxel('eyeBlack', eyeX + side * ox, eyeY + oy, eyeZ);
      }
    }
  }

  // Antenas arqueadas hacia atrás
  for (const side of [-1, 1]) {
    for (let a = 0; a <= 45; a++) {
      const at = a / 45;
      const ax = headPt.cx + Math.round(side * (headPt.rx + 1 + at * 8));
      const ay = headPt.cy + Math.round(3 + Math.sin(at * Math.PI) * 4 - at * 8);
      const az = headPt.cz + Math.round(-4 + at * 36);
      addVoxel('antenna', ax, ay, az);
    }
  }

  // 4. Cola en abanico articulado de 5 aletas (Telson central + 4 Urópodos con puntas doradas)
  const tailPt = spine[spine.length - 1];
  for (let blade = -2; blade <= 2; blade++) {
    const bladeAngle = blade * 0.28;
    for (let len = 0; len <= 12; len++) {
      const lt = len / 12;
      const bx = tailPt.cx + Math.round(Math.sin(bladeAngle) * len * 1.4);
      const bz = tailPt.cz + Math.round(Math.cos(bladeAngle) * len * 1.1 + len * 0.3);
      const by = tailPt.cy + Math.round(len * 0.55 - (Math.abs(blade) === 0 ? 0 : 1));
      const bladeWidth = (blade === 0) ? Math.max(1, Math.round(2 - lt * 1.5)) : Math.round(1 + Math.sin(lt * Math.PI) * 1.8);
      for (let w = -Math.floor(bladeWidth / 2); w <= Math.floor(bladeWidth / 2); w++) {
        const key = (len >= 9) ? 'tailGold' : 'tailRed';
        addVoxel(key, bx + w, by, bz);
      }
    }
  }

  renderVoxelBuckets(group, buckets, mats, vs, 0);
}

// 7. HONGO SHIITAKE DONKO (MICRO-VOXEL)
function buildShiitake3D(group) {
  const vs = 0.16;
  const mats = {
    cap: new THREE.MeshStandardMaterial({ color: 0x4a2f26, roughness: 0.5 }),
    cut: new THREE.MeshStandardMaterial({ color: 0xf5ebe0, roughness: 0.3 }),
    stem: new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.6 })
  };
  const buckets = { cap: [], cut: [], stem: [] };

  const Rx = 28, Ry = 18, Rz = 28;
  for (let x = -Rx; x <= Rx; x++) {
    for (let y = 0; y <= Ry; y++) {
      for (let z = -Rz; z <= Rz; z++) {
        const dist = (x * x) / (Rx * Rx) + (y * y) / (Ry * Ry) + (z * z) / (Rz * Rz);
        if (dist <= 1.0) {
          if (dist > 0.82 || y === 0) {
            let key = 'cap';
            if (y >= 8 && (Math.abs(x - z) <= 2 || Math.abs(x + z) <= 2)) {
              key = 'cut';
            }
            buckets[key].push({ x: x * vs, y: (y + 12) * vs, z: z * vs });
          }
        }
      }
    }
  }

  for (let y = 0; y <= 12; y++) {
    for (let x = -6; x <= 6; x++) {
      for (let z = -6; z <= 6; z++) {
        if (x * x + z * z <= 36 && (x * x + z * z >= 20 || y === 0 || y === 12)) {
          buckets.stem.push({ x: x * vs, y: y * vs, z: z * vs });
        }
      }
    }
  }

  renderVoxelBuckets(group, buckets, mats, vs, 0);
}

// 8. TRIÁNGULOS DE TOFU DORADO (MICRO-VOXEL)
function buildTofu3D(group) {
  const vs = 0.16;
  const mats = {
    crust: new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 }),
    softTofu: new THREE.MeshStandardMaterial({ color: 0xfffdf2, roughness: 0.3 }),
    grill: new THREE.MeshStandardMaterial({ color: 0x8d5b2c, roughness: 0.7 })
  };
  const buckets = { crust: [], softTofu: [], grill: [] };

  const W = 28, H = 16;
  for (let x = -W; x <= W; x++) {
    for (let z = -18; z <= 18; z++) {
      if (z >= -14 && z <= 18 - Math.abs(x) * 1.15) {
        for (let y = 0; y <= H; y++) {
          const isEdge = (z <= -12 || z >= 16 - Math.abs(x) * 1.15 || y === 0 || y === H);
          let key = isEdge ? 'crust' : 'softTofu';
          if (y === H && (Math.abs(x) % 8 <= 1)) {
            key = 'grill';
          }
          if (isEdge || y === H || y === 0) {
            buckets[key].push({ x: x * vs, y: y * vs, z: z * vs });
          }
        }
      }
    }
  }

  renderVoxelBuckets(group, buckets, mats, vs, 0);
}

// 11. BENRINER TURNING SLICER EN MICRO-VOXELS DE ALTA RESOLUCIÓN
// Se "hornea" una vez en una rejilla 3D al doble de densidad que el resto de modelos (cada unidad = 2×2×2 voxels),
// se descartan los voxels interiores (solo se dibuja la superficie) y cada voxel se sombrea según cuántos vecinos lo
// rodean (oclusión ambiental): los cantos salen claros y las rendijas oscuras. Todo está medido en "unidades" de
// 0.105 de mundo para que el tamaño sea el mismo que el de los otros modelos.
let _benrinerBake = null;
function bakeBenriner() {
  const S = 2;                                                  // voxels por unidad
  const X0 = -80, X1 = 72, Y0 = 0, Y1 = 66, Z0 = -13, Z1 = 13;
  const NX = (X1 - X0) * S, NY = (Y1 - Y0) * S, NZ = (Z1 - Z0) * S;
  const grid = new Uint8Array(NX * NY * NZ);
  const ID = { body: 1, bodyInk: 2, green: 3, greenRidge: 4, steel: 5, steelDark: 6, screw: 7, carrot: 8, carrotRing: 9, carrotCrown: 10, ribbon: 11, edge: 12, knob: 13 };
  const at = (i, j, k) => (i * NY + j) * NZ + k;
  const cx = i => X0 + (i + 0.5) / S, cy = j => Y0 + (j + 0.5) / S, cz = k => Z0 + (k + 0.5) / S;

  // pinta `id` en todas las celdas cuyo centro cumple test(x,y,z) dentro de la caja [x0,x1]×[y0,y1]×[z0,z1] (id 0 = vaciar)
  const paint = (id, x0, x1, y0, y1, z0, z1, test) => {
    const i0 = Math.max(0, Math.floor((x0 - X0) * S)), i1 = Math.min(NX - 1, Math.ceil((x1 - X0) * S));
    const j0 = Math.max(0, Math.floor((y0 - Y0) * S)), j1 = Math.min(NY - 1, Math.ceil((y1 - Y0) * S));
    const k0 = Math.max(0, Math.floor((z0 - Z0) * S)), k1 = Math.min(NZ - 1, Math.ceil((z1 - Z0) * S));
    for (let i = i0; i <= i1; i++) { const x = cx(i); if (x < x0 || x > x1) continue;
      for (let j = j0; j <= j1; j++) { const y = cy(j); if (y < y0 || y > y1) continue;
        for (let k = k0; k <= k1; k++) { const z = cz(k); if (z < z0 || z > z1) continue;
          if (!test || test(x, y, z)) grid[at(i, j, k)] = id; } } }
  };
  // caja con cantos redondeados (radio r)
  const rbox = (id, x0, x1, y0, y1, z0, z1, r, extra) => paint(id, x0, x1, y0, y1, z0, z1, (x, y, z) => {
    const dx = Math.max(x0 + r - x, 0, x - (x1 - r)), dy = Math.max(y0 + r - y, 0, y - (y1 - r)), dz = Math.max(z0 + r - z, 0, z - (z1 - r));
    return dx * dx + dy * dy + dz * dz <= r * r && (!extra || extra(x, y, z));
  });
  // cilindros: radio constante o función de x; eje X, Y o Z
  const cylX = (id, ay, az, rf, x0, x1, extra) => { const rm = typeof rf === 'function' ? 9 : rf; paint(id, x0, x1, ay - rm, ay + rm, az - rm, az + rm, (x, y, z) => { const r = typeof rf === 'function' ? rf(x) : rf; const dy = y - ay, dz = z - az; return dy * dy + dz * dz <= r * r && (!extra || extra(x, y, z)); }); };
  const cylY = (id, ax, az, r, y0, y1) => paint(id, ax - r, ax + r, y0, y1, az - r, az + r, (x, y, z) => (x - ax) * (x - ax) + (z - az) * (z - az) <= r * r);
  const cylZ = (id, ax, ay, r, z0, z1, extra) => paint(id, ax - r, ax + r, ay - r, ay + r, z0, z1, (x, y, z) => (x - ax) * (x - ax) + (y - ay) * (y - ay) <= r * r && (!extra || extra(x, y, z)));
  const hexX = (id, ay, az, r, x0, x1) => paint(id, x0, x1, ay - r, ay + r, az - r, az + r, (x, y, z) => { const dy = Math.abs(y - ay), dz = Math.abs(z - az); return Math.max(dz, dy * 0.866 + dz * 0.5) <= r * 0.88; });

  // ---------- BASE ----------
  for (const fx of [-41, 41]) for (const fz of [-5, 5]) cylY(ID.green, fx, fz, 2.7, 0, 2.4);                  // patas
  rbox(ID.body, -46, 46, 2, 10.5, -8, 8, 1.5);
  paint(0, -26, 30, 8.8, 11, -3.3, 3.3);                                                                       // canal central
  paint(0, 2, 14, 8.2, 11, -4.2, 4.2, (x, y, z) => Math.hypot(Math.max(Math.abs(x - 8) - 4, 0), Math.max(Math.abs(z) - 1, 0)) <= 2.2);   // hueco cuadrado redondeado
  for (let tx = -22; tx <= 28; tx += 4) for (const tz of [-6, 6]) paint(ID.bodyInk, tx - 0.4, tx + 0.4, 10.3, 10.6, tz - 1, tz + 1);   // marcas de la regla
  // "BENRINER" grabado en el frente
  const FONT = {
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    N: ['10001', '11001', '10101', '10101', '10011', '10001', '10001'], R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111']
  };
  const TX0 = -25, word = 'BENRINER';
  paint(ID.bodyInk, TX0, TX0 + 8 * 6, 3, 10, 7.9, 8.9, (x, y, z) => {
    const ci = Math.floor((x - TX0) / 6), rx = Math.floor(x - TX0 - ci * 6), ry = Math.floor(10 - y);
    if (ci < 0 || ci > 7 || rx > 4 || ry < 0 || ry > 6) return false;
    return FONT[word[ci]][ry][rx] === '1';
  });
  // ---------- MONTANTE IZQUIERDO ----------
  const topRound = (x, y) => y <= 57 || (x + 35) * (x + 35) + (y - 57) * (y - 57) <= 25;
  rbox(ID.body, -40, -30, 10, 62, -8, 8, 1.6, (x, y) => topRound(x, y));
  paint(0, -40, -30, 18, 50, -9, 9, (x, y) => ((x + 35) / 3.5) ** 2 + ((y - 33) / 12.6) ** 2 <= 1);           // ventana calada
  // borde de la ventana: marco más oscuro grabado
  paint(ID.bodyInk, -40, -30, 18, 50, 7.7, 8.2, (x, y) => { const d = ((x + 35) / 3.9) ** 2 + ((y - 33) / 13) ** 2; return d > 1 && d <= 1.18; });
  paint(ID.bodyInk, -40, -30, 18, 50, -8.2, -7.7, (x, y) => { const d = ((x + 35) / 3.9) ** 2 + ((y - 33) / 13) ** 2; return d > 1 && d <= 1.18; });
  // nervio de refuerzo curvo
  paint(ID.body, -49, -40, 10, 56, -4.6, 4.6, (x, y, z) => y <= 10 + 40 * Math.pow((x + 49) / 9, 0.9) && Math.abs(z) <= 4.6 - 0.15 * (y - 10) * 0.05);
  // buje de la manivela, eje, tuerca hexagonal y arandela
  cylX(ID.body, 54, 0, 5.4, -43.5, -40);
  cylX(ID.green, 54, 0, 2.9, -53, -26);
  cylX(ID.steel, 54, 0, 3.9, -45.2, -44.2);
  hexX(ID.steelDark, 54, 0, 4.6, -56.4, -54.2);
  for (const [sx, sy] of [[-35, 14.5], [-35, 58.5], [-38, 24], [-32, 24], [-38, 44], [-32, 44]]) for (const sz of [8, -8]) {
    cylZ(ID.screw, sx, sy, 1.35, sz > 0 ? 7.9 : -8.9, sz > 0 ? 8.9 : -7.9);
    cylZ(ID.steelDark, sx, sy, 1.35, sz > 0 ? 8.6 : -8.9, sz > 0 ? 8.9 : -8.6, (x, y) => Math.abs(x - sx) < 0.3 || Math.abs(y - sy) < 0.3);
  }
  // ---------- MANIVELA IZQUIERDA ----------
  rbox(ID.steel, -54, -50.5, 29, 59, -2.3, 2.3, 1.1);
  cylX(ID.steel, 54, 0, 4.6, -54, -50.5);
  cylX(ID.steelDark, 31, 0, 3.7, -55, -53);                                                                   // collarín
  cylX(ID.green, 31, 0, x => (x < -70.4 ? Math.sqrt(Math.max(0, 1 - ((x + 70.4) / 1.6) ** 2)) * 3.2 : 3.1 + 1.2 * Math.sin(Math.min(1, (-x - 55) / 14) * Math.PI)), -72, -54.8,
    (x, y, z) => !(x > -68 && x < -57 && Math.abs(((-x - 57) % 3) - 1.5) < 0.45 && false));
  for (let rx = -67; rx <= -58; rx += 3) cylX(ID.greenRidge, 31, 0, 4.2, rx, rx + 0.7, (x, y, z) => ((y - 31) ** 2 + z * z) > 2.6 * 2.6);   // estrías del mango
  // ---------- DISCO DE PÚAS ----------
  cylX(ID.green, 44, 0, 10.6, -29.8, -27.2, (x, y, z) => Math.hypot(y - 44, z) <= 10.6 - (x > -28 ? 0.6 : 0));
  cylX(ID.greenRidge, 44, 0, 8.4, -27.4, -26.9, (x, y, z) => Math.hypot(y - 44, z) > 7.7);                  // anillo grabado
  cylX(ID.green, 44, 0, 3.4, -31, -26.2);
  const prongs = [[0, 0, 11]];
  for (let n = 0; n < 6; n++) { const a = n * Math.PI / 3; prongs.push([5.4 * Math.cos(a), 5.4 * Math.sin(a), 9.5]); }
  for (let n = 0; n < 6; n++) { const a = n * Math.PI / 3 + Math.PI / 6; prongs.push([8.2 * Math.cos(a), 8.2 * Math.sin(a), 8]); }
  prongs.forEach(([dy, dz, len]) => cylX(ID.green, 44 + dy, dz, x => 1.05 - 0.78 * Math.max(0, (x + 27) / len), -27, -27 + len));
  // ---------- ZANAHORIA ----------
  const cr = x => { const r = 6.2 - (x + 18) * 0.02; return x > 21 ? r * Math.sqrt(Math.max(0, 1 - ((x - 21) / 3) ** 2)) : r; };
  cylX(ID.carrot, 44, 0, cr, -18, 24);
  cylX(ID.carrotCrown, 44, 0, 4.2, -18.4, -17.2);                                                              // corona de la zanahoria
  for (let rx = -14; rx <= 18; rx += 4.5) cylX(ID.carrotRing, 44, 0, x => cr(x) + 0.05, rx, rx + 0.6, (x, y, z) => ((y - 44) ** 2 + z * z) > (cr(x) - 0.35) ** 2);
  // ---------- CARRO DE LA HOJA (parte trasera) ----------
  rbox(ID.body, 2, 40, 10, 50, -9.2, -7.4, 1.6);                                                                // placa vertical
  rbox(ID.body, 30, 44, 10, 28, -9.2, 7, 1.6);                                                                  // bloque derecho
  paint(0, 6, 36, 14, 24, -10, -7.2, (x, y) => Math.abs(y - 19) <= 2.6 || Math.abs(y - 19) <= 3.6 && false);   // ranura guía
  rbox(ID.steel, 6, 28, 28, 49, -7.4, -6.5, 0.4);                                                               // hoja
  paint(ID.edge, 6, 7.2, 28, 49, -7.4, -6.3);                                                                  // filo biselado
  paint(ID.steelDark, 26.8, 28, 28, 49, -7.4, -6.5);
  for (const [sx, sy] of [[11, 32], [22, 32], [11, 45], [22, 45]]) cylZ(ID.screw, sx, sy, 1.15, -6.6, -5.8);   // tornillos de la hoja
  // perilla moleteada de ajuste (ruleta)
  cylZ(ID.knob, 37, 19, 3.6, 7, 9.6, (x, y) => { const a = Math.atan2(y - 19, x - 37); return Math.hypot(x - 37, y - 19) <= 3.6 - (Math.sin(a * 9) > 0.55 ? 0.5 : 0); });
  cylZ(ID.screw, 37, 19, 1.2, 9.6, 10.2);
  // soporte curvo verde y manivela de ajuste (derecha)
  rbox(ID.green, 44, 46.5, 12, 42, -2.4, 2.4, 1.0, (x, y) => y <= 42 - Math.max(0, y - 34) * 0.0 && Math.abs(x - 45.2) <= 1.3 - Math.max(0, (y - 30) * 0.03));
  rbox(ID.steel, 46.5, 49.5, 17, 39, -2.3, 2.3, 1.0);
  cylX(ID.steelDark, 22, 0, 3.4, 49.2, 50.4);
  cylX(ID.green, 22, 0, x => (x > 63 ? Math.sqrt(Math.max(0, 1 - ((x - 63) / 1.6) ** 2)) * 3.1 : 3.0 + 1.0 * Math.sin(Math.min(1, (x - 50) / 14) * Math.PI)), 50.4, 64.6);
  for (let rx = 53; rx <= 61; rx += 3) cylX(ID.greenRidge, 22, 0, 4.0, rx, rx + 0.7, (x, y, z) => ((y - 22) ** 2 + z * z) > 2.5 * 2.5);
  // ---------- LÁMINA CONTINUA DE ZANAHORIA (cinta que se desenrolla desde la hoja) ----------
  for (let t = 0; t <= 1.0001; t += 0.004) {
    const y = 43.6 - 28 * Math.pow(t, 1.25), z = -6.1 + 12.5 * Math.sin(t * Math.PI * 1.15) * (1 - t * 0.25) + t * 2;
    const x0 = 7.6 + Math.sin(t * 6) * 0.8, x1 = x0 + 12 - t * 3;
    paint(t > 0.55 ? ID.carrot : ID.ribbon, x0, x1, y - 0.28, y + 0.28, z - 0.28, z + 0.28);
  }

  // ---------- Extracción de superficie con sombreado por oclusión ----------
  const buckets = {};
  const occ = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= NX || j >= NY || k >= NZ) ? 0 : (grid[at(i, j, k)] ? 1 : 0);
  let total = 0;
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) for (let k = 0; k < NZ; k++) {
    const id = grid[at(i, j, k)];
    if (!id) continue;
    if (occ(i - 1, j, k) && occ(i + 1, j, k) && occ(i, j - 1, k) && occ(i, j + 1, k) && occ(i, j, k - 1) && occ(i, j, k + 1)) continue;   // interior
    let n = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) if ((a || b || c) && occ(i + a, j + b, k + c)) n++;
    const shade = n <= 14 ? 0 : (n <= 18 ? 1 : 2);                                                              // 0 claro (canto) · 1 medio · 2 oscuro (rendija)
    const key = id * 3 + shade;
    (buckets[key] || (buckets[key] = [])).push(i, j, k);
    total++;
  }
  return { buckets, total, S, X0, Y0, Z0, ID };
}

function buildBenriner3D(group) {
  if (!_benrinerBake) _benrinerBake = bakeBenriner();
  const { buckets, S, X0, Y0, Z0, ID } = _benrinerBake;
  const U = 0.105, CXu = -4, vs = U / S;
  const PAL = {
    [ID.body]: [0x7fd6a6, 0.42, 0.08], [ID.bodyInk]: [0x3f9b6d, 0.55, 0.05], [ID.green]: [0x1dc233, 0.3, 0.05], [ID.greenRidge]: [0x0f8f21, 0.45, 0.05],
    [ID.steel]: [0xe6ecef, 0.16, 0.95], [ID.steelDark]: [0x8a9ca6, 0.28, 0.85], [ID.screw]: [0x4d626c, 0.3, 0.85], [ID.carrot]: [0xe8590c, 0.55, 0],
    [ID.carrotRing]: [0xb23f06, 0.6, 0], [ID.carrotCrown]: [0x5a8f2a, 0.6, 0], [ID.ribbon]: [0xffb067, 0.45, 0], [ID.edge]: [0xffffff, 0.08, 1.0], [ID.knob]: [0x19b02d, 0.35, 0.05]
  };
  const boxGeo = new THREE.BoxGeometry(vs * 0.99, vs * 0.99, vs * 0.99);
  const dummy = new THREE.Object3D();
  Object.entries(buckets).forEach(([key, cells]) => {
    const id = Math.floor(key / 3), shade = key % 3;
    const [hex, rough, metal] = PAL[id];
    const col = new THREE.Color(hex);
    if (shade === 0) col.lerp(new THREE.Color(0xffffff), 0.16); else if (shade === 2) col.lerp(new THREE.Color(0x000000), 0.3);
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: metal });
    const n = cells.length / 3;
    const mesh = new THREE.InstancedMesh(boxGeo, mat, n);
    for (let m = 0; m < n; m++) {
      const i = cells[m * 3], j = cells[m * 3 + 1], k = cells[m * 3 + 2];
      dummy.position.set(((X0 + (i + 0.5) / S) - CXu) * U, (Y0 + (j + 0.5) / S) * U, (Z0 + (k + 0.5) / S) * U);
      dummy.updateMatrix();
      mesh.setMatrixAt(m, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
}

// 9. CUCHILLOS JAPONESES EN MICRO-VOXELS
function buildKnife3D(group, knifeId) {
  const vs = 0.15;
  const mats = {
    blade: new THREE.MeshStandardMaterial({ color: 0xecf0f1, metalness: 0.95, roughness: 0.12 }),
    edge: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.08 }),
    spine: new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.85, roughness: 0.2 }),
    horn: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 }),
    handle: new THREE.MeshStandardMaterial({ color: 0xe6ccb2, roughness: 0.5 }),
    kake: new THREE.MeshStandardMaterial({ color: 0x271913, roughness: 0.6 })
  };
  const buckets = { blade: [], edge: [], spine: [], horn: [], handle: [], kake: [] };

  // Soportes de madera Kake
  for (const kx of [-18, 18]) {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        for (let y = 0; y <= 12; y++) {
          if (y === 0 || y === 12 || Math.abs(dx) === 2 || Math.abs(dz) === 4) {
            buckets.kake.push({ x: (kx + dx) * vs, y: y * vs, z: dz * vs });
          }
        }
      }
    }
  }

  let bladeLen = 64;
  let bladeH = 16;
  let isTapered = true;
  let spineThick = 1;

  if (knifeId === "cuchillo_santoku") {
    bladeLen = 64; bladeH = 16;
  } else if (knifeId === "cuchillo_gyuto") {
    bladeLen = 80; bladeH = 14;
  } else if (knifeId === "cuchillo_deba") {
    bladeLen = 56; bladeH = 22; spineThick = 2;
  } else if (knifeId === "cuchillo_nakiri") {
    bladeLen = 64; bladeH = 18; isTapered = false;
  } else if (knifeId === "cuchillo_yanagiba") {
    bladeLen = 96; bladeH = 10;
  }

  const startX = -Math.floor(bladeLen / 2);
  const posY = 14;

  // Hoja en micro-voxels
  for (let lx = 0; lx <= bladeLen; lx++) {
    const x = startX + lx;
    let curH = bladeH;
    if (isTapered && lx > bladeLen - 24) {
      const taper = (lx - (bladeLen - 24)) / 24;
      curH = Math.max(2, Math.round(bladeH * (1 - taper * 0.85)));
    }

    for (let ly = 0; ly < curH; ly++) {
      const y = posY + ly;
      for (let z = -spineThick; z <= spineThick; z++) {
        let key = 'blade';
        if (ly === 0) key = 'edge';
        else if (ly === curH - 1) key = 'spine';
        buckets[key].push({ x: x * vs, y: y * vs, z: z * vs });
      }
    }
  }

  // Virola de cuerno de búfalo negro
  for (let lx = -8; lx <= -1; lx++) {
    const x = startX + lx;
    for (let ly = 2; ly <= 10; ly++) {
      for (let z = -3; z <= 3; z++) {
        buckets.horn.push({ x: x * vs, y: (posY + ly) * vs, z: z * vs });
      }
    }
  }

  // Mango tradicional octogonal Wa de madera clara
  for (let lx = -36; lx <= -9; lx++) {
    const x = startX + lx;
    for (let ly = 1; ly <= 11; ly++) {
      for (let z = -4; z <= 4; z++) {
        if (!((ly === 1 || ly === 11) && Math.abs(z) === 4)) {
          buckets.handle.push({ x: x * vs, y: (posY + ly) * vs, z: z * vs });
        }
      }
    }
  }

  renderVoxelBuckets(group, buckets, mats, vs, 0);
}

// 10. TAZONES DE RAMEN DONBURI EN MICRO-VOXELS
function buildDonburiRamen3D(group, ramenId) {
  const vs = 0.16;

  let bowlHex = 0x1a237e; // Shio azul cobalto
  let rimHex = 0xffd54f;  // Borde dorado
  let brothHex = 0xf4e0a5;// Caldo cristalino

  if (ramenId === "ramen_shoyu") {
    bowlHex = 0x181818; rimHex = 0xb71c1c; brothHex = 0x5d3115;
  } else if (ramenId === "ramen_miso") {
    bowlHex = 0x3e2723; rimHex = 0xffb74d; brothHex = 0xb87d3b;
  } else if (ramenId === "ramen_tonkotsu") {
    bowlHex = 0x111111; rimHex = 0xffd54f; brothHex = 0xfffaea;
  } else if (ramenId === "ramen_chashu") {
    bowlHex = 0x880e4f; rimHex = 0xffd54f; brothHex = 0xf0e4d0;
  } else if (ramenId === "ramen_ebi") {
    bowlHex = 0xf5f5f5; rimHex = 0xd50000; brothHex = 0xe65100;
  } else if (ramenId === "ramen_tantan") {
    bowlHex = 0xb71c1c; rimHex = 0x212121; brothHex = 0xc62828;
  } else if (ramenId === "ramen_vegetariano") {
    bowlHex = 0x1b5e20; rimHex = 0xffd54f; brothHex = 0xc5ae7d;
  } else if (ramenId === "ramen_bajiru") {
    bowlHex = 0xffffff; rimHex = 0x2e7d32; brothHex = 0x388e3c;
  }

  const mats = {
    bowl: new THREE.MeshStandardMaterial({ color: bowlHex, roughness: 0.3, metalness: 0.1 }),
    rim: new THREE.MeshStandardMaterial({ color: rimHex, roughness: 0.25, metalness: 0.4 }),
    broth: new THREE.MeshStandardMaterial({ color: brothHex, roughness: 0.15, metalness: 0.05 }),
    noodle: new THREE.MeshStandardMaterial({ color: 0xffc107, roughness: 0.3 }),
    nori: new THREE.MeshStandardMaterial({ color: 0x0c1f13, roughness: 0.6 }),
    meat: new THREE.MeshStandardMaterial({ color: 0xb85438, roughness: 0.4 }),
    fat: new THREE.MeshStandardMaterial({ color: 0xfbf4e6, roughness: 0.3 }),
    eggWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }),
    eggYolk: new THREE.MeshStandardMaterial({ color: 0xff6f00, roughness: 0.2 }),
    negi: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.4 }),
    special: new THREE.MeshStandardMaterial({ color: 0xff9800, roughness: 0.3 })
  };

  const buckets = {
    bowl: [], rim: [], broth: [], noodle: [], nori: [], meat: [], fat: [], eggWhite: [], eggYolk: [], negi: [], special: []
  };

  const H = 26;
  // Construcción del tazón Donburi en micro-voxels
  for (let y = 0; y <= H; y++) {
    const Rout = Math.round(18 + (y / H) * 17);
    const Rin = Rout - 3;

    for (let x = -Rout; x <= Rout; x++) {
      for (let z = -Rout; z <= Rout; z++) {
        const r = Math.sqrt(x * x + z * z);
        if (r <= Rout) {
          if (y <= 3) {
            // Pie del tazón
            if (r >= 10 && r <= 16) buckets.bowl.push({ x: x * vs, y: y * vs, z: z * vs });
          } else if (y === 4) {
            // Fondo
            buckets.bowl.push({ x: x * vs, y: y * vs, z: z * vs });
          } else if (r >= Rin) {
            // Pared exterior
            const isRim = (y === H);
            buckets[isRim ? 'rim' : 'bowl'].push({ x: x * vs, y: y * vs, z: z * vs });
          } else if (y === 18) {
            // Superficie del caldo
            buckets.broth.push({ x: x * vs, y: y * vs, z: z * vs });
          }
        }
      }
    }
  }

  // Fideos ondulados bajo el caldo
  for (let i = 0; i < 90; i++) {
    const nx = Math.round(Math.sin(i * 0.7) * 15);
    const nz = Math.round(Math.cos(i * 0.5) * 15);
    if (nx * nx + nz * nz <= 256) {
      buckets.noodle.push({ x: nx * vs, y: 19 * vs, z: nz * vs });
    }
  }

  // Alga nori vertical en el borde
  for (let nx = -8; nx <= 8; nx++) {
    for (let ny = 18; ny <= 36; ny++) {
      buckets.nori.push({ x: (nx - 10) * vs, y: ny * vs, z: Math.round(-22 + (ny - 18) * 0.25) * vs });
    }
  }

  // Chashu veteado flotando
  for (let cx = -6; cx <= 6; cx++) {
    for (let cz = -6; cz <= 6; cz++) {
      if (cx * cx + cz * cz <= 36) {
        const key = (Math.abs(cx) === 4 || Math.abs(cz) === 4) ? 'fat' : 'meat';
        buckets[key].push({ x: (cx - 8) * vs, y: 19 * vs, z: (cz + 4) * vs });
      }
    }
  }

  // Medio huevo ajitsuke con yema
  for (let ex = -6; ex <= 6; ex++) {
    for (let ez = -6; ez <= 6; ez++) {
      const er = Math.sqrt(ex * ex + ez * ez);
      if (er <= 6) {
        const key = (er <= 3) ? 'eggYolk' : 'eggWhite';
        buckets[key].push({ x: (ex + 8) * vs, y: 19 * vs, z: (ez + 6) * vs });
      }
    }
  }

  // Cebollino verde espolvoreado
  for (let k = 0; k < 36; k++) {
    const gx = Math.round(Math.sin(k * 2.3) * 12);
    const gz = Math.round(Math.cos(k * 1.9) * 12);
    buckets.negi.push({ x: gx * vs, y: 20 * vs, z: gz * vs });
  }

  // Toppings especiales según receta
  if (ramenId === "ramen_ebi") {
    for (let b = -8; b <= 8; b++) {
      buckets.special.push({ x: b * vs, y: 20 * vs, z: Math.round(-8 + Math.sin(b * 0.4) * 4) * vs });
    }
  } else if (ramenId === "ramen_tantan") {
    for (let mx = -4; mx <= 4; mx++) {
      for (let mz = -4; mz <= 4; mz++) {
        buckets.meat.push({ x: mx * vs, y: 20 * vs, z: (mz - 6) * vs });
      }
    }
  } else if (ramenId === "ramen_chashu") {
    for (let cx = -6; cx <= 6; cx++) {
      for (let cz = -6; cz <= 6; cz++) {
        if (cx * cx + cz * cz <= 32) {
          buckets.meat.push({ x: (cx + 6) * vs, y: 19.5 * vs, z: (cz - 7) * vs });
        }
      }
    }
  }

  renderVoxelBuckets(group, buckets, mats, vs, 0);
}

function animateTamago() {
  tamagoAnimId = requestAnimationFrame(animateTamago);

  if (tamagoAutoRotate && tamagoEggGroup) {
    tamagoEggGroup.rotation.y += 0.007;
  }

  if (tamagoControls) {
    tamagoControls.update();
  }

  if (tamagoRenderer && tamagoScene && tamagoCamera) {
    tamagoRenderer.render(tamagoScene, tamagoCamera);
  }
}

function resizeTamagoViewport() {
  const container = document.getElementById("tamago-3d-canvas-container");
  if (!container || !tamagoRenderer || !tamagoCamera) return;

  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w <= 0 || h <= 0) return;

  tamagoCamera.aspect = w / h;
  tamagoCamera.updateProjectionMatrix();
  tamagoRenderer.setSize(w, h);
}

function toggleTamagoAutoRotate() {
  playSound('click');
  tamagoAutoRotate = !tamagoAutoRotate;
  updateTamagoAutoRotateBtn();
}

function updateTamagoAutoRotateBtn() {
  const statusEl = document.getElementById("autorotate-status");
  if (statusEl) {
    statusEl.textContent = tamagoAutoRotate ? "ON" : "OFF";
    statusEl.style.color = tamagoAutoRotate ? "#69f0ae" : "#ff5252";
  }
}

function resetTamagoCamera() {
  playSound('click');
  if (tamagoCamera && tamagoControls) {
    tamagoCamera.position.set(22, 16, 26);
    tamagoControls.target.set(0, 6.8, 0);
    tamagoControls.update();
  }
}

let userDismissedRotateOverlay = false;
