/* The back room, in 3D: ASH's party room at night, built in code (three.js).
   Head count sets round tables of 8. Seated tables get a cloth, chairs, empty plates and a candle, and the bulb strings over them come up.
   Illustration only, not ASH's real room. No food is drawn. */
import * as THREE from './vendor/three.module.min.js';

const cv = document.getElementById('room');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SEATS = 8, MINN = 10, MAXN = 60;

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { document.documentElement.classList.add('no-webgl'); throw e; }
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0807);
scene.fog = new THREE.Fog(0x0b0807, 11, 26);
const camera = new THREE.PerspectiveCamera(40, 1, .1, 60);

const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

// ---------- procedural textures (canvas) ----------
function canvasTex(w, h, paint, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat); t.anisotropy = 8; return t;
}
const woodTex = canvasTex(1024, 1024, (x, w, h) => {
  const pw = 64;
  for (let y = 0, i = 0; y < h; y += pw, i++) {
    let px = -rnd() * 400;
    while (px < w) {
      const len = 260 + rnd() * 420, l = 15 + rnd() * 9, hue = 22 + rnd() * 8;
      x.fillStyle = `hsl(${hue},${38 + rnd() * 12}%,${l}%)`; x.fillRect(px, y, len - 2, pw - 2);
      for (let k = 0; k < 14; k++) { x.strokeStyle = `hsla(${hue},40%,${l - 6 + rnd() * 10}%,.35)`; x.lineWidth = 1 + rnd() * 2; x.beginPath(); const yy = y + rnd() * pw; x.moveTo(px, yy); x.bezierCurveTo(px + len * .3, yy + rnd() * 6 - 3, px + len * .6, yy + rnd() * 6 - 3, px + len, yy); x.stroke(); }
      x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(px + len - 2, y, 2, pw);
      px += len;
    }
    x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, y + pw - 2, w, 2);
  }
}, [5, 7]);
const brickTex = canvasTex(1024, 512, (x, w, h) => {
  x.fillStyle = '#3a2a22'; x.fillRect(0, 0, w, h);
  const bh = 32, bw = 96;
  for (let y = 0, i = 0; y < h; y += bh, i++) for (let px = (i % 2) * -bw / 2; px < w; px += bw) {
    x.fillStyle = `hsl(${10 + rnd() * 12},${38 + rnd() * 16}%,${26 + rnd() * 12}%)`; x.fillRect(px + 3, y + 3, bw - 6, bh - 6);
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(px + 3, y + bh - 9, bw - 6, 6);
  }
}, [4, 2]);
const glowTex = canvasTex(128, 128, (x, w) => {
  const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, 'rgba(255,236,200,1)'); g.addColorStop(.18, 'rgba(255,200,130,.55)'); g.addColorStop(.5, 'rgba(255,160,80,.12)'); g.addColorStop(1, 'rgba(255,140,60,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, w);
});
glowTex.colorSpace = THREE.SRGBColorSpace;

// ---------- the room (12 m wide, 16 m deep) ----------
const RW = 12, RD = 16, RH = 3.6;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), new THREE.MeshStandardMaterial({ map: woodTex, roughness: .42, metalness: 0 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
const back = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), new THREE.MeshStandardMaterial({ map: brickTex, roughness: .9 }));
back.position.set(0, RH / 2, -RD / 2); scene.add(back);
const blueWall = new THREE.Mesh(new THREE.PlaneGeometry(RD, RH), new THREE.MeshStandardMaterial({ color: 0x2f86c8, roughness: .75 }));
blueWall.rotation.y = Math.PI / 2; blueWall.position.set(-RW / 2, RH / 2, 0); scene.add(blueWall);   // their blue dining-room wall
const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(RD, RH), new THREE.MeshStandardMaterial({ map: brickTex.clone(), roughness: .9 }));
sideWall.material.map.repeat.set(6, 2); sideWall.rotation.y = -Math.PI / 2; sideWall.position.set(RW / 2, RH / 2, 0); scene.add(sideWall);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), new THREE.MeshStandardMaterial({ color: 0x0c0a09, roughness: 1 }));
ceil.rotation.x = Math.PI / 2; ceil.position.y = RH; scene.add(ceil);
// big screen on the back wall (game day), dark blue glow, no content
const tv = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.46), new THREE.MeshBasicMaterial({ color: 0x1d4f7a }));
tv.position.set(-2.2, 2.1, -RD / 2 + .03); scene.add(tv);
const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(2.72, 1.58, .05), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: .4 }));
tvFrame.position.set(-2.2, 2.1, -RD / 2 + .01); scene.add(tvFrame);
const tvLight = new THREE.PointLight(0x5aa8f0, 4, 7, 2); tvLight.position.set(-2.2, 2, -RD / 2 + 1); scene.add(tvLight);
// service counter along the back
const counter = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.0, .7), new THREE.MeshStandardMaterial({ color: 0x3b281d, roughness: .5 }));
counter.position.set(2.6, .5, -RD / 2 + .6); scene.add(counter);
const counterTop = new THREE.Mesh(new THREE.BoxGeometry(4.3, .06, .8), new THREE.MeshStandardMaterial({ color: 0x8a8580, roughness: .25, metalness: .1 }));
counterTop.position.set(2.6, 1.03, -RD / 2 + .6); scene.add(counterTop);

scene.add(new THREE.HemisphereLight(0x33465a, 0x1a0f08, .5));

// ---------- tables ----------
const clothMat = new THREE.MeshStandardMaterial({ color: 0xf2ebdf, roughness: .92, transparent: true });
const bareMat = new THREE.MeshStandardMaterial({ color: 0x3a281c, roughness: .55 });
const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .25, transparent: true });
const rimMat = new THREE.MeshStandardMaterial({ color: 0x2f86c8, roughness: .4, transparent: true });
const glassMat = new THREE.MeshStandardMaterial({ color: 0xdfeef8, roughness: .05, metalness: .2, transparent: true, opacity: .35 });
const seatMat = new THREE.MeshStandardMaterial({ color: 0x1f6fd6, roughness: .5, emissive: 0x0a2a55, emissiveIntensity: .35 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: .35, metalness: .8 });
const waxMat = new THREE.MeshStandardMaterial({ color: 0xf4ead8, roughness: .7 });
const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd28a });

const R = .78, TH = .76;
// floor-length cloth: a lathe profile (flat top, rounded edge, slight flare at the floor)
const clothGeo = new THREE.LatheGeometry([
  new THREE.Vector2(0, TH + .012), new THREE.Vector2(R - .03, TH + .012), new THREE.Vector2(R + .01, TH - .01),
  new THREE.Vector2(R + .03, TH - .08), new THREE.Vector2(R + .05, .3), new THREE.Vector2(R + .09, .01), new THREE.Vector2(R + .09, 0)
], 48);
const bareTopGeo = new THREE.CylinderGeometry(R, R, .05, 40);
const pedGeo = new THREE.CylinderGeometry(.06, .06, TH, 10);
const plateGeo = new THREE.CylinderGeometry(.13, .12, .018, 28), rimGeo = new THREE.TorusGeometry(.105, .005, 6, 28);
const glassGeo = new THREE.CylinderGeometry(.035, .03, .13, 14, 1, true);
const seatGeo = new THREE.BoxGeometry(.44, .07, .44), backGeo = new THREE.BoxGeometry(.44, .46, .05), legGeo = new THREE.CylinderGeometry(.015, .015, .45, 6);

const TABLES = [];
const spots = [[-2.5, 1.2], [2.3, 1.6], [-2.4, -2.2], [2.5, -1.9], [-2.6, 4.6], [2.4, 4.9], [-2.3, -5.4], [2.5, -5.1]]; // fill order: middle, then front, then back
for (const [x, z] of spots) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rnd() * .6; scene.add(g);
  const bare = new THREE.Group();
  const top = new THREE.Mesh(bareTopGeo, bareMat); top.position.y = TH; bare.add(top);
  const ped = new THREE.Mesh(pedGeo, metalMat); ped.position.y = TH / 2; bare.add(ped);
  g.add(bare);
  const dressed = new THREE.Group(); g.add(dressed);
  const cloth = new THREE.Mesh(clothGeo, clothMat.clone()); dressed.add(cloth);
  const candle = new THREE.Group(); candle.position.y = TH;
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .12, 12), waxMat); wax.position.y = .07; candle.add(wax);
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .03, 16), glassMat); holder.position.y = .015; candle.add(holder);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 8), flameMat); flame.scale.y = 1.8; flame.position.y = .16; candle.add(flame);
  const fglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb060, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 }));
  fglow.scale.setScalar(.55); fglow.position.y = .16; candle.add(fglow);
  dressed.add(candle);
  const light = new THREE.PointLight(0xffa860, 0, 6.5, 1.6); light.position.set(0, 2.3, 0); g.add(light);
  const seats = [];
  for (let s = 0; s < SEATS; s++) {
    const a = s / SEATS * Math.PI * 2;
    const chair = new THREE.Group(); chair.position.set(Math.sin(a) * (R + .38), 0, Math.cos(a) * (R + .38)); chair.rotation.y = a;
    const seat = new THREE.Mesh(seatGeo, seatMat); seat.position.y = .46; chair.add(seat);
    const bk = new THREE.Mesh(backGeo, seatMat); bk.position.set(0, .72, .2); bk.rotation.x = -.08; chair.add(bk);
    for (const [lx, lz] of [[-.19, -.19], [.19, -.19], [-.19, .19], [.19, .19]]) { const l = new THREE.Mesh(legGeo, metalMat); l.position.set(lx, .225, lz); chair.add(l); }
    g.add(chair);
    const place = new THREE.Group(); place.position.set(Math.sin(a) * (R - .2), TH + .01, Math.cos(a) * (R - .2));
    const plate = new THREE.Mesh(plateGeo, plateMat.clone()); place.add(plate);
    const rim = new THREE.Mesh(rimGeo, rimMat); rim.rotation.x = Math.PI / 2; rim.position.y = .012; place.add(rim);
    const glass = new THREE.Mesh(glassGeo, glassMat); glass.position.set(Math.cos(a) * .17, .065, -Math.sin(a) * .17); place.add(glass);
    dressed.add(place);
    seats.push({ chair, place, v: 0 });
  }
  TABLES.push({ g, bare, dressed, cloth, light, flame, fglow, seats, v: 0, ph: rnd() * 6 });
}

// ---------- bulb strings (café lights) ----------
const BULBS = [];
const wireMat = new THREE.MeshBasicMaterial({ color: 0x060504 });
const bulbOff = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: .3 });
const bulbGeo = new THREE.SphereGeometry(.05, 12, 10);
function stringBetween(a, b, sag) {
  const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - Math.sin(Math.PI * t) * sag, a.z + (b.z - a.z) * t)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .007, 4, false), wireMat));
  const n = Math.round(curve.getLength() / .78);
  for (let i = 1; i < n; i++) {
    const p = curve.getPoint(i / n);
    const m = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); m.position.copy(p); m.position.y -= .07; scene.add(m);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc078, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.position.copy(m.position); sp.scale.setScalar(.9); scene.add(sp);
    BULBS.push({ m, sp, v: 0, ph: rnd() * 6.28 });
  }
}
// zigzag runs from wall to wall, like the strings over their patio
for (let k = 0; k < 4; k++) {
  const z0 = -RD / 2 + 1.2 + k * 3.1, z1 = z0 + 3.1;
  stringBetween(new THREE.Vector3(-RW / 2 + .1, 3.35, z0), new THREE.Vector3(RW / 2 - .1, 3.35, z1), .5);
  stringBetween(new THREE.Vector3(RW / 2 - .1, 3.35, z0), new THREE.Vector3(-RW / 2 + .1, 3.35, z1), .5);
}

// ---------- state ----------
let target = +(cv.dataset.n || 24), shown = target, visible = true, raf = 0, last = performance.now();
function plan(n) {
  const k = Math.min(TABLES.length, Math.ceil(n / SEATS)), used = new Map();
  for (let j = 0; j < k; j++) used.set(j, Math.floor(n / k) + (j < n % k ? 1 : 0));
  return used;
}
const SEAT_ORDER = [0, 4, 2, 6, 1, 5, 3, 7];

function apply(dt, snap) {
  const used = plan(Math.round(shown)); let moving = false;
  const ease = (v, goal, k) => { if (snap || reduce) return goal; const d = goal - v; if (Math.abs(d) < .004) return goal; moving = true; return v + d * Math.min(1, dt * k); };
  TABLES.forEach((t, i) => {
    const count = used.get(i) || 0;
    t.v = ease(t.v, count ? 1 : 0, 5);
    t.bare.visible = t.v < .98; t.dressed.visible = t.v > .02;
    t.cloth.material.opacity = t.v; t.cloth.scale.set(.92 + .08 * t.v, t.v, .92 + .08 * t.v);
    t.light.intensity = 5.5 * t.v;
    const on = new Set(SEAT_ORDER.slice(0, count));
    t.seats.forEach((s, k) => {
      s.v = ease(s.v, on.has(k) ? 1 : 0, 7);
      const tuck = .35 * (1 - s.v);   // empty chairs sit pushed in and dark; seated ones pull out
      s.chair.position.setLength(R + .38 + .12 * s.v - tuck * .2);
      s.place.visible = s.v > .05 && t.v > .5; s.place.scale.setScalar(Math.max(.01, s.v));
    });
  });
  // bulbs light over tables in use
  const act = TABLES.filter(t => t.v > .02);
  for (const b of BULBS) {
    let lit = 0;
    for (const t of act) { const d = Math.hypot(b.m.position.x - t.g.position.x, b.m.position.z - t.g.position.z); lit = Math.max(lit, t.v * THREE.MathUtils.clamp(1.6 - d / 2.6, 0, 1)); }
    lit = .5 + .5 * lit;
    b.v = ease(b.v, lit, 4);
  }
  return moving;
}

function frame(now) {
  raf = 0;
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const k = reduce ? 1 : Math.min(1, dt * 7);
  shown += (target - shown) * k; if (Math.abs(target - shown) < .4) shown = target;
  const moving = apply(dt, false) || shown !== target;
  const time = now / 1000;
  for (const b of BULBS) {
    const fl = reduce ? 1 : .93 + .07 * Math.sin(time * 2 + b.ph);
    const v = b.v * fl;
    b.m.material.color.setRGB(.25 + .75 * v, .2 + .65 * v, .16 + .45 * v);
    b.sp.material.opacity = Math.min(1, v * .95); b.sp.scale.setScalar(.45 + .7 * v);
  }
  for (const t of TABLES) {
    const fl = reduce ? 1 : .86 + .14 * Math.sin(time * 7 + t.ph) * Math.sin(time * 3.1 + t.ph * 2);
    t.fglow.material.opacity = .9 * t.v * fl; t.flame.scale.set(1, 1.8 * fl, 1);
    t.light.intensity = 5.5 * t.v * (.94 + .06 * fl);
  }
  if (!reduce) { // slow drift, like a handheld look into the room
    camera.position.x = cam.pos.x + Math.sin(time * .17) * .18 + px * .35;
    camera.position.y = cam.pos.y + Math.sin(time * .13) * .05 - py * .15;
    camera.lookAt(cam.look);
  }
  renderer.render(scene, camera);
  if (visible && (!reduce || moving)) raf = requestAnimationFrame(frame);
}
function kick() { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }

const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
let px = 0, py = 0;
function size() {
  const r = cv.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 700 ? 2 : 1.75));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const tall = h > w;
  camera.fov = tall ? 58 : 40;
  // from the doorway, up high, looking across the tables to the brick wall and the screen
  cam.pos.set(tall ? .3 : .8, tall ? 5.6 : 4.4, tall ? 10.4 : 10.2);
  cam.look.set(0, tall ? .2 : .4, tall ? -.6 : -1.2);
  camera.position.copy(cam.pos); camera.lookAt(cam.look); camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}

addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; });
new ResizeObserver(size).observe(cv);
if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(cv);

apply(0, true); size(); kick();
document.documentElement.classList.add('room-ready');

window.ashRoom = {
  set(n) { target = Math.max(MINN, Math.min(MAXN, Math.round(n))); kick(); },
  get n() { return target; },
  tables(n) { return Math.min(TABLES.length, Math.ceil(n / SEATS)); }
};
document.dispatchEvent(new Event('ash:room'));
