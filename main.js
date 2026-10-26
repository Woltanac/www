// Squirrel Heist — Woltco Woods. Three.js, no build step. All textures procedural (no external assets).
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LEVELS } from './levels.js';

const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
let seed = 7; const srand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const FOG = new THREE.Color(0xc9b38f);
scene.fog = new THREE.FogExp2(FOG, 0.022);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.05, 400);

const sky = new Sky(); sky.scale.setScalar(1000); scene.add(sky);
const su = sky.material.uniforms;
su.turbidity.value = 6; su.rayleigh.value = 1.6; su.mieCoefficient.value = 0.006; su.mieDirectionalG.value = 0.85;
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(72), THREE.MathUtils.degToRad(210));
su.sunPosition.value.copy(sunDir);
const pmrem = new THREE.PMREMGenerator(renderer);
{ const s = new THREE.Scene(); const sk = new Sky(); sk.scale.setScalar(1000); Object.assign(sk.material.uniforms.sunPosition.value, sunDir); for (const k of ['turbidity','rayleigh','mieCoefficient','mieDirectionalG']) sk.material.uniforms[k].value = su[k].value; s.add(sk); scene.environment = pmrem.fromScene(s).texture; }
scene.environmentIntensity = 0.45;

const hemi = new THREE.HemisphereLight(0xffe7c4, 0x3b4a2a, 0.55); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd29a, 2.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 120 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
scene.add(sun, sun.target);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.6, 0.88);
composer.addPass(bloom); composer.addPass(new OutputPass());
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); });

// ---------- procedural textures ----------
function canvasTex(size, draw, rep = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
const noiseFill = (g, s, base, n, a = 0.15) => { g.fillStyle = base; g.fillRect(0, 0, s, s); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,240,210'},${Math.random() * a})`; g.fillRect(Math.random() * s, Math.random() * s, rand(1, 4), rand(1, 4)); } };
const T = {};
T.bark = canvasTex(256, (g, s) => { noiseFill(g, s, '#5a4232', 3000, .2); for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(20,12,6,${rand(.3, .7)})`; g.lineWidth = rand(1, 4); g.beginPath(); let x = Math.random() * s; g.moveTo(x, 0); for (let y = 0; y <= s; y += 16) { x += rand(-3, 3); g.lineTo(x, y); } g.stroke(); } }, [2, 4]);
T.grass = canvasTex(256, (g, s) => { noiseFill(g, s, '#4f6b2c', 0); for (let i = 0; i < 5000; i++) { g.strokeStyle = `hsla(${rand(70, 100)},${rand(30, 55)}%,${rand(18, 40)}%,.8)`; g.lineWidth = 1; const x = Math.random() * s, y = Math.random() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-2, 2), y - rand(3, 8)); g.stroke(); } for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${rand(120,170)},${rand(70,100)},30,.5)`; g.beginPath(); g.ellipse(Math.random() * s, Math.random() * s, 4, 2, rand(0, 3), 0, 7); g.fill(); } }, [90, 90]);
const plankDraw = (base, dark) => (g, s) => { g.fillStyle = base; g.fillRect(0, 0, s, s); const n = 8, h = s / n; for (let i = 0; i < n; i++) { g.fillStyle = `rgba(0,0,0,${rand(0, .18)})`; g.fillRect(0, i * h, s, h); for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(30,15,5,${rand(.05, .2)})`; g.beginPath(); const y = i * h + rand(2, h - 2); g.moveTo(0, y); g.bezierCurveTo(s * .3, y + rand(-3, 3), s * .6, y + rand(-3, 3), s, y); g.stroke(); } g.fillStyle = dark; g.fillRect(0, i * h, s, 3); g.fillRect(((i * 97) % s), i * h, 3, h); } };
T.planks = canvasTex(256, plankDraw('#8a6440', '#3a2412'), [2, 1]);
T.floor = canvasTex(256, plankDraw('#6e4a2c', '#2b1a0c'), [2, 2]);
T.wall = canvasTex(256, plankDraw('#c8b08a', '#7a6248'), [2, 1]);
T.shingle = canvasTex(256, (g, s) => { g.fillStyle = '#3a2a22'; g.fillRect(0, 0, s, s); const rows = 8, w = s / 6, h = s / rows; for (let r = 0; r < rows; r++) for (let c = -1; c < 7; c++) { const x = c * w + (r % 2) * w / 2; g.fillStyle = `hsl(${rand(10, 25)},${rand(20, 35)}%,${rand(22, 34)}%)`; g.fillRect(x + 1, r * h + 1, w - 2, h - 2); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, r * h + h - 4, w, 4); } }, [4, 3]);
T.stone = canvasTex(256, (g, s) => { g.fillStyle = '#5b5650'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 32) for (let x = -20; x < s; x += 44) { g.fillStyle = `hsl(30,${rand(3, 12)}%,${rand(38, 58)}%)`; g.beginPath(); g.roundRect(x + (y / 32 % 2) * 22 + 2, y + 2, 40, 28, 8); g.fill(); } }, [1, 2]);
T.fur = canvasTex(256, (g, s) => { g.fillStyle = '#8c5a34'; g.fillRect(0, 0, s, s); for (let i = 0; i < 9000; i++) { const l = rand(25, 70); g.strokeStyle = `hsla(${rand(18, 32)},${rand(30, 60)}%,${l}%,.35)`; const x = Math.random() * s, y = Math.random() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-1, 1), y + rand(3, 7)); g.stroke(); } }, [2, 2]);
T.rug = canvasTex(256, (g, s) => { g.fillStyle = '#7a2a20'; g.fillRect(0, 0, s, s); g.strokeStyle = '#e3b45a'; g.lineWidth = 8; g.strokeRect(16, 16, s - 32, s - 32); g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.strokeRect(40 + i * 14, 40 + i * 14, s - 80 - i * 28, s - 80 - i * 28); } });
T.leaf = canvasTex(64, (g, s) => { g.clearRect(0, 0, s, s); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(32, 32, 14, 26, .6, 0, 7); g.fill(); }, [1, 1]);
T.dot = canvasTex(64, (g, s) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s); });

const M = {
  bark: new THREE.MeshStandardMaterial({ map: T.bark, bumpMap: T.bark, bumpScale: 2, roughness: .95 }),
  planks: new THREE.MeshStandardMaterial({ map: T.planks, bumpMap: T.planks, bumpScale: 1.2, roughness: .85 }),
  wall: new THREE.MeshStandardMaterial({ map: T.wall, bumpMap: T.wall, roughness: .9 }),
  floor: new THREE.MeshStandardMaterial({ map: T.floor, bumpMap: T.floor, roughness: .6, metalness: .02 }),
  shingle: new THREE.MeshStandardMaterial({ map: T.shingle, bumpMap: T.shingle, bumpScale: 2, roughness: .9 }),
  stone: new THREE.MeshStandardMaterial({ map: T.stone, bumpMap: T.stone, bumpScale: 2, roughness: .95 }),
  ground: new THREE.MeshStandardMaterial({ map: T.grass, bumpMap: T.grass, bumpScale: 1.5, roughness: 1 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xffc070, emissive: 0xff9a40, emissiveIntensity: 1.6, roughness: .2 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: .9, roughness: .35 }),
  screen: new THREE.MeshStandardMaterial({ color: 0x777777, metalness: .8, roughness: .5, wireframe: true }),
  dark: new THREE.MeshStandardMaterial({ color: 0x0a0806, roughness: 1 }),
  rug: new THREE.MeshStandardMaterial({ map: T.rug, roughness: 1 }),
  fire: new THREE.MeshStandardMaterial({ color: 0xff7a20, emissive: 0xff5a10, emissiveIntensity: 3 }),
};
const box = (w, h, d, mat, x, y, z, parent = scene, shadow = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; };

// ---------- static world (forest persists across levels) ----------
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.ground); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const forestTrees = []; // {x,z,r,h}
{
  const N = 260, trunkG = new THREE.CylinderGeometry(.35, .6, 1, 9); trunkG.translate(0, .5, 0);
  const folG = new THREE.IcosahedronGeometry(1, 1);
  const trunks = new THREE.InstancedMesh(trunkG, M.bark, N);
  const folMat = new THREE.MeshStandardMaterial({ roughness: .85, flatShading: true });
  const fol = new THREE.InstancedMesh(folG, folMat, N * 4);
  trunks.castShadow = fol.castShadow = true; trunks.receiveShadow = fol.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(); let i = 0, f = 0;
  while (i < N) {
    const x = (srand() - .5) * 180, z = (srand() - .5) * 180;
    if (Math.hypot(x, z) < 14 || (Math.abs(x) < 3 && z > 10 && z < 40) || (x > -6 && x < 44 && Math.abs(z) < 8)) continue;
    const h = 7 + srand() * 7, r = .35 + srand() * .25;
    m4.compose(new THREE.Vector3(x, 0, z), q.identity(), new THREE.Vector3(r / .45, h, r / .45)); trunks.setMatrixAt(i, m4);
    for (let k = 0; k < 4; k++) { const s = (2.6 - k * .45) * (h / 10) * 1.3; m4.compose(new THREE.Vector3(x + (srand() - .5), h * .55 + k * h * .14, z + (srand() - .5)), q.setFromEuler(new THREE.Euler(srand(), srand(), 0)), new THREE.Vector3(s, s * .8, s)); fol.setMatrixAt(f, m4); fol.setColorAt(f++, c.setHSL(.22 + srand() * .1, .45 + srand() * .2, .2 + srand() * .12)); }
    forestTrees.push({ x, z, r: r + .1, h: h * .6 }); i++;
  }
  scene.add(trunks, fol);
  // grass tufts + rocks + mushrooms
  const tuftG = new THREE.ConeGeometry(.08, .45, 4); tuftG.translate(0, .22, 0);
  const tufts = new THREE.InstancedMesh(tuftG, new THREE.MeshStandardMaterial({ color: 0x6b8a34, roughness: 1 }), 5000);
  for (let j = 0; j < 5000; j++) { let tx = (srand() - .5) * 120, tz = (srand() - .5) * 120; if (Math.abs(tx) < 6.5 && Math.abs(tz) < 6) tx += 14; m4.compose(new THREE.Vector3(tx, 0, tz), q.setFromEuler(new THREE.Euler((srand() - .5) * .5, srand() * 6, (srand() - .5) * .5)), new THREE.Vector3(1, .6 + srand(), 1)); tufts.setMatrixAt(j, m4); tufts.setColorAt(j, c.setHSL(.2 + srand() * .08, .5, .22 + srand() * .15)); }
  scene.add(tufts);
  const rockG = new THREE.DodecahedronGeometry(.6, 0), rocks = new THREE.InstancedMesh(rockG, M.stone, 120); rocks.castShadow = rocks.receiveShadow = true;
  for (let j = 0; j < 120; j++) { const s = .3 + srand() * 1.2; let rx = (srand() - .5) * 160, rz = (srand() - .5) * 160; if ((Math.abs(rx) < 8 && Math.abs(rz) < 7) || (rx > -6 && rx < 44 && Math.abs(rz) < 8)) rz += 20; m4.compose(new THREE.Vector3(rx, s * .2, rz), q.setFromEuler(new THREE.Euler(srand(), srand(), srand())), new THREE.Vector3(s, s * .6, s)); rocks.setMatrixAt(j, m4); }
  scene.add(rocks);
  const capG = new THREE.SphereGeometry(.12, 10, 6, 0, 6.3, 0, 1.6), caps = new THREE.InstancedMesh(capG, new THREE.MeshStandardMaterial({ color: 0xc23a22, roughness: .5 }), 200);
  for (let j = 0; j < 200; j++) { let mx = (srand() - .5) * 100, mz = (srand() - .5) * 100; if (Math.abs(mx) < 8 && Math.abs(mz) < 7) mz += 15; m4.compose(new THREE.Vector3(mx, .12, mz), q.identity(), new THREE.Vector3(1, 1, 1)); caps.setMatrixAt(j, m4); }
  scene.add(caps);
}

// ---------- particles: leaves, dust, fireflies ----------
function makePoints(n, color, size, opacity, map, additive) {
  const g = new THREE.BufferGeometry(); const p = new Float32Array(n * 3); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ color, size, map, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts); return { pts, p, v: new Float32Array(n * 3), n };
}
const leaves = makePoints(260, 0xd9822b, .35, .95, T.leaf, false);
const motes = makePoints(160, 0xffe2a8, .08, .6, T.dot, true);
const flies = makePoints(50, 0xfff27a, .22, 1, T.dot, true);
function seedParticles(P, cx, cy, cz, spread, hy) { for (let i = 0; i < P.n; i++) { P.p[i * 3] = cx + rand(-spread, spread); P.p[i * 3 + 1] = cy + rand(0, hy); P.p[i * 3 + 2] = cz + rand(-spread, spread); P.v[i * 3] = rand(-.3, .3); P.v[i * 3 + 1] = rand(-.6, -.2); P.v[i * 3 + 2] = rand(-.3, .3); } P.pts.geometry.attributes.position.needsUpdate = true; }
function updateParticles(P, dt, c, spread, hy, mode, t) {
  for (let i = 0; i < P.n; i++) {
    const k = i * 3;
    if (mode === 'leaf') { P.p[k] += (P.v[k] + Math.sin(t + i) * .5) * dt; P.p[k + 1] += P.v[k + 1] * dt; P.p[k + 2] += (P.v[k + 2] + Math.cos(t * .7 + i) * .5) * dt; }
    else { P.p[k] += Math.sin(t * .5 + i * 1.3) * dt * .15; P.p[k + 1] += Math.cos(t * .4 + i) * dt * .1; P.p[k + 2] += Math.cos(t * .6 + i * .7) * dt * .15; }
    if (P.p[k + 1] < 0 || Math.abs(P.p[k] - c.x) > spread || Math.abs(P.p[k + 2] - c.z) > spread) { P.p[k] = c.x + rand(-spread, spread); P.p[k + 1] = mode === 'leaf' ? c.y + rand(4, hy) : rand(.3, hy); P.p[k + 2] = c.z + rand(-spread, spread); }
  }
  P.pts.geometry.attributes.position.needsUpdate = true;
}
seedParticles(leaves, 0, 0, 0, 25, 14); seedParticles(motes, 0, 0, 0, 5, 3.5); seedParticles(flies, 0, 0, 0, 20, 3);

// ---------- squirrel ----------
const furMat = new THREE.MeshPhysicalMaterial({ map: T.fur, bumpMap: T.fur, bumpScale: 3, roughness: .85, sheen: 1, sheenRoughness: .4, sheenColor: new THREE.Color(0xffc89a) });
const bellyMat = new THREE.MeshPhysicalMaterial({ color: 0xf0dcc0, roughness: .9, sheen: 1, sheenColor: new THREE.Color(0xffffff) });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x050302, roughness: .05, metalness: .2 });
const sq = new THREE.Group(); scene.add(sq);
const body = new THREE.Group(); sq.add(body);
const sph = (r, mat, p, s = [1, 1, 1], parent = body) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat); m.position.set(...p); m.scale.set(...s); m.castShadow = true; parent.add(m); return m; };
sph(.2, furMat, [0, .26, 0], [1, .95, 1.45]);
sph(.15, bellyMat, [0, .22, .08], [.95, .9, 1.2]);
const head = new THREE.Group(); head.position.set(0, .42, .26); body.add(head);
sph(.14, furMat, [0, 0, 0], [1, .95, 1.05], head);
sph(.08, furMat, [0, -.03, .11], [1, .85, 1.1], head);
sph(.03, eyeMat, [0, -.01, .2], [1, .8, .8], head);
for (const sx of [-1, 1]) {
  sph(.035, eyeMat, [sx * .075, .035, .11], [1, 1, 1], head); sph(.01, new THREE.MeshBasicMaterial({ color: 0xffffff }), [sx * .085, .05, .14], [1, 1, 1], head);
  const ear = new THREE.Mesh(new THREE.ConeGeometry(.045, .12, 8), furMat); ear.position.set(sx * .07, .14, -.02); ear.rotation.z = -sx * .25; head.add(ear);
  sph(.022, bellyMat, [sx * .06, -.08, .13], [1, 1, .6], head); // cheeks
}
const legs = [];
for (const [x, z] of [[-.1, .2], [.1, .2], [-.12, -.15], [.12, -.15]]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.04, .12, 4, 8), furMat); l.position.set(x, .1, z); l.castShadow = true; body.add(l); legs.push(l); }
const TAILN = 13, tail = [], tailPos = [];
for (let i = 0; i < TAILN; i++) { const r = .08 + Math.sin(i / (TAILN - 1) * Math.PI) * .13; const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), furMat); m.castShadow = true; scene.add(m); tail.push(m); tailPos.push(new THREE.Vector3()); }
const tailRest = []; for (let i = 0; i < TAILN; i++) { const a = i / (TAILN - 1); tailRest.push(new THREE.Vector3(0, .28 + Math.sin(a * 2.2) * .42, -.3 - Math.sin(a * 1.7) * .26 + a * a * .2)); }
function updateTail(dt, t, speed) {
  sq.updateMatrixWorld();
  for (let i = 0; i < TAILN; i++) {
    const rest = tailRest[i].clone(); rest.x += Math.sin(t * 3 + i * .5) * .03 * i; rest.y += Math.sin(t * 2 + i * .4) * .02 * i * (1 + speed * .2);
    const target = rest.applyMatrix4(body.matrixWorld);
    const k = 1 - Math.exp(-dt * (40 - i * 3.6));
    if (i === 0 || tailPos[i].distanceTo(target) > 1.2) tailPos[i].copy(target); else tailPos[i].lerp(target, k);
    tail[i].position.copy(tailPos[i]);
  }
}

// ---------- level world (rebuilt per level) ----------
let L = null, levelGroup = null;
let decor = [], boxes = [], trees = [], portals = [], npcs = [], walls = [], roofMeshes = [], ceiling = null, foodObj = null, interiorLight = null;
const cab = { w: 10, d: 8, h: 4, run: 4.6, rise: 2.4 };
const roofY = (x, z) => (!L || L.course) ? -Infinity : (Math.abs(x) <= cab.w / 2 + .6 && Math.abs(z) <= cab.run) ? cab.h + (cab.run - Math.abs(z)) * cab.rise / cab.run + .08 : -Infinity;
const addBox = (minx, miny, minz, maxx, maxy, maxz, opts = {}) => boxes.push({ min: new THREE.Vector3(minx, miny, minz), max: new THREE.Vector3(maxx, maxy, maxz), ...opts });
const bx = (w, h, d, mat, x, y, z, collide = true, opts) => { const m = box(w, h, d, mat, x, y, z, levelGroup); if (collide) addBox(x - w / 2, y - h / 2, z - d / 2, x + w / 2, y + h / 2, z + d / 2, opts); return m; };

function buildCabin(cfg) {
  const { w, d, h } = cab, t = .3;
  bx(w + .6, .3, d + .6, M.stone, 0, .15 - .3, 0, false); // foundation lip
  const fl = bx(w, .04, d, M.floor, 0, .01, 0, false); fl.material = M.floor;
  // walls: [mesh, outward normal]
  const mk = (W, D, x, z, n) => { const m = bx(W, h, D, M.wall, x, h / 2, z, true, { wall: true }); m.material = [M.planks, M.planks, M.planks, M.planks, M.planks, M.planks]; walls.push({ m, n: new THREE.Vector3(...n), x, z }); };
  mk(w, t, 0, d / 2, [0, 0, 1]); mk(w, t, 0, -d / 2, [0, 0, -1]); mk(t, d, w / 2, 0, [1, 0, 0]); mk(t, d, -w / 2, 0, [-1, 0, 0]);
  // interior wall lining (lighter) so inside reads warm
  for (const W of walls) { const li = new THREE.Mesh(new THREE.PlaneGeometry(W.n.x ? d : w, h), M.wall); li.position.set(W.x - W.n.x * .16, h / 2, W.z - W.n.z * .16); li.lookAt(li.position.clone().sub(W.n)); li.receiveShadow = true; levelGroup.add(li); W.lining = li; }
  // windows (glowing) + door
  const dec = (m, n) => decor.push({ m, n: new THREE.Vector3(...n), x: m.position.x, z: m.position.z });
  for (const x of [-3, 3]) { dec(bx(1.4, 1.1, .05, M.glass, x, 2.4, d / 2 + .16, false), [0, 0, 1]); dec(bx(1.6, .12, .2, M.planks, x, 1.8, d / 2 + .2, false), [0, 0, 1]); }
  dec(bx(1.4, 1.1, .05, M.glass, -2, 2.4, -d / 2 - .16, false), [0, 0, -1]);
  dec(bx(1.4, 2.6, .08, new THREE.MeshStandardMaterial({ map: T.planks, color: 0x6a3a22 }), 0, 1.3, d / 2 + .17, false), [0, 0, 1]);
  dec(box(.08, .08, .08, M.metal, .5, 1.3, d / 2 + .24, levelGroup), [0, 0, 1]);
  bx(4, .2, 2, M.planks, 0, .1, d / 2 + 1.1, true); // porch step
  // roof
  const len = Math.hypot(cab.run, cab.rise), ang = Math.atan2(cab.rise, cab.run);
  for (const s of [1, -1]) { const r = box(w + 1.2, .16, len, M.shingle, 0, h + cab.rise / 2, s * cab.run / 2, levelGroup); r.rotation.x = s * ang; roofMeshes.push(r); }
  const gs = new THREE.Shape(); gs.moveTo(-d / 2, 0); gs.lineTo(d / 2, 0); gs.lineTo(0, cab.rise * (d / 2) / cab.run); gs.closePath();
  for (const s of [1, -1]) { const g = new THREE.Mesh(new THREE.ShapeGeometry(gs), new THREE.MeshStandardMaterial({ map: T.planks, side: THREE.DoubleSide, roughness: .9 })); g.material.map = T.planks.clone(); g.material.map.repeat.set(.25, .25); g.position.set(s * w / 2, h, 0); g.rotation.y = Math.PI / 2; g.castShadow = true; levelGroup.add(g); roofMeshes.push(g); }
  // attic floor / ceiling
  ceiling = bx(w, .2, d, M.floor, 0, h, 0, true);
  addBox(-w / 2, h, d / 2 - .9, w / 2, h + .7, d / 2, { attic: true }); addBox(-w / 2, h, -d / 2, w / 2, h + .7, -d / 2 + .9, { attic: true }); // attic eave stops
  // chimney
  if (cfg.chimney) { bx(1.1, 3.2, 1.1, M.stone, 3.5, h + 1.4, -1.5); bx(1.1, .2, 1.1, M.stone, 3.5, h + 3.05, -1.5); box(.7, .05, .7, M.dark, 3.5, h + 3.16, -1.5, levelGroup, false); }
  // furniture
  bx(4, 1.1, 1.2, M.planks, -2.5, .55, -d / 2 + .75); bx(4.1, .08, 1.3, new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: .3 }), -2.5, 1.14, -d / 2 + .75);
  bx(2.2, .1, 1.4, M.planks, 2, .95, 1, true, { cover: true }); for (const [x, z] of [[1, .4], [3, .4], [1, 1.6], [3, 1.6]]) bx(.1, .9, .1, M.planks, x, .45, z, false);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.2), M.rug); rug.rotation.x = -Math.PI / 2; rug.position.set(2.5, .04, -1.6); rug.receiveShadow = true; levelGroup.add(rug);
  if (cfg.chimney) { bx(1.8, 1.6, .8, M.stone, 3.5, .8, -d / 2 + .55); box(.9, .5, .3, M.fire, 3.5, .35, -d / 2 + .9, levelGroup, false); }
  bx(.6, 2.4, 2, M.planks, -w / 2 + .5, 1.2, 1.5, true); // shelf
  interiorLight = new THREE.PointLight(0xffb060, 18, 14, 1.6); interiorLight.position.set(0, h - .6, 0); levelGroup.add(interiorLight);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.18, 12, 8), M.glass); lamp.position.copy(interiorLight.position); levelGroup.add(lamp);
}
function addTree(o) {
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(o.r * .7, o.r, o.h, 12), M.bark); tr.position.set(o.x, o.h / 2, o.z); tr.castShadow = tr.receiveShadow = true; levelGroup.add(tr);
  for (let k = 0; k < 4; k++) { const s = 2.8 - k * .5; const f = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(.25, .45, .22 + k * .03), flatShading: true, roughness: .85 })); f.position.set(o.x, o.h * .8 + k * 1.2, o.z); f.castShadow = true; levelGroup.add(f); }
  if (o.collar) { const c = new THREE.Mesh(new THREE.CylinderGeometry(o.r + .05, o.r + .05, .8, 16, 1, true), M.metal); c.position.set(o.x, 2.2, o.z); levelGroup.add(c); }
  for (const b of o.branches || []) {
    const dx = Math.sin(b.dir), dz = Math.cos(b.dir), cx = o.x + dx * (o.r + b.len / 2), cz = o.z + dz * (o.r + b.len / 2);
    const m = new THREE.Mesh(new THREE.BoxGeometry(.5, .22, b.len), M.bark); m.position.set(cx, b.y, cz); m.rotation.y = b.dir; m.castShadow = true; levelGroup.add(m);
    const ex = Math.abs(dx) * b.len / 2 + Math.abs(dz) * .3, ez = Math.abs(dz) * b.len / 2 + Math.abs(dx) * .3;
    addBox(cx - ex, b.y - .11, cz - ez, cx + ex, b.y + .11, cz + ez, { branch: true });
    const tip = new THREE.Mesh(new THREE.IcosahedronGeometry(.8, 0), new THREE.MeshStandardMaterial({ color: 0x4f6e2a, flatShading: true })); tip.position.set(o.x + dx * (o.r + b.len), b.y + .7, o.z + dz * (o.r + b.len)); levelGroup.add(tip);
  }
  trees.push(o);
}
let movers = [], courseT = 0;
function buildCourse(parts) {
  const wood = M.planks, flag = new THREE.MeshStandardMaterial({ color: 0xd8402a, emissive: 0x601008 });
  for (const q of parts) {
    if (q.t === 'pole') {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.18, .2, q.h, 12), q.slinky ? new THREE.MeshStandardMaterial({ color: 0xc0c4c8, metalness: .8, roughness: .3, wireframe: false }) : M.metal); pole.position.set(q.x, q.h / 2, q.z || 0); pole.castShadow = true; levelGroup.add(pole);
      if (q.slinky) for (let k = 0; k < 26; k++) { const c = new THREE.Mesh(new THREE.TorusGeometry(.26, .03, 6, 20), M.metal); c.rotation.x = Math.PI / 2; c.position.y = k * q.h / 26 - q.h / 2; pole.add(c); }
      const tr = { x: q.x, z: q.z || 0, bx: q.x, r: .2, h: q.h, slinky: q.slinky, baffle: q.baffle, mesh: pole };
      if (q.baffle) { const b = new THREE.Mesh(new THREE.ConeGeometry(.9, .7, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a6a8a, metalness: .6, roughness: .3, side: THREE.DoubleSide })); b.position.set(q.x, q.baffle + .35, tr.z); levelGroup.add(b); }
      trees.push(tr); if (q.slinky) movers.push({ tree: tr });
    } else if (q.t === 'plat' || q.t === 'rope') {
      const w = q.t === 'rope' ? .1 : (q.w || 1.4), th = q.t === 'rope' ? .08 : .25, cx = (q.x0 + q.x1) / 2, L2 = q.x1 - q.x0;
      const m = box(L2, th, w, q.t === 'rope' ? new THREE.MeshStandardMaterial({ color: 0xd8c8a0, roughness: 1 }) : wood, cx, q.top - th / 2, 0, levelGroup);
      addBox(q.x0, q.top - th, -w / 2, q.x1, q.top, w / 2, { rope: q.t === 'rope', cp: q.cp ? new THREE.Vector3(cx, q.top, 0) : null });
      if (q.t === 'plat') { const leg = box(.12, q.top - th, .12, M.planks, cx, (q.top - th) / 2, 0, levelGroup); }
      if (q.cp) { const f = box(.05, .9, .05, M.metal, q.x0 + .15, q.top + .45, w / 2 - .1, levelGroup); box(.4, .25, .02, flag, q.x0 + .37, q.top + .75, w / 2 - .1, levelGroup); }
      if (q.t === 'rope') for (const x of [q.x0, q.x1]) box(.1, q.top, .1, M.planks, x, q.top / 2, 0, levelGroup);
    } else if (q.t === 'roller') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, q.len, 16), new THREE.MeshStandardMaterial({ color: 0xc23a22, roughness: .4, map: T.planks })); m.rotation.x = Math.PI / 2; m.position.set(q.x, q.top - .3, 0); m.castShadow = true; levelGroup.add(m);
      box(.1, q.top - .3, .1, M.metal, q.x, (q.top - .3) / 2, q.len / 2, levelGroup); box(.1, q.top - .3, .1, M.metal, q.x, (q.top - .3) / 2, -q.len / 2, levelGroup);
      addBox(q.x - .3, q.top - .6, -q.len / 2, q.x + .3, q.top, q.len / 2, { roller: q.dir || 1, mesh: m });
    } else if (q.t === 'swing') {
      const m = box(1.2, .2, 1.2, wood, q.x, q.top - .1, 0, levelGroup);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 4, 4), M.metal); levelGroup.add(rope);
      addBox(q.x - .6, q.top - .2, -.6, q.x + .6, q.top, .6, {}); const b = boxes[boxes.length - 1];
      movers.push({ box: b, mesh: m, rope, q });
    }
  }
  box(60, .3, .3, M.planks, 19, 8, 0, levelGroup); // overhead beam for swing ropes
}
function stepWorld(dt) {
  courseT += dt;
  for (const mv of movers) {
    if (mv.tree) { const t = mv.tree, nx = t.bx + Math.sin(courseT * 1.4) * .35; if (P.climb === t) P.pos.x += nx - t.x; t.x = nx; t.mesh.position.x = nx; t.mesh.rotation.z = Math.sin(courseT * 1.4) * -.05; continue; }
    const q = mv.q, z = Math.sin(courseT * q.speed + (q.phase || 0)) * q.amp, dz = z - (mv.box.min.z + .6);
    mv.box.min.z += dz; mv.box.max.z += dz; mv.mesh.position.z = z;
    mv.rope.position.set(q.x, (8 + q.top) / 2, z / 2); mv.rope.scale.y = (8 - q.top) / 4; mv.rope.rotation.x = Math.atan2(z, 8 - q.top);
    if (P.groundBox === mv.box) P.pos.z += dz;
  }
  for (const b of boxes) if (b.roller) b.mesh.rotation.y += dt * 6 * b.roller;
}
function losBlocked(a, b) {
  const d = b.clone().sub(a);
  for (const bx of boxes) {
    if (bx.branch || bx.attic || bx.cover) continue;
    let t0 = 0, t1 = 1, ok = true;
    for (const ax of ['x', 'y', 'z']) {
      if (Math.abs(d[ax]) < 1e-6) { if (a[ax] < bx.min[ax] || a[ax] > bx.max[ax]) { ok = false; break; } continue; }
      let ta = (bx.min[ax] - a[ax]) / d[ax], tb = (bx.max[ax] - a[ax]) / d[ax]; if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) { ok = false; break; }
    }
    if (ok && t1 > .02 && t0 < .98) return true;
  }
  return false;
}
function npcBlocked(x, z) { for (const b of boxes) if (!b.branch && !b.attic && b.min.y < 1 && b.max.y > .1 && x + .3 > b.min.x && x - .3 < b.max.x && z + .3 > b.min.z && z - .3 < b.max.z) return true; return false; }
const FOOD = {
  bread: () => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CapsuleGeometry(.18, .35, 6, 12), new THREE.MeshStandardMaterial({ color: 0xc8843c, roughness: .7 })); m.rotation.z = Math.PI / 2; g.add(m); return g; },
  peanut: () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .32, 16), new THREE.MeshPhysicalMaterial({ color: 0xb8742a, transmission: .3, roughness: .2 }))); const l = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .08, 16), new THREE.MeshStandardMaterial({ color: 0xd8402a })); l.position.y = .2; g.add(l); return g; },
  nuts: () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .2, .15, 16), M.planks)); for (let i = 0; i < 9; i++) { const n = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8a5a2a })); n.position.set(rand(-.18, .18), .1 + rand(0, .06), rand(-.18, .18)); g.add(n); } return g; },
  seed: () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(.4, .5, .25), new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 1 })); b.position.y = .25; g.add(b); return g; },
  tin: () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .25, 20), new THREE.MeshStandardMaterial({ color: 0x2a5a8a, metalness: .7, roughness: .3 }))); const lid = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .05, 20), M.metal); lid.position.y = .15; lid.name = 'lid'; g.add(lid); const latch = new THREE.Mesh(new THREE.BoxGeometry(.05, .12, .05), new THREE.MeshStandardMaterial({ color: 0xd8402a, metalness: .5 })); latch.position.set(0, .12, .26); latch.name = 'latch'; g.add(latch); return g; },
};
function sector(r, fov) { const g = new THREE.CircleGeometry(r, 24, Math.PI / 2 - fov / 2, fov); g.rotateX(-Math.PI / 2); return g; }
function makeNPC(o) {
  const g = new THREE.Group(); const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: .8 });
  const parts = {};
  if (o.type === 'person') {
    const pants = mat(0x2c3a52), shirt = mat(o.shirt || 0x7a2a22), skin = mat(0xe0b08a);
    for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .7, 4, 8), pants); l.position.set(s * .15, .45, 0); g.add(l); parts['leg' + s] = l; const a = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .55, 4, 8), shirt); a.position.set(s * .36, 1.25, 0); g.add(a); parts['arm' + s] = a; }
    const t = new THREE.Mesh(new THREE.CapsuleGeometry(.26, .5, 4, 12), shirt); t.position.y = 1.25; g.add(t);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(.2, 16, 12), skin); hd.position.y = 1.82; g.add(hd);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(.21, 16, 12, 0, 6.3, 0, 1.5), mat(0x3a2414)); hair.position.y = 1.86; g.add(hair);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), M.dark); e.position.set(s * .07, 1.85, .18); g.add(e); }
  } else {
    const c = o.type === 'cat' ? 0x3a3a3e : 0xb07a3a, m = mat(c), s = o.type === 'cat' ? .7 : 1.1;
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(.18 * s, .5 * s, 4, 10), m); b.rotation.x = Math.PI / 2; b.position.y = .4 * s; g.add(b); parts.body = b;
    const hd = new THREE.Mesh(new THREE.SphereGeometry(.17 * s, 14, 10), m); hd.position.set(0, .55 * s, .42 * s); g.add(hd); parts.head = hd;
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(o.type === 'cat' ? new THREE.ConeGeometry(.06 * s, .14 * s, 6) : new THREE.SphereGeometry(.07 * s, 8, 6), m); e.position.set(sx * .1 * s, .7 * s, .4 * s); if (o.type === 'dog') e.scale.set(.6, 1.4, .6); g.add(e); const ey = new THREE.Mesh(new THREE.SphereGeometry(.025 * s, 8, 6), new THREE.MeshStandardMaterial({ color: o.type === 'cat' ? 0x9adf50 : 0x111111, emissive: o.type === 'cat' ? 0x2a5a10 : 0 })); ey.position.set(sx * .07 * s, .58 * s, .56 * s); g.add(ey); parts['eye' + sx] = ey; }
    for (const [x, z] of [[-.1, .25], [.1, .25], [-.1, -.25], [.1, -.25]]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.05 * s, .25 * s, 4, 6), m); l.position.set(x * s, .17 * s, z * s); g.add(l); }
    const tl = new THREE.Mesh(new THREE.CapsuleGeometry(.04 * s, .4 * s, 4, 6), m); tl.position.set(0, .55 * s, -.45 * s); tl.rotation.x = -.8; g.add(tl); parts.tail = tl;
  }
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; } });
  const range = o.range || (o.type === 'person' ? 7 : o.type === 'dog' ? 6 : 5), fov = (o.fov || (o.type === 'person' ? 70 : 90)) * Math.PI / 180;
  const cone = new THREE.Mesh(sector(range, fov), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .16, depthWrite: false })); cone.position.y = .06; g.add(cone);
  const zzz = document.createElement('div');
  g.position.set(o.path[0][0], o.y || 0, o.path[0][1]); levelGroup.add(g);
  return { ...o, g, parts, cone, range, fov, wp: 1, detect: 0, alert: 0, asleep: !!o.sleep, wakeT: 0, look: 0, speed: o.speed || 1.2, t: Math.random() * 10 };
}
function loadLevel(i) {
  if (levelGroup) { scene.remove(levelGroup); levelGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  levelGroup = new THREE.Group(); scene.add(levelGroup);
  decor = []; boxes = []; trees = []; portals = []; npcs = []; walls = []; roofMeshes = [];
  L = { ...LEVELS[i], idx: i };
  ceiling = null; interiorLight = null; movers = []; P.cp = null; courseT = 0;
  if (L.course) buildCourse(L.parts); else buildCabin(L.cabin || {});
  for (const t of forestTrees) if (Math.hypot(t.x, t.z) > 13) trees.push(t);
  for (const t of L.trees || []) addTree(t);
  for (const p of L.portals) {
    const P = { ...p, a: new THREE.Vector3(...p.a), b: new THREE.Vector3(...p.b), chewed: 0 };
    // visual: dark hole + optional screen
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(p.hw || .55, p.hh || .4), M.dark); hole.position.copy(P.a).add(new THREE.Vector3(...(p.hole || [0, .2, 0]))); if (p.holeRot) hole.rotation.set(...p.holeRot); levelGroup.add(hole);
    if (p.chew) { const s = new THREE.Mesh(new THREE.PlaneGeometry(.6, .45, 6, 5), M.screen); s.position.copy(hole.position); s.position.z += .02; s.rotation.copy(hole.rotation); levelGroup.add(s); P.screen = s; }
    const ring = new THREE.Mesh(new THREE.RingGeometry(.28, .34, 24), new THREE.MeshBasicMaterial({ color: 0xffd79a, transparent: true, opacity: .55, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.copy(P.a).y += .03; levelGroup.add(ring); P.ring = ring;
    const ringB = ring.clone(); ringB.position.copy(P.b).y += .03; levelGroup.add(ringB);
    portals.push(P);
  }
  foodObj = { ...L.food, pos: new THREE.Vector3(...L.food.pos), m: FOOD[L.food.type](), progress: 0 };
  foodObj.m.position.copy(foodObj.pos); foodObj.m.traverse(m => { if (m.isMesh) m.castShadow = true; }); levelGroup.add(foodObj.m);
  const glow = new THREE.PointLight(0xffd080, 2, 2.5); glow.position.copy(foodObj.pos).y += .5; levelGroup.add(glow);
  for (const n of L.npcs || []) npcs.push(makeNPC(n));
  // player reset
  P.pos.set(...L.spawn); P.vel.set(0, 0, 0); P.climb = null; P.onGround = true; noise = 0; timeLeft = L.timer || 0; state = 'play'; carried = false;
  camYaw = L.camYaw ?? 0; camPitch = .35;
  sq.position.copy(P.pos); sq.updateMatrixWorld(); updateTail(1, 0, 0); for (let k = 0; k < TAILN; k++) tailPos[k].copy(tail[k].position);
  $('lvlName').textContent = `Level ${i + 1}: ${L.name}`; $('lvlObj').innerHTML = L.objective + `<div style="opacity:.7;margin-top:6px;font-style:italic">🐿 ${L.fact}</div>`;
  toast(L.name, 2200);
}

// ---------- player / input ----------
const P = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), onGround: true, climb: null, face: 0, bal: 0, groundBox: null, cp: null };
const keys = {}; let pressed = {};
addEventListener('keydown', e => { if (!keys[e.code]) pressed[e.code] = true; keys[e.code] = true; if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); if (e.code === 'Escape') showMenu(); if (e.code === 'KeyR' && L) loadLevel(L.idx), hideEnd(); });
addEventListener('keyup', e => keys[e.code] = false);
let camYaw = 0, camPitch = .35, camDist = 5, drag = null;
renderer.domElement.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch' || e.clientX > innerWidth / 2) drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
addEventListener('pointermove', e => { if (drag && drag.id === e.pointerId) { camYaw -= (e.clientX - drag.x) * .006; camPitch = THREE.MathUtils.clamp(camPitch + (e.clientY - drag.y) * .004, -.1, 1.2); drag.x = e.clientX; drag.y = e.clientY; } });
addEventListener('pointerup', e => { if (drag && drag.id === e.pointerId) drag = null; });
addEventListener('wheel', e => camDist = THREE.MathUtils.clamp(camDist + e.deltaY * .003, 2.5, 9));
// touch
const isTouch = 'ontouchstart' in window;
const isMob = () => isTouch || innerWidth < 760 || innerHeight < 480; const setMob = () => document.body.classList.toggle('mob', isMob()); setMob(); addEventListener('resize', setMob);
let infoTimer = 0; const lvlEl = $('lvl'), infoBtn = $('infoBtn');
function infoShow(full) { lvlEl.classList.remove('gone'); infoBtn.classList.remove('on'); lvlEl.classList.toggle('mini', !full); clearTimeout(infoTimer); if (full && isMob()) infoTimer = setTimeout(() => lvlEl.classList.add('mini'), 4000); }
function infoHide() { clearTimeout(infoTimer); lvlEl.classList.add('gone'); infoBtn.classList.add('on'); }
lvlEl.addEventListener('pointerdown', e => { e.stopPropagation(); infoShow(lvlEl.classList.contains('mini')); });
infoBtn.addEventListener('pointerdown', e => { e.stopPropagation(); infoShow(true); });
addEventListener('keydown', e => { if (e.code === 'KeyH' && state !== 'menu') lvlEl.classList.contains('gone') ? infoShow(true) : infoHide(); }); let joy = { x: 0, y: 0 }, sneakToggle = false;
if (isTouch) {
  $('touch').style.display = 'block'; const J = $('joy'), K = $('knob');
  const jm = e => { const r = J.getBoundingClientRect(), t = e.targetTouches[0]; let x = (t.clientX - r.left - 65) / 50, y = (t.clientY - r.top - 65) / 50; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } joy = { x, y }; K.style.left = 40 + x * 40 + 'px'; K.style.top = 40 + y * 40 + 'px'; e.preventDefault(); };
  J.addEventListener('touchstart', jm, { passive: false }); J.addEventListener('touchmove', jm, { passive: false }); J.addEventListener('touchend', () => { joy = { x: 0, y: 0 }; K.style.left = K.style.top = '40px'; });
  document.querySelectorAll('#tbtns button').forEach(b => { const k = b.dataset.k; b.addEventListener('touchstart', e => { e.preventDefault(); if (k === 'ShiftLeft') { sneakToggle = !sneakToggle; b.style.background = sneakToggle ? '#d8402a' : ''; return; } pressed[k] = true; keys[k] = true; }, { passive: false }); b.addEventListener('touchend', () => { keys[k] = false; }); });
}

// ---------- game state ----------
let state = 'menu', noise = 0, timeLeft = 0, carried = false, toastT = 0;
function toast(s, ms = 1500) { $('toast').innerHTML = s; $('toast').style.opacity = 1; toastT = ms / 1000; }
const save = JSON.parse(localStorage.getItem('sqh') || '{"unlocked":1}');
function showMenu() {
  state = 'menu'; document.body.classList.remove('playing'); $('start').style.display = 'flex'; $('hud').style.display = 'none'; hideEnd();
  const lv = $('levels'); lv.innerHTML = '';
  LEVELS.forEach((l, i) => { const b = document.createElement('button'); b.innerHTML = `${i + 1}. ${l.name}${i >= save.unlocked ? ' 🔒' : ''}`; b.disabled = i >= save.unlocked; b.onclick = () => startLevel(i); lv.appendChild(b); });
}
function startLevel(i) { $('start').style.display = 'none'; $('hud').style.display = 'block'; hideEnd(); loadLevel(i); document.body.classList.add('playing'); infoShow(true); }
function hideEnd() { $('end').style.display = 'none'; }
function endGame(win, msg) {
  state = win ? 'won' : 'lost'; $('end').style.display = 'flex';
  $('endT').innerHTML = win ? 'SNACK <span>SECURED</span>' : 'BUSTED'; $('endS').textContent = msg;
  if (win) { save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, L.idx + 2)); localStorage.setItem('sqh', JSON.stringify(save)); }
  const next = win && L.idx + 1 < LEVELS.length;
  $('endBtn').textContent = next ? 'Next level' : win ? 'Play again' : 'Retry (R)';
  $('endBtn').onclick = () => startLevel(next ? L.idx + 1 : L.idx);
}
$('play').onclick = () => startLevel(Math.min(save.unlocked, LEVELS.length) - 1);
$('endMenu').onclick = showMenu;

// ---------- physics ----------
const RAD = .22, HEIGHT = .5, GRAV = 24;
function isInside(p) { if (L.course) return false; return Math.abs(p.x) < cab.w / 2 && Math.abs(p.z) < cab.d / 2 && p.y < roofY(p.x, p.z) - .15; }
function hidden(p) { for (const b of boxes) if (b.cover && p.x > b.min.x && p.x < b.max.x && p.z > b.min.z && p.z < b.max.z && p.y + HEIGHT < b.min.y) return true; return false; }
function physics(dt, sneak) {
  const p = P.pos, v = P.vel;
  let ix = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x, iz = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0) + joy.y;
  const il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; }
  if (P.groundBox && P.groundBox.rope && P.onGround) {
    P.bal += (Math.sin(courseT * 1.9) * .5 + (Math.random() - .5) * 1.4 + P.bal * 1.1) * dt + ix * 2.6 * dt; ix = 0;
    if (Math.abs(P.bal) > 1) { const sgn = Math.sign(P.bal); P.bal = 0; p.z += sgn * .35; v.z = sgn * 2; toast('Lost your balance!'); }
  } else P.bal = 0;
  if (P.climb) {
    const t = P.climb; P.climbAng += ix * dt * 2.2 / Math.max(t.r, .4); p.y = THREE.MathUtils.clamp(p.y - iz * dt * 3.2 - (t.slinky && iz >= 0 ? .7 * dt : 0), 0, t.baffle && p.y < t.baffle ? t.baffle - .3 : t.h - .3);
    if (t.baffle && p.y >= t.baffle - .31 && iz < 0) toast('A baffle blocks the pole!');
    p.x = t.x + Math.sin(P.climbAng) * (t.r + .22); p.z = t.z + Math.cos(P.climbAng) * (t.r + .22); P.face = P.climbAng + Math.PI;
    if (pressed.Space) { P.climb = null; v.set(Math.sin(P.climbAng) * 6.5, 7, Math.cos(P.climbAng) * 6.5); P.face = P.climbAng; }
    else if (pressed.KeyC || (p.y <= 0 && iz > 0)) { P.climb = null; v.set(Math.sin(P.climbAng) * 2, 2, Math.cos(P.climbAng) * 2); }
    return il > .1 ? (sneak ? 8 : 18) : 2;
  }
  const fwd = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw)), right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
  const want = right.multiplyScalar(ix).add(fwd.multiplyScalar(-iz)).multiplyScalar(sneak ? 2.4 : 6);
  const acc = P.onGround ? 14 : 4; v.x += (want.x - v.x) * Math.min(1, acc * dt); v.z += (want.z - v.z) * Math.min(1, acc * dt);
  if (want.lengthSq() > .1) P.face = Math.atan2(want.x, want.z);
  if (pressed.Space && P.onGround) { v.y = 8.6; P.onGround = false; }
  // climb attempt
  if (pressed.KeyC) {
    let best = null, bd = 1e9; for (const t of trees) { const d = Math.hypot(p.x - t.x, p.z - t.z) - t.r; if (d < (P.onGround ? .7 : 1.05) && d < bd) { bd = d; best = t; } }
    if (best && best.collar && p.y < 2.8) toast('Metal collar on the trunk — too slick to climb!<br><small>Find another way up.</small>');
    else if (best) { P.climb = best; P.climbAng = Math.atan2(p.x - best.x, p.z - best.z); v.set(0, 0, 0); return 4; }
  }
  v.y -= GRAV * dt;
  const prevY = p.y, impactV = v.y;
  // vertical
  let ny = p.y + v.y * dt, landed = false, lb = null;
  for (const b of boxes) {
    if (b.attic && !P.inAttic) continue;
    if (p.x + RAD > b.min.x && p.x - RAD < b.max.x && p.z + RAD > b.min.z && p.z - RAD < b.max.z) {
      if (prevY >= b.max.y - .05 && ny < b.max.y) { ny = b.max.y; landed = true; lb = b; }
      else if (prevY + HEIGHT <= b.min.y + .02 && ny + HEIGHT > b.min.y) { ny = b.min.y - HEIGHT; v.y = Math.min(v.y, 0); }
    }
  }
  const ry = roofY(p.x, p.z);
  if (ry > -1e9) { if (prevY >= ry - .35 && ny < ry) { ny = ry; landed = true; } else if (prevY < ry - .3 && Math.abs(p.x) < cab.w / 2 && Math.abs(p.z) < cab.d / 2 && ny + HEIGHT > ry) { ny = ry - HEIGHT; v.y = Math.min(v.y, 0); } }
  if (ny <= 0) { ny = 0; landed = true; }
  p.y = ny; let landNoise = 0; P.groundBox = (landed && lb && ny === lb.max.y) ? lb : null;
  if (P.groundBox?.cp && P.cp !== P.groundBox.cp) { P.cp = P.groundBox.cp; toast('Checkpoint!'); }
  if (P.groundBox?.roller) v.z += P.groundBox.roller * 30 * dt;
  if (L.course && ny <= 0 && P.cp) { p.copy(P.cp); v.set(0, 0, 0); toast('Fell! Back to checkpoint'); P.falls = (P.falls || 0) + 1; return 0; }
  if (landed) { if (!P.onGround && impactV < -11) landNoise = sneak ? 15 : 35; v.y = Math.max(v.y, 0); if (v.y === 0) P.onGround = true; } else P.onGround = false;
  if (landed && v.y <= 0) P.onGround = true;
  // horizontal with box + trunk blocking
  for (const ax of ['x', 'z']) {
    const old = p[ax]; p[ax] += v[ax] * dt;
    for (const b of boxes) if (!(b.attic && !P.inAttic) && p.y < b.max.y - .06 && p.y + HEIGHT > b.min.y + .02 && p.x + RAD > b.min.x && p.x - RAD < b.max.x && p.z + RAD > b.min.z && p.z - RAD < b.max.z) { p[ax] = old; v[ax] = 0; break; }
  }
  for (const t of trees) { if (p.y > t.h) continue; const dx = p.x - t.x, dz = p.z - t.z, d = Math.hypot(dx, dz), m = t.r + RAD; if (d < m && d > 1e-4) { p.x = t.x + dx / d * m; p.z = t.z + dz / d * m; } }
  const R = Math.hypot(p.x, p.z); if (R > 85) { p.x *= 85 / R; p.z *= 85 / R; }
  const sp = Math.hypot(v.x, v.z);
  return landNoise + (sp < .3 ? 0 : sneak ? 6 : 22 + sp * 3);
}

// ---------- NPC AI ----------
function updateNPCs(dt, inside, sneak) {
  let maxD = 0; const p = P.pos, hid = hidden(p) || P.inAttic;
  for (const n of npcs) {
    n.t += dt; const g = n.g, gp = g.position, dist = Math.hypot(p.x - gp.x, p.z - gp.z), sameZone = n.inside === inside;
    // hearing
    if (sameZone && dist < (n.hear || 8) && noise > (n.asleep ? (n.wakeAt || 40) : 55)) {
      if (n.asleep) { n.asleep = false; toast(`The ${n.type} woke up!`); }
      n.look = 2.5;
    }
    if (n.asleep) { g.scale.y = 1 + Math.sin(n.t * 2) * .03; n.cone.visible = false; if (n.parts.eye1) n.parts.eye1.visible = n.parts['eye-1'].visible = false; continue; }
    n.cone.visible = true; if (n.parts.eye1) n.parts.eye1.visible = n.parts['eye-1'].visible = true; g.scale.y = 1;
    let targetYaw;
    if (n.look > 0) { n.look -= dt; targetYaw = Math.atan2(p.x - gp.x, p.z - gp.z); }
    else if (n.path.length > 1) {
      const w = n.path[n.wp], dx = w[0] - gp.x, dz = w[1] - gp.z, d = Math.hypot(dx, dz);
      if (d < .2) { n.wp = (n.wp + 1) % n.path.length; n.pause = n.pauseT || 1.2; }
      if (n.pause > 0) { n.pause -= dt; targetYaw = g.rotation.y + Math.sin(n.t) * .02; }
      else { const nx = gp.x + dx / d * n.speed * dt, nz = gp.z + dz / d * n.speed * dt; if (npcBlocked(nx, nz) && !npcBlocked(gp.x, gp.z)) { n.wp = (n.wp + 1) % n.path.length; } else { gp.x = nx; gp.z = nz; } targetYaw = Math.atan2(dx, dz); const sw = Math.sin(n.t * 8) * .5; if (n.parts.leg1) { n.parts.leg1.rotation.x = sw; n.parts['leg-1'].rotation.x = -sw; n.parts.arm1.rotation.x = -sw; n.parts['arm-1'].rotation.x = sw; } if (n.parts.tail) n.parts.tail.rotation.z = sw * .6; }
    } else targetYaw = (n.baseYaw ?? 0) + Math.sin(n.t * .4) * .9;
    if (n.sweep) targetYaw = (n.baseYaw || 0) + Math.sin(n.t * n.sweep) * 1.1;
    let dy = targetYaw - g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); g.rotation.y += dy * Math.min(1, dt * 4);
    // vision
    const fx = Math.sin(g.rotation.y), fz = Math.cos(g.rotation.y), ang = Math.acos(THREE.MathUtils.clamp(((p.x - gp.x) * fx + (p.z - gp.z) * fz) / Math.max(dist, 1e-3), -1, 1));
    let sees = sameZone && !hid && dist < n.range && ang < n.fov / 2 && Math.abs(p.y - gp.y) < 3;
    if (sees) sees = !losBlocked(new THREE.Vector3(gp.x, n.type === 'person' ? 1.7 : .5, gp.z), new THREE.Vector3(p.x, p.y + .25, p.z));
    const smells = n.type === 'dog' && sameZone && !P.inAttic && dist < 2.2;
    if (sees || smells) n.detect += dt * (sneak ? .55 : 1.1) * (1.4 - dist / n.range) * (n.type === 'dog' ? 1.3 : 1);
    else n.detect = Math.max(0, n.detect - dt * .35);
    n.cone.material.color.setHSL(.13 - Math.min(n.detect, 1) * .13, 1, .6); n.cone.material.opacity = .14 + n.detect * .25;
    maxD = Math.max(maxD, n.detect);
    if (n.detect >= 1) endGame(false, n.type === 'person' ? 'A homeowner spotted you and shooed you out with a broom.' : n.type === 'dog' ? 'The dog caught your scent and chased you up a tree.' : 'The cat pounced! You scrambled out empty-pawed.');
  }
  return maxD;
}

// ---------- main loop ----------
const clock = new THREE.Clock(); let gait = 0;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 1 / 30), t = clock.elapsedTime;
  const sneak = keys.ShiftLeft || keys.ShiftRight || sneakToggle;
  let prompt = '', prog = -1;
  if (state === 'play' && L) {
    stepWorld(dt); let nTarget = physics(dt, sneak);
    const inside = isInside(P.pos); P.inAttic = inside && P.pos.y > cab.h - .05;
    // interactions
    let nearP = null; for (const pt of portals) { if (pt.a.distanceTo(P.pos) < 1.1) nearP = [pt, 'a']; else if (pt.b.distanceTo(P.pos) < 1.1) nearP = [pt, 'b']; }
    const nearFood = foodObj.pos.distanceTo(P.pos) < 1.1;
    if (nearFood) {
      if (foodObj.locked && foodObj.progress < 1) { prompt = 'Hold E — pry the latch on the cookie tin'; prog = foodObj.progress; if (keys.KeyE) { foodObj.progress += dt / foodObj.locked; nTarget = Math.max(nTarget, 48); const lt = foodObj.m.getObjectByName('latch'); if (lt) lt.rotation.x = foodObj.progress * 1.5; if (foodObj.progress >= 1) { toast('Latch popped!'); const lid = foodObj.m.getObjectByName('lid'); if (lid) { lid.position.set(.3, .05, 0); lid.rotation.z = 1.2; } } } }
      else { prompt = `E — grab the ${L.foodName}`; if (pressed.KeyE) { foodObj.m.visible = false; endGame(true, L.winText); } }
    } else if (nearP) {
      const [pt, side] = nearP;
      if (pt.chew && pt.chewed < 1 && side === 'a') { prompt = 'Hold E — gnaw through the vent screen (loud!)'; prog = pt.chewed; if (keys.KeyE) { pt.chewed += dt / pt.chew; nTarget = Math.max(nTarget, 62); P.face = Math.atan2(pt.b.x - pt.a.x, pt.b.z - pt.a.z); if (pt.chewed >= 1) { pt.screen.visible = false; toast('Chewed through!'); } } }
      else { prompt = `E — ${side === 'a' ? pt.label : pt.back || 'squeeze back out'}`; if (pressed.KeyE) { P.pos.copy(side === 'a' ? pt.b : pt.a); P.vel.set(0, 0, 0); P.climb = null; nTarget += 6; } }
    }
    if (P.groundBox?.rope) { prompt = 'BALANCE — tap A/D to stay centered'; prog = .5 + P.bal / 2; }
    if (P.climb) prompt = prompt || 'W/S climb · A/D circle trunk · Space leap off · C let go';
    else if (!prompt) { for (const tr of trees) if (Math.hypot(P.pos.x - tr.x, P.pos.z - tr.z) - tr.r < .7) { prompt = 'C — climb tree'; break; } }
    noise += (nTarget - noise) * Math.min(1, dt * (nTarget > noise ? 6 : 2.5)); if (nTarget > 30 && nTarget - noise > 20) noise = nTarget * .8;
    const det = updateNPCs(dt, inside, sneak);
    if (L.timer && state === 'play') { timeLeft -= dt; if (timeLeft <= 0) endGame(false, L.timeoutText || 'Time ran out — the owners came home.'); }
    // HUD
    $('noise').firstChild.style.width = Math.min(100, noise) + '%'; $('detect').firstChild.style.width = Math.min(100, det * 100) + '%';
    $('timer').textContent = L.timer ? `⏱ ${Math.max(0, timeLeft).toFixed(0)}s` : '';
    $('state').textContent = (P.climb ? 'Climbing' : sneak ? 'Sneaking' : 'Scampering') + (hidden(P.pos) ? ' · Hidden' : '') + (P.inAttic ? ' · Attic' : inside ? ' · Inside' : '');
    // compass: next target
    let tgt = foodObj.pos; if (!inside && portals[0]) tgt = portals[0].a; else if (P.inAttic && portals[1]) tgt = (portals.find(q => q.a.y > cab.h - .2 && q.a.y < cab.h + .5) || portals[1]).a;
    const dx = tgt.x - P.pos.x, dz = tgt.z - P.pos.z, a = Math.atan2(dx, dz) - Math.atan2(-Math.sin(camYaw), -Math.cos(camYaw));
    $('arrow').style.transform = `rotate(${-a}rad)`; $('cdist').textContent = `${Math.hypot(dx, dz).toFixed(0)}m ${inside || L.course ? 'to snack' : 'to entry'}`;
    // camera hide walls/roof when inside
    const showRoof = !inside && !(P.pos.y < cab.h && Math.abs(P.pos.x) < cab.w / 2 && Math.abs(P.pos.z) < cab.d / 2);
    roofMeshes.forEach(r => r.visible = showRoof || P.pos.y > roofY(P.pos.x, P.pos.z) - .1);
    if (ceiling) ceiling.visible = !(inside && !P.inAttic);
    for (const W of walls) { const cv = camera.position.clone().sub(new THREE.Vector3(W.x, 0, W.z)); const show = !inside || cv.x * W.n.x + cv.z * W.n.z < 0; W.m.visible = show; }
    for (const D of decor) { const cv = camera.position.clone().sub(new THREE.Vector3(D.x, 0, D.z)); D.m.visible = !inside || cv.x * D.n.x + cv.z * D.n.z < 0; }
    if (interiorLight) interiorLight.intensity = inside ? 18 : 6;
    // squirrel animation
    sq.position.copy(P.pos); let dyaw = P.face - sq.rotation.y; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); sq.rotation.y += dyaw * Math.min(1, dt * 12);
    const sp = Math.hypot(P.vel.x, P.vel.z); gait += dt * (P.climb ? 10 : sp * 3.2);
    body.rotation.x = P.climb ? -Math.PI / 2 + .1 : (P.onGround ? Math.sin(gait) * .08 * Math.min(1, sp) : -P.vel.y * .03);
    body.position.y = P.climb ? .1 : Math.abs(Math.sin(gait)) * .06 * Math.min(1, sp); body.scale.y = sneak && !P.climb ? .8 : 1;
    legs.forEach((l, k) => l.rotation.x = Math.sin(gait + (k < 2 ? 0 : Math.PI)) * .9 * Math.min(1, sp + (P.climb ? 1 : 0)));
    head.rotation.y = Math.sin(t * 1.3) * .15 * (sp < .3 ? 1 : 0); head.rotation.x = sp < .3 && !P.climb ? Math.sin(t * 5) * .05 : 0;
    updateTail(dt, t, sp);
    // camera
    const dist = inside ? Math.min(camDist, 3.6) : camDist;
    if (keys.ArrowLeft) camYaw += dt * 2; if (keys.ArrowRight) camYaw -= dt * 2; if (keys.ArrowUp) camPitch = Math.min(1.2, camPitch + dt); if (keys.ArrowDown) camPitch = Math.max(-.1, camPitch - dt);
    const tp = P.pos.clone().add(new THREE.Vector3(0, .5, 0));
    const want = tp.clone().add(new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch)).multiplyScalar(dist));
    if (inside && !P.inAttic) { want.y = Math.min(want.y, cab.h - .3); }
    want.y = Math.max(want.y, .3); camera.position.lerp(want, 1 - Math.exp(-dt * 8)); camera.lookAt(tp);
    // food bob + portal rings pulse
    foodObj.m.rotation.y += dt; portals.forEach(q => q.ring.material.opacity = .35 + Math.sin(t * 4) * .2);
  } else if (state === 'menu') { camera.position.set(Math.sin(t * .05) * 22, 6, Math.cos(t * .05) * 22); camera.lookAt(0, 2, 0); }
  $('prompt').style.display = prompt ? 'block' : 'none'; $('ptext').textContent = prompt; $('prog').style.display = prog >= 0 ? 'block' : 'none'; if (prog >= 0) $('prog').firstChild.style.width = prog * 100 + '%';
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').style.opacity = 0; }
  pressed = {};
  // lighting follow + particles
  const c = state === 'menu' ? new THREE.Vector3() : P.pos;
  sun.position.copy(c).addScaledVector(sunDir, 60); sun.target.position.copy(c);
  updateParticles(leaves, dt, c, 25, 14, 'leaf', t); updateParticles(motes, dt, new THREE.Vector3(0, 0, 0), 4.6, 3.6, 'mote', t); updateParticles(flies, dt, c, 20, 3, 'mote', t);
  flies.pts.material.opacity = .5 + Math.sin(t * 3) * .4;
  composer.render();
}
loadLevel(0); state = 'menu'; showMenu(); frame();
window.__snap = () => ({ pos: P.pos.toArray(), courseT });
window.__sim = (o) => {
  const out = []; if (o.pos) { P.pos.set(...o.pos); P.vel.set(0, 0, 0); P.climb = null; P.onGround = true; P.groundBox = null; }
  if (o.courseT != null) courseT = o.courseT;
  for (const seg of o.segs) {
    if (seg.yaw != null) camYaw = seg.yaw;
    for (let i = 0; i < seg.n; i++) {
      for (const k in keys) keys[k] = false; for (const k of seg.keys || []) keys[k] = true;
      pressed = {}; if (i === 0) for (const k of seg.press || []) pressed[k] = true;
      if (seg.climbAng != null && P.climb) P.climbAng = seg.climbAng;
      if (seg.balance && P.groundBox?.rope) keys[P.bal > 0 ? 'KeyA' : 'KeyD'] = Math.abs(P.bal) > .15;
      if (seg.untilY != null && P.pos.y >= seg.untilY) break; if (seg.untilX != null && (seg.dx < 0 ? P.pos.x <= seg.untilX : P.pos.x >= seg.untilX)) break; if (seg.untilZ != null && (seg.dz > 0 ? P.pos.z >= seg.untilZ : P.pos.z <= seg.untilZ)) break;
      stepWorld(1 / 60); physics(1 / 60, !!seg.sneak); P.inAttic = isInside(P.pos) && P.pos.y > cab.h - .05;
    }
    out.push({ pos: P.pos.toArray().map(v => +v.toFixed(2)), climb: !!P.climb, ground: P.onGround, cp: P.cp ? P.cp.toArray() : null, falls: P.falls || 0, rope: !!P.groundBox?.rope });
  }
  pressed = {}; for (const k in keys) keys[k] = false; return out;
};
window.__game = { startLevel, P, get courseT() { return courseT; }, foodPos: () => foodObj.pos.toArray(), get state() { return state; }, LEVELS };
