// Kalyana Payanam — a walk through one wedding. Scroll carries the camera through five painted rooms in a row:
// in at the front door of the engagement hall, out through its far door into the garden, through the garden gate into
// the mandapam, through the arch into the reception, and out onto the road where the "Just Married" car drives away.
// Each room is built in depth: a relief painting at the back (16-bit depth map) whose glowing doorway opens onto the next
// room, people as cut-outs standing at their own depth, and a carved frame in front that the camera passes through.
import * as THREE from "./vendor/three.module.min.js";
import { readInvite } from "./invite.js?v=2";   // versioned: the site serves these files with a 7-day cache (v2 = the client's YouTube song, 2026-10-28)
import { ROOMS as ALL_ROOMS } from "./rooms.js?v=16";

const RM = !!window.FMI_REDUCE_MOTION || matchMedia("(prefers-reduced-motion: reduce)").matches;
const PHONE = matchMedia("(max-width: 700px)").matches;
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const $ = (s) => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const smoothstep = (a, b, v) => ease(clamp((v - a) / (b - a)));
const eio = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

const Q = new URLSearchParams(window.FMI_SEARCH || "");
// ---------- the couple's invitation: one data source ----------
// the website hands it over as window.KP_INVITE; ?invite=tests/x.json loads a test file from this folder; else the sample
async function inviteData(){if(!window.KP_INVITE)throw Error("Invitation data unavailable");return window.KP_INVITE;}
const M = readInvite(await inviteData());
if (M.warn.length) console.info("invite:", M.warn.join("; "));
// the guest's name: from the guest link, ?g=Ravi%20family, or #Ravi-family (hosts that drop the query string still pass a plain #name)
const GUEST = (M.guest || Q.get("g") || decodeURIComponent(new URL(M.shareUrl || "https://findmyinvite.com").hash.slice(1)).replace(/[-_]+/g, " ")).replace(/[<>{}]/g, "").trim().slice(0, 40);
let LANG = M.languages.includes(Q.get("lang")) ? Q.get("lang") : M.language;
const FONTS = {
  ta: { d: "Arima", b: "Noto Serif Tamil", ch: "த" },
  ml: { d: "Noto Serif Malayalam", b: "Noto Serif Malayalam", ch: "മ" },
  te: { d: "Noto Serif Telugu", b: "Noto Serif Telugu", ch: "త" },
  kn: { d: "Noto Serif Kannada", b: "Noto Serif Kannada", ch: "ಕ" },
  hi: { d: "Noto Serif Devanagari", b: "Noto Serif Devanagari", ch: "ह" },
};
const loadFonts = (l) => FONTS[l] ? [document.fonts.load(`700 40px "${FONTS[l].d}"`, FONTS[l].ch), document.fonts.load(`600 40px "${FONTS[l].b}"`, FONTS[l].ch)] : [];
let T = M.text(LANG);
const tget = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), T);
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? "");

// ---------- the rooms ----------
// only the scenes this couple has: a skipped room's card goes too, and the walk joins the rooms either side of it
const ROOMS = ALL_ROOMS.filter((R) => M.scenes.includes(R.id));
document.querySelectorAll(".ch[data-scene]").forEach((s) => { if (!M.scenes.includes(s.dataset.scene)) s.remove(); });
const N = ROOMS.length;
const SL = 7.8;                     // room spacing: camera enters at local z +1.4, the painting hangs at -6, the next room begins 0.4 behind it
const ENTER = 1.4, HOLD0 = -.2, HOLD1 = -1.0, PLATE_Z = -6, C0 = new THREE.Vector3(0, 0, -.6);
const PH = 2 * (ENTER - PLATE_Z) * Math.tan(25 * Math.PI / 180) * 1.25, PW = PH * 2 / 3;

// ---------- renderer ----------
const stage = $("#stage");
const renderer = new THREE.WebGLRenderer({ canvas: $("#gl"), antialias: false, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setClearColor(0xe9b77a, 1);   // any gap reads as warm light, never black
// the people layer: a second, transparent canvas above the page's cards, so a card can sit behind the family
const fgRenderer = new THREE.WebGLRenderer({ canvas: $("#fg"), alpha: true, antialias: false, premultipliedAlpha: false });
fgRenderer.outputColorSpace = THREE.LinearSRGBColorSpace; fgRenderer.setClearColor(0x000000, 0);
const fgScene = new THREE.Scene();
let fgWas = false;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, .5, .02, 120);

// camera mapping: every painting pixel lies on the line from the reference eye (uC0) through it. Pixels whose line dips
// below the painting's horizon land on a flat floor (uFloor) before reaching the back wall, so floors are real floors.
const PLATE_VERT = `
  uniform float uFloor, uFloorMix; uniform vec3 uC0;
  varying vec2 vUv; varying float vDep;
  void main(){
    vUv = uv; vDep = 0.0;
    vec3 dir = position - uC0;
    float tf = dir.y < -1e-4 ? (uFloor - uC0.y) / dir.y : 2.0;
    vec3 p = tf < 1.0 ? mix(position, uC0 + dir * tf, uFloorMix) : position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const PLATE_FRAG = `
  uniform sampler2D map, mask; uniform float uOpen, uT, uDim, uBlur; uniform vec3 uGlow;
  varying vec2 vUv; varying float vDep;
  void main(){
    vec2 st = vec2(vUv.x, vUv.y < 0.0 ? .22 * abs(fract(-vUv.y / .44) * 2.0 - 1.0) : vUv.y);   // below the painting: its floor band, mirrored
    vec3 col = texture2D(map, st, uBlur).rgb * uDim;
    float m = (vUv.x < 0.0 || vUv.x > 1.0 || vUv.y < 0.0 || vUv.y > 1.0) ? 0.0 : texture2D(mask, vUv).r;
    float a = 1.0 - smoothstep(.15, .85, m * uOpen * 1.3);
    col += uGlow * m * (.25 + .2 * sin(uT * 1.7)) * (1.0 - uOpen);   // the painted door light only while a doorway is still shut
    if (a < .01) discard;
    gl_FragColor = vec4(col, a);
  }`;
const CUT_FRAG = `
  uniform sampler2D map, blinkMap; uniform float uO, uDim, uShade, uGround, uBlur, uHasBlink; uniform vec3 uTint, uRim, uBlinkW; uniform vec3 uHead[3]; uniform vec2 uTexel; varying vec2 vUv;
  void main(){
    vec4 c = texture2D(map, vUv, uBlur); if (c.a < .02) discard;
    vec3 col = c.rgb;
    if (uHasBlink > 0.0) {                                                 // eyelids: the closed-eye patch of whichever face is nearest
      vec4 bl = texture2D(blinkMap, vUv, uBlur); float best = 9.0, w = 0.0;
      for (int k = 0; k < 3; k++) { if (uHead[k].z <= 0.0) continue; float d = abs(vUv.x - uHead[k].x);
        if (d < best) { best = d; w = k == 0 ? uBlinkW.x : (k == 1 ? uBlinkW.y : uBlinkW.z); } }
      col = mix(col, bl.rgb, bl.a * w);
    }
    if (uShade > 0.0) {
      col *= mix(vec3(1.0), uTint, .32);                                   // the room's own light colour
      col *= mix(.9, 1.06, smoothstep(.1, .95, vUv.y));                    // light from above
      col *= mix(.58, 1.0, smoothstep(uGround, uGround + .13, vUv.y));     // darker where it meets the floor
      // no edge glow: on a phone it reads as a pale outline around the people
    }
    gl_FragColor = vec4(col * uDim, c.a * uO); }`;
const CUT_VERT = `uniform float uT, uBreath; uniform vec3 uHead[3]; uniform float uNod[3]; uniform vec3 uSize; varying vec2 vUv;
  void main(){ vUv = uv; vec3 p = position;
    float b = sin(uT * 1.6 + uBreath * 7.0) * .006;           // a breath: the upper body rises a hair
    p.y += b * smoothstep(-.1, .5, uv.y) * 1.2; p.x *= 1.0 + b * .4 * smoothstep(.3, .9, uv.y);
    for (int k = 0; k < 3; k++) {                             // a soft sideways nod: the head tilts a touch about the neck
      if (uHead[k].z <= 0.0) continue;
      float asp = uSize.y / uSize.x, r = uHead[k].z;
      vec2 d = vec2(uv.x - uHead[k].x, (uv.y - uHead[k].y) * asp);
      float w = 1.0 - smoothstep(r * .95, r * 1.7, length(d + vec2(0.0, r * .35)));
      vec2 piv = vec2((uHead[k].x - .5) * uSize.x, (uHead[k].y - r * 1.15 / asp) * uSize.y - uSize.z * uSize.y);
      float a = uNod[k] * w; vec2 q = p.xy - piv;
      p.xy = piv + vec2(q.x * cos(a) - q.y * sin(a), q.x * sin(a) + q.y * cos(a));
      // side-to-side only: the head tilts about the neck, no up-and-down dip
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;

// each painting's mesh reaches well past its edges (the border pixels carry on), so a room seen through a doorway
// from further back still fills the whole view: no empty bands around it
const FLOOR_FOLD = 0;   // 1 folds each painting's floor down flat; 0 keeps paintings upright (no stretching of things painted on the floor)
const EXT = 1.8, segs = PHONE ? [150, 230] : [190, 290];
const plateGeo = new THREE.PlaneGeometry(PW * EXT, PH * EXT, segs[0], segs[1]);
{ const uv = plateGeo.attributes.uv; for (let n = 0; n < uv.count; n++) uv.setXY(n, (uv.getX(n) - .5) * EXT + .5, (uv.getY(n) - .5) * EXT + .5); }
const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); blank.needsUpdate = true;

const imgCache = {};
// a picture that failed (a dropped connection) is forgotten, so the next try really fetches it again
const loadImg = (src) => imgCache[src] || (imgCache[src] = new Promise((res, rej) => { const im = new Image(); im.decoding = "async"; im.onload = () => res(im); im.onerror = (e) => { delete imgCache[src]; rej(e); }; im.src = src; }));
const mirrored = (t) => { t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; return t; };
// lag fix (2026-10-11): pictures for the graphics chip are fetched and decoded off the main thread straight into a bitmap already
// turned the way WebGL wants it (flipped, colours untouched), so sending one to the GPU costs next to nothing on the main
// thread (sending a plain <img> froze the swing to each stop for a moment). A tiny test first checks this browser really
// flips the bitmap; if not, or on any trouble, the plain <img> way is used. ?nobitmap forces the plain way (testing).
const BITMAP = { imageOrientation: "flipY", premultiplyAlpha: "none", colorSpaceConversion: "none" };
const bitmapOK = (async () => {
  try {
    if (Q.has("nobitmap") || typeof createImageBitmap !== "function") return false;
    const c = document.createElement("canvas"); c.width = 1; c.height = 2; const x = c.getContext("2d");
    x.fillStyle = "#f00"; x.fillRect(0, 0, 1, 1); x.fillStyle = "#00f"; x.fillRect(0, 1, 1, 1);
    const b = await createImageBitmap(c, BITMAP), d = document.createElement("canvas"); d.width = 1; d.height = 2;
    const y = d.getContext("2d"); y.drawImage(b, 0, 0); const px = y.getImageData(0, 0, 1, 1).data;
    return px[2] > 200 && px[0] < 60;   // the blue pixel came to the top: the flip was honoured
  } catch { return false; }
})();
const plainImg = (src) => new Promise((res, rej) => { const im = new Image(); im.decoding = "async"; im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => res(im)); im.onerror = rej; im.src = src; });
const texOnce = async (src) => {
  if (!(await bitmapOK)) return plainImg(src);
  try {
    const r = await fetch(src); if (!r.ok) throw new Error(src + " " + r.status);
    return await createImageBitmap(await r.blob(), BITMAP);
  } catch (e) { console.info("picture: plain image instead", src, e?.message || e); return plainImg(src); }
};
const texCache = {};
const loadTex = (src) => texCache[src] || (texCache[src] = (async () => {
  for (let k = 0; ; k++) { try { return await texOnce(k ? src + (src.includes("?") ? "&" : "?") + "r=" + k : src); } catch (e) { if (k >= 2) { delete texCache[src]; throw e; } await new Promise((r) => setTimeout(r, 400 * (k + 1))); } }
})());
const loadTexRetry = async (src, n = 3) => { for (let k = 0; ; k++) { try { return await loadTex(src); } catch (e) { if (k >= n) throw e; await new Promise((r) => setTimeout(r, 900 * (k + 1))); } } };
function tex(im, data) {
  const t = new THREE.Texture(im); t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  if (typeof ImageBitmap !== "undefined" && im instanceof ImageBitmap) t.flipY = false;   // already flipped when it was decoded
  if (data) { t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; }
  else { t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; }
  return t;
}

// each room sits at the height of the previous room's doorway, so the camera comes out of a doorway level with the next room
// Each painting is hung so its horizon (hz) sits at eye level; its floor meets the back wall at fl. Rooms are stacked so
// each room's floor continues the previous doorway's threshold (db), and the camera walks at each room's own eye height.
const yAt = (R, v) => (R.hz - v) * PH;                      // painting row v → height on the back wall, eye = 0
const floorY = (R) => yAt(R, R.fl);
const doorY = (R) => yAt(R, R.door[1]);
let yAcc = 0;
const rooms = ROOMS.map((R, i) => {
  if (i > 0) { const P = ROOMS[i - 1]; yAcc += yAt(P, P.db) - floorY(R); }
  const g = new THREE.Group(); g.position.set(0, yAcc, -i * SL); scene.add(g); g.visible = false;
  return { R, i, g, state: "none", cast: [], extras: [] };
});
function platePos(R) { return new THREE.Vector3(-(R.door[0] - .5) * PW, (R.hz - .5) * PH, PLATE_Z); }
function onPlate(R, u, v) { const p = platePos(R); return new THREE.Vector3(p.x + (u - .5) * PW, yAt(R, v), PLATE_Z); }
// the point a painting pixel stands for: on the floor if its line from the eye dips below the horizon, else on the back wall
function onFloor(R, u, v) {
  const P = onPlate(R, u, v), dir = P.clone().sub(C0), tf = dir.y < -1e-4 ? (floorY(R) - C0.y) / dir.y : 2;
  return C0.clone().add(dir.multiplyScalar(Math.min(1, tf)));
}

async function build(i) {
  const k = rooms[i], R = k.R;
  const [m, mk] = await Promise.all([loadTex(`img/plate/${R.plate}.webp`), R.mask ? loadTex(`img/mask/${R.plate}.webp`) : null]);
  const pp = platePos(R);
  const base = (N - i) * 100;   // draw order: farther rooms first; inside a room: painting, people (back to front), frame, light, sign
  k.base = base;
  const mat = new THREE.ShaderMaterial({ vertexShader: PLATE_VERT, fragmentShader: PLATE_FRAG, transparent: true, depthWrite: false,
    uniforms: { map: { value: mirrored(tex(m)) }, mask: { value: mk ? tex(mk) : blank }, uFloor: { value: floorY(R) - pp.y }, uFloorMix: { value: FLOOR_FOLD }, uBlur: { value: 0 },
      uC0: { value: C0.clone().sub(pp) }, uOpen: { value: 0 }, uT: { value: 0 }, uDim: { value: 1 }, uGlow: { value: new THREE.Color(R.glow || "#ffd28a") } } });
  const plate = new THREE.Mesh(plateGeo, mat); plate.position.copy(pp); plate.frustumCulled = false; plate.renderOrder = base; k.g.add(plate); k.plate = plate;
  // the painted floor starts a little in front of the eye; a strip of its nearest row carries it on to the doorway behind
  const near = onFloor(R, .5, 1), bz0 = near.z + .02, bz1 = 2.4;
  const bridge = new THREE.Mesh(new THREE.PlaneGeometry(PW * 1.6, bz1 - bz0), new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    uniforms: { map: mat.uniforms.map, uDim: mat.uniforms.uDim, uBlur: mat.uniforms.uBlur },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D map; uniform float uDim, uBlur; varying vec2 vUv;
      void main(){ float s = (1.0 - vUv.y) * 3.0, y = .22 * abs(fract(s * .5) * 2.0 - 1.0);   // ping-pong inside the painting's bottom floor band only
        vec3 c = texture2D(map, vec2(.5 + (vUv.x - .5) * 1.6, y), uBlur).rgb; gl_FragColor = vec4(c * uDim, 1.0); }` }));
  bridge.rotation.x = -Math.PI / 2; bridge.position.set(0, floorY(R) - .001, (bz0 + bz1) / 2); bridge.renderOrder = base + 1; bridge.frustumCulled = false; bridge.visible = FLOOR_FOLD > 0; k.g.add(bridge); k.bridge = bridge;

  // the carved frame in front: it fills the view as the camera enters, and the camera passes through its opening
  if (R.frame) {
    const fi = await loadTex(`img/cut/${R.frame}.webp`);
    const fh = 2 * (ENTER - R.frameZ) * Math.tan(25 * Math.PI / 180) * (R.frameScale || 1.18), fw = fh * fi.width / fi.height;
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), cutMat(tex(fi)));   // frames stay unshaded: they are closest to the eye
    fm.position.set(0, 0, R.frameZ); fm.renderOrder = base + 50; k.g.add(fm); k.frame = fm;
  }
  // the people (and the car): feet pinned to the painting's floor as seen from the reference eye
  for (const c of R.cast) {
    const ci = await loadTex(`img/cut/${c.img}.webp`);
    const F = onFloor(R, c.u, c.v);                                    // feet on the room's actual floor
    const h = c.sh * PH * (C0.z - F.z) / (C0.z - PLATE_Z), w = h * ci.width / ci.height;
    const ground = c.ground || 0;                                     // where it touches the floor, from the image's bottom
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, c.car ? 1 : 28, c.car ? 1 : 40), cutMat(tex(ci), !c.car, R, ground));
    const U = mesh.material.uniforms; U.uSize.value.set(w, h, ground);
    if (c.couple) {   // eyes-closed overlay and where the faces are (made by art/blinkprep.mjs); skipped quietly if absent
      try {
        const [bi, faces] = await Promise.all([loadTex(`img/cut/${c.img}_blink.webp`), fetch(`img/cut/${c.img}_faces.json`).then((r) => r.json())]);
        U.blinkMap.value = tex(bi); U.uHasBlink.value = 1;
        faces.slice(0, 3).forEach((f, n) => U.uHead.value[n].set(f.x, f.y, f.r));
        c.faces = faces.slice(0, 3).map(() => ({ next: 1 + Math.random() * 3, phase: Math.random() * 6.28 }));
      } catch {}
    }
    mesh.geometry.translate(0, h / 2 - ground * h, 0); mesh.position.copy(F); mesh.renderOrder = base + 10 + F.z;   // nearer draws later
    mesh.material.uniforms.uBreath.value = Math.random();
    const sh = floorShadow(w * (c.shadowW || 1.05), w * (c.shadowD || .32), c.shadowO ?? .55);
    sh.position.set(F.x, F.y + .003, F.z + w * .06); sh.renderOrder = base + 9 + F.z; k.g.add(sh);
    k.g.add(mesh);
    if (!k.fgGroup) { k.fgGroup = new THREE.Group(); k.fgGroup.position.copy(k.g.position); fgScene.add(k.fgGroup); }
    const fg = mesh.clone(); fg.visible = false; k.fgGroup.add(fg);
    k.cast.push({ c, mesh, F, w, h, sh, fg });
  }
  if (R.fire) addFire(k);
  if (R.sparkle) addSparkle(k);
  if (R.sign) addSign(k);
  addMotes(k);
  k.g.traverse((o) => { const u = o.material?.uniforms; if (u) for (const n of ["map", "mask", "blinkMap"]) { const t = u[n]?.value; if (t?.isTexture && t !== blank && t.image) warm(t); } });   // lag fix (2026-10-11): sent ahead
  k.state = "ready"; k.g.visible = true;
}
function cutMat(map, breathe, R, ground = 0) {
  const im = map.image;
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: breathe ? CUT_VERT : `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: CUT_FRAG, uniforms: { map: { value: map }, uO: { value: 1 }, uDim: { value: 1 }, uT: { value: 0 }, uBreath: { value: 0 },
      uShade: { value: R ? 1 : 0 }, uGround: { value: ground }, uBlur: { value: 0 }, uTint: { value: new THREE.Color((R && R.tint) || "#ffffff") }, uRim: { value: new THREE.Color((R && R.rim) || "#ffd9a0") },
      uTexel: { value: new THREE.Vector2(1 / (im?.width || 1024), 1 / (im?.height || 1024)) },
      blinkMap: { value: blank }, uHasBlink: { value: 0 }, uBlinkW: { value: new THREE.Vector3() },
      uHead: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, uNod: { value: [0, 0, 0] }, uSize: { value: new THREE.Vector3(1, 1, 0) } } });
}
// a soft oval shadow lying on the floor under a person (or the car)
const shadowTex = (() => { const c = document.createElement("canvas"); c.width = 128; c.height = 128; const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(20,8,4,.85)"); g.addColorStop(.45, "rgba(20,8,4,.45)"); g.addColorStop(1, "rgba(20,8,4,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t; })();
function floorShadow(w, depth, opacity) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, depth), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, depthTest: false, opacity }));
  m.rotation.x = -Math.PI / 2 * .85; return m;
}
// lag fix (2026-10-11): a picture is sent to the graphics chip ahead of time, one at a time, while the guest stands at a stop (or
// before the doors open), never mid-swing: sending a big picture the first time it was drawn froze the swing to each stop
const warmQ = [];
let warmAt = 0;
function warm(t) { if (t) warmQ.push(t); return t; }
function stepWarm(now, holding) {
  if (!warmQ.length || now - warmAt < (started ? .12 : 0)) return;   // before the doors open: one every frame
  if (started && (introT0 >= 0 || (vel > .02 && !holding))) return;   // swinging between stops: wait (a stop's hold is nearly still)
  renderer.initTexture(warmQ.shift()); warmAt = now;
}
function ensure(i) { const k = rooms[i]; if (!k || k.state !== "none") return k?.ready; k.state = "loading"; return (k.ready = build(i).catch((e) => { console.error("room", i, e?.target?.src || e); k.state = "failed"; setTimeout(() => (k.state = "none"), 4000); })); }

// ---------- living light: fire, sparkles, dust in the light ----------
const glowSprite = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,240,200,1)"); g.addColorStop(.3, "rgba(255,180,80,.6)"); g.addColorStop(1, "rgba(255,120,30,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t; })();
const POINTS_VERT = `attribute float seed; uniform float uT, uPx, uRise, uSpan; varying float vA;
  void main(){ vec3 q = position; float life = fract(uT * (.25 + seed * .3) + seed * 9.0);
    q.y += life * uRise; q.x += sin(uT * 2.0 + seed * 40.0) * .03 * uSpan;
    vec4 mv = modelViewMatrix * vec4(q, 1.0);
    vA = uRise > 0.0 ? sin(life * 3.14159) : (.3 + .7 * max(0.0, sin(uT * (1.0 + seed) + seed * 30.0)));
    gl_PointSize = uPx * (2.0 + seed * 5.0) / -mv.z; gl_Position = projectionMatrix * mv; }`;
const POINTS_FRAG = `uniform vec3 uCol; uniform float uO; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(uCol * (1.0 - smoothstep(0.0, .5, d)) * vA * uO, 0.0); }`;
const pointMats = [];
function points(n, box, opts) {
  const geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3), s = new Float32Array(n);
  for (let k = 0; k < n; k++) { p[k * 3] = box[0] + Math.random() * box[1]; p[k * 3 + 1] = box[2] + Math.random() * box[3]; p[k * 3 + 2] = box[4] + Math.random() * box[5]; s[k] = Math.random(); }
  geo.setAttribute("position", new THREE.BufferAttribute(p, 3)); geo.setAttribute("seed", new THREE.BufferAttribute(s, 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: POINTS_VERT, fragmentShader: POINTS_FRAG,
    blending: THREE.AdditiveBlending, premultipliedAlpha: true,   // light only (alpha 0): adds glow, never covers a layer
    uniforms: { uT: { value: 0 }, uPx: { value: opts.px || 40 }, uRise: { value: opts.rise || 0 }, uSpan: { value: 1 }, uCol: { value: new THREE.Color(opts.col || "#ffd9a0") }, uO: { value: 1 } } });
  pointMats.push(mat);
  const m = new THREE.Points(geo, mat); m.frustumCulled = false; m.renderOrder = (opts.base || 0) + 60; return m;
}
function addMotes(k) { k.g.add(points(PHONE ? 70 : 120, [-2.2, 4.4, -1.6, 3.4, -5.5, 6], { px: 26, col: "#ffe2b0", base: k.base })); }
function addFire(k) {   // the homam: a breathing glow and sparks rising from the fire pit
  const f = k.R.fire, host = k.cast.find((c) => c.c.img === f.of), F = host.F.clone(); f.size = f.size || .07;   // sparks rise from the fire pit in the ceremony picture
  F.x += f.x * host.w; F.y += f.y * host.h; F.z += .02;
  // no glow sprite: it would sit over the priest's face (faces are never covered)
  const sp = points(28, [F.x - f.size * .3, f.size * .6, F.y - f.size * .2, f.size * .2, F.z + .05, .1], { px: 16, rise: f.size * 2.2, col: "#ffb35a", base: k.base });
  k.g.add(sp);
}
function addSparkle(k) { k.g.add(points(PHONE ? 90 : 160, [-2.4, 4.8, -.6, 3.6, PLATE_Z + .4, 2.4], { px: 22, col: "#fff2d0", base: k.base })); }

// "Just Married" is written on the car's sign by the page, so it follows the language and stays editable
let signMesh = null;
function signCanvas() {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 300; const x = c.getContext("2d");
  x.textAlign = "center"; x.textBaseline = "middle";
  const g = x.createLinearGradient(0, 0, 1024, 300); g.addColorStop(0, "#7a1a10"); g.addColorStop(.5, "#b5782a"); g.addColorStop(1, "#7a1a10");
  x.fillStyle = g; x.font = LANG === "en" ? `400 190px "Great Vibes"` : `700 120px "${FONTS[LANG].d}"`; x.fillText(T.sign, 512, LANG === "en" ? 165 : 150, 960);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}
function addSign(k) {
  const car = k.cast.find((c) => c.c.car); if (!car) return;
  const S = k.R.sign, w = car.w * S.w, h = w * 300 / 1024;
  signMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: signCanvas(), transparent: true, depthWrite: false, depthTest: false }));
  signMesh.position.set((S.u - .5) * car.w, (1 - S.v - (car.c.ground || 0)) * car.h, .01); signMesh.renderOrder = k.base + 70; car.mesh.add(signMesh); car.fg.add(signMesh.clone());
}

// ---------- focus: a real lens. The scene is drawn as three see-through layers (the room we stand in, the next room, every
// room beyond); each layer is softened as a whole picture, then they are stacked. So people blur together with their room
// (no halo around a cut-out) and only the event we are at is sharp; walking through a doorway racks focus to the next one.
const LT = () => new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false });
const layers = { cur: new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true }), next: LT(), far: LT() };   // the near layer keeps depth for the 3D door
const blurT = { cur: [LT(), LT()], next: [LT(), LT()], far: [LT(), LT()] };    // half size: [across, then down]
const BLUR_FRAG = `uniform sampler2D t; uniform vec2 uDir; varying vec2 vUv;
  void main(){   // a 13-tap gaussian on premultiplied colour, so see-through edges soften cleanly
    vec4 s = texture2D(t, vUv) * .1964;
    s += (texture2D(t, vUv + uDir * 1.4118) + texture2D(t, vUv - uDir * 1.4118)) * .2969;
    s += (texture2D(t, vUv + uDir * 3.2941) + texture2D(t, vUv - uDir * 3.2941)) * .0945;
    s += (texture2D(t, vUv + uDir * 5.1765) + texture2D(t, vUv - uDir * 5.1765)) * .0104;
    gl_FragColor = s; }`;
const blurQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { t: { value: null }, uDir: { value: new THREE.Vector2() } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`, fragmentShader: BLUR_FRAG,
  depthTest: false, depthWrite: false, blending: THREE.NoBlending }));
const blurScene = new THREE.Scene(); blurScene.add(blurQuad);
function soften(name, px, rounds = QUAL.level >= 2 ? 1 : 2) {   // px: blur size in half-size pixels; two rounds of across + down for a smooth, round softness
  const [a, b] = blurT[name], U = blurQuad.material.uniforms, w = a.width, h = a.height, st = px / 4 * (rounds === 1 ? 1.41 : 1);   // one round on slow phones, a touch wider
  let src = layers[name].texture;
  for (let r = 0; r < rounds; r++) {
    U.t.value = src; U.uDir.value.set(st / w, 0); renderer.setRenderTarget(a); renderer.render(blurScene, postCam);
    U.t.value = a.texture; U.uDir.value.set(0, st / h); renderer.setRenderTarget(b); renderer.render(blurScene, postCam);
    src = b.texture;
  }
}

// ---------- the opener: the compound wall's huge steel gate, in real 3D ----------
// the compound wall with its gate pillars (a see-through opening between them), the pillars' inner faces, and two thick
// steel leaves with laser-cut (CNC) peacock-and-lotus panels: the house front shows through the cuts. On tap the leaves
// swing inward on their hinges; the black-brown metal catches the light as it turns, and the camera walks through into the house front.
const door = { g: new THREE.Group(), ready: false, t0: -1, done: false, L: null, R: null, flash: 0 };
door.g.visible = false; scene.add(door.g);
const DOOR_D = .6;   // how far in front of the starting eye the gate stands (the walk-in passes through it)
const DOOR_VERT = `varying vec2 vUv; varying vec3 vN, vF, vW; void main(){ vUv = uv; vF = normal; vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const DOOR_FRAG = `uniform sampler2D map; uniform float uMetal, uCut, uExt; uniform vec3 uEdge; varying vec2 vUv; varying vec3 vN, vF, vW;
  float pp(float t, float w){ return w * (1.0 - abs(fract(t / (2.0 * w)) * 2.0 - 1.0)); }   // ping-pong inside an edge band
  void main(){
    vec2 st = vUv;
    if (uExt > .5) {   // the wall runs on past the picture: its outer bands (wall, sky, driveway) mirrored, never the gate opening
      if (st.x < 0.0) st.x = pp(-st.x, .14); else if (st.x > 1.0) st.x = 1.0 - pp(st.x - 1.0, .14);
      if (st.y < 0.0) st.y = pp(-st.y, .1); else if (st.y > 1.0) st.y = 1.0 - pp(st.y - 1.0, .1);
    }
    vec4 c = texture2D(map, st);
    vec3 col = c.rgb;
    if (uMetal > .5) {
      if (abs(vF.z) < .5) { col = uEdge; c.a = 1.0; }          // the leaf's thick edge (which face: from the leaf's own normal)
      else if (vF.z < 0.0) col *= .72;                         // its back
      if (c.a < uCut) discard;
      vec3 n = normalize(vN), V = normalize(cameraPosition - vW), L = normalize(vec3(-.35, .5, 1.0));
      if (dot(n, V) < 0.0) n = -n;
      float d = clamp(dot(n, L), 0.0, 1.0), sp = pow(clamp(dot(reflect(-L, n), V), 0.0, 1.0), 18.0);
      col = col * (.6 + .6 * d) + vec3(1.0, .82, .6) * sp * .4;    // dark bronze-black steel: darker as it turns, a moving warm glint
    } else if (c.a < uCut) discard;
    gl_FragColor = vec4(col, c.a); }`;
function doorMat(img, o = {}) {
  return new THREE.ShaderMaterial({ vertexShader: DOOR_VERT, fragmentShader: DOOR_FRAG, transparent: true, depthWrite: true, depthTest: true,
    uniforms: { map: { value: tex(img) }, uMetal: { value: o.metal ? 1 : 0 }, uCut: { value: o.cut ?? .5 }, uExt: { value: o.ext ? 1 : 0 }, uEdge: { value: new THREE.Color(o.edge || "#2a1a10") } } });
}
async function buildDoor() {
  const [wall, ll, lr] = await Promise.all(["wall", "leaf_l", "leaf_r"].map((n) => loadImg(`img/gate/${n}.webp`)));
  const viewH = 2 * DOOR_D * Math.tan(25 * Math.PI / 180), Hw = viewH * 1.1, Ww = Hw / 1.5;   // the wall always covers the screen
  const O = { u0: .2393, u1: .7588, v0: .2865, v1: .7682 };                                  // the gate opening in the wall picture (from the top)
  const X = (u) => (u - .5) * Ww, Y = (v) => (.5 - v) * Hw;
  // the wall plane is 5× the picture each way, so it is never seen to end (any screen shape, the camera's sway, the walk-in)
  const wg = new THREE.PlaneGeometry(Ww * 5, Hw * 5), wuv = wg.attributes.uv;
  for (let n = 0; n < wuv.count; n++) wuv.setXY(n, (wuv.getX(n) - .5) * 5 + .5, (wuv.getY(n) - .5) * 5 + .5);
  const wallM = new THREE.Mesh(wg, doorMat(wall, { cut: .5, ext: true })); wallM.renderOrder = 1e5;
  // the pillars' inner faces and the threshold: the gate's depth, seen as the camera moves
  const dz = Ww * .02, th = Ww * .028, jd = dz + th + Ww * .05, oh = Y(O.v0) - Y(O.v1);
  const plaster = new THREE.MeshBasicMaterial({ color: "#c9ae86", transparent: true, depthWrite: true, side: THREE.DoubleSide });
  const jambs = [O.u0, O.u1].map((u, n) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(jd, oh), plaster);
    m.rotation.y = Math.PI / 2; m.position.set(X(u) + (n ? 1 : -1) * .0005, (Y(O.v0) + Y(O.v1)) / 2, -jd / 2); m.renderOrder = 1e5 + 1; return m; });
  const sill = new THREE.Mesh(new THREE.PlaneGeometry(X(O.u1) - X(O.u0), jd), new THREE.MeshBasicMaterial({ color: "#a98c6c", transparent: true, depthWrite: true, side: THREE.DoubleSide }));
  sill.rotation.x = -Math.PI / 2; sill.position.set(0, Y(O.v1), -jd / 2); sill.renderOrder = 1e5 + 1;
  // the leaves: thick steel boxes hinged at the pillars, a little behind the wall's face, tucked slightly behind the pillars
  const lw = -X(O.u0 - .008), top = Y(O.v0 - .004), bot = Y(O.v1 + .002), lh = top - bot;
  const leaf = (img, sd) => {
    const geo = new THREE.BoxGeometry(lw, lh, th, 1, 1, 1); geo.translate(-sd * lw / 2, 0, 0);
    const m = new THREE.Mesh(geo, doorMat(img, { metal: true, cut: .4 })); m.position.set(sd * lw, (top + bot) / 2, -dz - th / 2); m.renderOrder = 1e5 + 2; return m;
  };
  door.L = leaf(ll, -1); door.R = leaf(lr, 1);
  door.g.add(wallM, ...jambs, sill, door.L, door.R);
  // stand it square in front of the starting eye, its centre on the line of sight
  const R0 = ROOMS[0], g0 = rooms[0].g.position, eyeZ = g0.z + ENTER + .7, lookY = g0.y + (R0.hz - .5) * PH, lookZ = g0.z + PLATE_Z + .7;
  door.g.position.set(0, g0.y + (lookY - g0.y) / (eyeZ - lookZ) * DOOR_D, eyeZ - DOOR_D);
  door.ready = true;
}
function stepDoor(now) {
  if (!door.ready || door.done) return;
  const k = door.t0 < 0 ? 0 : now - door.t0, dur = RM ? .5 : 2.4;
  const a = (d) => eio(clamp((k - d) / dur)) * 1.66;                 // a heavy gate: to about 95°, the right leaf a beat behind
  door.L.rotation.y = a(.05); door.R.rotation.y = -a(.2);
  door.flash = door.t0 < 0 || RM ? 0 : .14 * Math.sin(Math.PI * clamp((k - .2) / 1.9));   // warm daylight as the gate opens
  if (door.t0 >= 0 && k > dur + 2.6) { door.done = true; door.g.visible = false; }
}

// ---------- post: stack the layers, then grain, vignette, warm light at the doorways, lens shimmer while moving ----------
const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: { tC: { value: layers.cur.texture }, tCb: { value: blurT.cur[1].texture }, tN: { value: layers.next.texture }, tNb: { value: blurT.next[1].texture },
    tFb: { value: blurT.far[1].texture }, uKC: { value: 0 }, uKN: { value: 1 }, uHasN: { value: 0 }, uHasF: { value: 0 }, uBg: { value: new THREE.Color(0xe9b77a) },
    uVel: { value: 0 }, uT: { value: 0 }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color("#ffd9a0") }, uSmoke: { value: 0 }, uDrift: { value: 0 }, uAsp: { value: .5 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `uniform sampler2D tC, tCb, tN, tNb, tFb; uniform float uKC, uKN, uHasN, uHasF; uniform vec3 uBg;
    uniform float uVel, uT, uFlash, uSmoke, uDrift, uAsp; uniform vec3 uFlashCol; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p){ float v = 0.0, a = .5; for (int k = 0; k < 4; k++) { v += a * n2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return v; }
    vec3 stack(vec2 uv){   // room beyond (always soft) under the next room under the room we stand in
      vec3 col = uHasF > .5 ? texture2D(tFb, uv).rgb + uBg * (1.0 - texture2D(tFb, uv).a) : uBg;
      if (uHasN > .5) { vec4 n = mix(texture2D(tN, uv), texture2D(tNb, uv), uKN); col = n.rgb + col * (1.0 - n.a); }
      vec4 c = uKC > .001 ? mix(texture2D(tC, uv), texture2D(tCb, uv), uKC) : texture2D(tC, uv);
      return c.rgb + col * (1.0 - c.a); }
    void main(){
      vec2 c = vUv - .5; float r = dot(c, c);
      vec2 uv = vUv - c * r * uVel * .3;
      float ca = .0006 + .005 * uVel;
      vec3 col = vec3(stack(uv + c * ca).r, stack(uv).g, stack(uv - c * ca).b);
      col *= 1.0 - r * .6;
      col = mix(col, uFlashCol + col * .3, uFlash * (1.0 - r * 1.2));
      if (uSmoke > .001) {   // soft white smoke at a doorway (switched off)
        vec2 q = vec2((vUv.x - .5) * uAsp, vUv.y) * 2.6;
        float a = fbm(q + vec2(uT * .05, -uT * .035 + uDrift * .9));
        float b = fbm(q * 1.9 - vec2(uT * .07, uDrift * 1.6) + a * 1.4);
        float body = smoothstep(.3, .8, a * .55 + b * .6 + uSmoke * .45 - .2);
        float m = clamp(body * (.25 + uSmoke * .6) + uSmoke * uSmoke * .18, 0.0, .86);
        col = mix(col, vec3(1.0, .985, .965), m * smoothstep(0.0, .25, uSmoke));
      }
      col += (h(vUv * 917.0 + fract(uT) * 31.0) - .5) * .045;
      gl_FragColor = vec4(col, 1.0); }`,
  depthTest: false, depthWrite: false,
}));
const postScene = new THREE.Scene(); postScene.add(post);
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// ---------- phone performance ----------
// Every frame draws three layers, softens two or three of them and stacks them, plus the people's layer. A phone that cannot
// keep up steps down by itself (never back up, so it never flickers between levels):
//   level 1: fewer pixels (sharpness 1.25×)   level 2: 1×, one blur round, and the soft rooms behind refreshed every other frame
// ?q=0|1|2 forces a level (for testing); the median frame time over a second decides, so one-off loading hitches don't count.
const QUAL = { level: 0, caps: PHONE ? [1.6, 1.25, 1] : [1.5, 1.25, 1], times: [], hold: 0, forced: Q.has("q") };
if (QUAL.forced) QUAL.level = clamp(Math.round(+Q.get("q") || 0), 0, 2);
function govern(rawMs) {
  if (QUAL.forced || QUAL.level >= 2 || RM || document.hidden || rawMs > 250) return;   // a hidden tab or a stall is not slowness
  if (QUAL.hold > 0) { QUAL.hold--; return; }
  QUAL.times.push(rawMs); if (QUAL.times.length < 60) return;
  const med = QUAL.times.sort((a, b) => a - b)[30]; QUAL.times = [];
  if (med > 1000 / 40) { QUAL.level++; QUAL.hold = 45; layout(); console.info("invite: quality level", QUAL.level, "(median frame", med.toFixed(1), "ms)"); }
}

// ---------- layout ----------
let tick2 = 0, softKey = "";
let L = { W: 1, H: 1, dpr: 1 };
function layout() {
  const W = stage.clientWidth, H = stage.clientHeight, dpr = Math.min(devicePixelRatio || 1, QUAL.caps[QUAL.level]);
  renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
  fgRenderer.setPixelRatio(dpr); fgRenderer.setSize(W, H, false);
  const fw = Math.round(W * dpr), fh = Math.round(H * dpr);
  for (const n in layers) { layers[n].setSize(fw, fh); for (const b of blurT[n]) b.setSize(Math.round(fw / 2), Math.round(fh / 2)); }
  camera.aspect = W / H; camera.updateProjectionMatrix(); post.material.uniforms.uAsp.value = W / H;
  for (const m of pointMats) m.uniforms.uPx.value = (m.uniforms.uRise.value > 0 ? 30 : m.uniforms.uPx.value > 24 ? 26 : 22) * H * dpr / 800;
  L = { W, H, dpr }; softKey = "";   // new layer sizes: redraw the soft layers at once
  $("#spacer").style.height = (N - 1 + .75) * innerHeight * SNAP_K + innerHeight + "px"; placeSnaps();   // one swipe, one stop (2026-10-13): a short scroll, one snap point a stop
}

// ---------- DOM text ----------
function split(el) {
  // script lines (names, "Thank you") stay whole: the font joins and reshapes letters by their neighbours, so they are
  // revealed with a left-to-right writing wipe instead of letter by letter
  // Indic lines stay whole to preserve conjuncts and combining marks: in word spans, Chrome drew a stray piece of a Tamil letter above the line
  const whole = el.classList.contains("script") || ["ta","ml","te","kn","hi"].includes(LANG);
  el.classList.toggle("wipe", whole); if (whole) return;
  const txt = el.textContent; el.textContent = ""; let n = 0; const words = txt.split(" ");
  words.forEach((word, wi) => {
    const w = document.createElement("span"); w.className = "w";
    [...word].forEach((ch) => { const s = document.createElement("span"); s.className = "c"; s.textContent = ch; s.style.setProperty("--i", n++); w.appendChild(s); });
    el.appendChild(w); if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  el.style.setProperty("--n", Math.max(1, n));
}
// long names never spill: the gate's tag keeps the names on one line, and a card's script line (which may wrap between
// words) shrinks when a single long name is wider than the card
function fitTag() {
  document.querySelectorAll("#doors .script, .plaque .script").forEach((el) => {
    el.style.fontSize = ""; el.style.whiteSpace = "";
    const box = el.parentElement, cs = getComputedStyle(box), room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (room <= 0) return;
    // ported from Theeram 2026-10-12: the gate tag shrinks a little on one line, then wraps onto two lines between words
    const gate = !!el.closest("#doors"), maxLines = gate ? 2 : 3, min = 20;
    const lines = () => { const c = getComputedStyle(el), lh = parseFloat(c.lineHeight) || parseFloat(c.fontSize) * 1.2;
      return Math.round((el.clientHeight - parseFloat(c.paddingTop) - parseFloat(c.paddingBottom)) / lh); };
    const fs0 = parseFloat(getComputedStyle(el).fontSize); let fs = fs0;
    const size = (v) => { fs = v; el.style.fontSize = v + "px"; };
    if (gate) {
      el.style.whiteSpace = "nowrap";
      while (el.scrollWidth > room + 1 && fs > fs0 * .78) size(fs - 1);
      if (el.scrollWidth <= room + 1) return;
      el.style.whiteSpace = "normal"; size(fs0);
    }
    while (lines() > maxLines && fs > min) size(fs - 1);
    while (el.scrollWidth > room + 1 && fs > 12) size(fs - 1);
  });
}
function renderText() {
  document.documentElement.lang = LANG;
  document.body.classList.toggle("ind", LANG !== "en");for(const l of ["en","ml","ta","te","kn","hi"])document.body.classList.toggle(l,LANG===l);
  document.querySelectorAll("[data-t]").forEach((el) => {
    const v = tget(el.dataset.t); el.textContent = typeof v === "string" ? v : "";
    if (el.closest(".plaque") && el.tagName === "P") el.hidden = !el.textContent;   // a line the couple left empty takes no room
  });
  document.querySelectorAll("[data-a]").forEach((el) => el.setAttribute("aria-label", tget(el.dataset.a) || ""));
  document.querySelectorAll(".split").forEach(split);
  const hello = GUEST ? fill(T.hello, { g: GUEST }) : "";
  $("#helloCurtain").textContent = hello; $("#helloEnd").textContent = hello; $("#helloIntro").textContent = hello;
  $("#helloIntro").hidden = !hello;
  document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));
  $("#hudT").textContent = T.titles[ROOMS[Math.max(0, lastCh)].id];
  // the tab title and link-preview tags (the server writes the same into the page for WhatsApp and other link previews)
  document.title = `${T.names} · ${T.brand}`;
  const meta = { "#m-desc": T.ogDesc, "#m-ogt": T.ogTitle, "#m-ogd": T.ogDesc };
  for (const k in meta) if (meta[k]) $(k)?.setAttribute("content", meta[k]);
  if (started) $("#tapl").textContent = T.btn.tap;
  wireLinks(); buildEvents(); buildRsvpChips(); updateRsvp();
  if (signMesh) { signMesh.material.map.dispose(); signMesh.material.map = signCanvas(); }   // shared material: the twin follows
  fitTag();
}
const sections = [...document.querySelectorAll(".ch")];
function domFor(n, t) {
  const s = sections[n], last = n === N - 1;
  const vis = t > -.05 && t < (last ? 9 : T_OUT + .02);
  s.classList.toggle("on", vis); if (!vis) return;
  const out = last ? 0 : clamp((t - (T_OUT - .1)) / .1);
  s.style.setProperty("--pp", clamp((t - (n === 0 ? -.4 : SMOKE_OUT - .04)) / .1) * (1 - out));   // each card rises as the smoke clears
  [...s.querySelectorAll(".split,.rise")].forEach((el, j) => {
    const inn = clamp((t - (n === 0 ? -.3 : last && el.classList.contains("acts") ? .55 : SMOKE_OUT - .02) - j * .03) / .14);
    el.style.setProperty("--p", inn * (1 - out));
    el.classList.toggle("done", inn * (1 - out) > .999);   // fully shown: stop clipping, so flourishes are never cut
  });
}

// ---------- flower shower: rose petals, marigolds, jasmine, and rice ----------
// little drawn flowers (SVG), each tumbling in 3D as it falls, so they read as real petals, not dots
const FLOWERS = (() => {
  const svg = (w, h, body) => "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`);
  // a rose petal: broad, slightly uneven rounded top, pinched pale base, a soft fold and a lit, curled rim
  const rose = (a, b, c) => svg(40, 46, `<defs><radialGradient id="g" cx=".5" cy=".95" r="1.05"><stop offset="0" stop-color="#f6d9a8"/><stop offset=".22" stop-color="${c}"/><stop offset=".62" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs>
    <path d="M20 45C14 41 6 33 3.5 22 1.6 13 5 5.5 12 3.6c3.2-.9 5.6.2 8.4-.3 3-.5 5.3-1.4 8.6-.2C35.5 5.4 38.8 12.6 36.6 22 34.2 33 26 41 20 45z" fill="url(#g)"/>
    <path d="M20 45C14 41 6 33 3.5 22 1.6 13 5 5.5 12 3.6c3.2-.9 5.6.2 8.4-.3 3-.5 5.3-1.4 8.6-.2C35.5 5.4 38.8 12.6 36.6 22 34.2 33 26 41 20 45z" fill="url(#f)"/>
    <path d="M6 12C9 6.5 14 4.6 20.4 5.2 26 4.2 31 4.8 34.5 10" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M19 42c-2-7-2.6-17-.6-28M22 41c2.4-6 3.6-14 3-22" fill="none" stroke="${c}" stroke-opacity=".28" stroke-width=".7"/>`);
  // a marigold head seen from above: layers of frilly florets, uneven outline, shadowed heart
  const marigold = (a, b, c, seed) => {
    let p = "", r0 = seed;
    const rnd = () => (r0 = (r0 * 9301 + 49297) % 233280) / 233280;
    for (const [r, n, sz, col, sh] of [[15.5, 22, 4.6, c, .5], [12.5, 19, 4.4, b, .4], [9.5, 16, 4, b, .35], [6.5, 12, 3.6, a, .3], [3.4, 7, 3, a, .25]])
      for (let k = 0; k < n; k++) {
        const t = (k + rnd() * .6) / n * Math.PI * 2, rr = r + (rnd() - .5) * 2.6, x = 20 + Math.cos(t) * rr, y = 20 + Math.sin(t) * rr, w = sz * (.8 + rnd() * .4);
        // a floret: a short fan with a wavy tip, turned outwards
        p += `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(t * 57.3 + 90).toFixed(0)})" d="M0 ${(w * .9).toFixed(1)}C${(-w).toFixed(1)} ${(w * .4).toFixed(1)} ${(-w * 1.05).toFixed(1)} ${(-w * .6).toFixed(1)} ${(-w * .5).toFixed(1)} ${(-w * .8).toFixed(1)}Q${(-w * .25).toFixed(1)} ${(-w * 1.1).toFixed(1)} 0 ${(-w * .8).toFixed(1)}Q${(w * .25).toFixed(1)} ${(-w * 1.1).toFixed(1)} ${(w * .5).toFixed(1)} ${(-w * .8).toFixed(1)}C${(w * 1.05).toFixed(1)} ${(-w * .6).toFixed(1)} ${w.toFixed(1)} ${(w * .4).toFixed(1)} 0 ${(w * .9).toFixed(1)}z" fill="${col}" stroke="#8a3a00" stroke-opacity="${sh}" stroke-width=".5"/>`;
      }
    return svg(40, 40, `<defs><radialGradient id="d" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#7a2e00" stop-opacity=".35"/><stop offset=".25" stop-color="#7a2e00" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#5a1e00" stop-opacity=".25"/></radialGradient>
      <radialGradient id="l" cx=".38" cy=".32" r=".6"><stop offset="0" stop-color="#fff6c0" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      ${p}<circle cx="20" cy="20" r="18" fill="url(#d)"/><circle cx="20" cy="20" r="18" fill="url(#l)"/>`);
  };
  let j = "";
  for (let k = 0; k < 5; k++) j += `<path d="M20 20C16 13 16 5 20 1c4 4 4 12 0 19z" fill="url(#w)" stroke="#d9d2bf" stroke-width=".6" transform="rotate(${k * 72 + 10} 20 20)"/>`;
  const jasmine = svg(40, 40, `<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#efe6cf"/></linearGradient></defs>${j}<circle cx="20" cy="20" r="2.4" fill="#e7c95a"/>`);
  return {
    petal: [rose("#ff7d92", "#d81c3f", "#7d0a1f"), rose("#ff9eb0", "#e5486a", "#a51a3c"), rose("#ff6f6f", "#c01428", "#6e0614"), rose("#ffd0d8", "#f28aa2", "#c4506e")],
    bloom: [marigold("#ffc93a", "#ff9f0a", "#e06a00", 7), marigold("#ffe46a", "#ffc21a", "#f09a00", 31), jasmine],
  };
})();
// every flower is moved by the frame loop (not a CSS animation), so none can freeze on screen; it is removed once it falls out
const falling = [];
function shower(n, kind) {
  if (RM) return;
  const box = $("#petals");
  for (let i = 0; i < n; i++) {
    const el = document.createElement("i"), side = i % 2 ? 1 : -1, H = L.H;
    const f = { el, img: null, x: (i % 2 ? Math.random() * .26 : 1 - Math.random() * .26) * L.W,   // down the sides only, never across the faces
      y: -30 - Math.random() * H * .35, vy: H / (3 + Math.random() * 2.6), dx: -side * Math.random() * .08 * L.W, sw: 6 + Math.random() * 12,
      ph: Math.random() * 6.3, sp: 1.6 + Math.random() * 1.8, r: Math.random() * 360, vr: (Math.random() - .5) * 90, fx: (.5 + Math.random()) * side, t: 0 };
    if (kind === "rice") { const s = 4 + Math.random() * 3; el.className = "rice"; el.style.width = s + "px"; el.style.height = s * 1.7 + "px"; }
    else {
      const bloom = i % 3 === 2, src = bloom ? FLOWERS.bloom[Math.floor(Math.random() * FLOWERS.bloom.length)] : FLOWERS.petal[i % 4];
      const s = bloom ? 15 + Math.random() * 8 : 14 + Math.random() * 9, img = new Image();
      img.src = src; img.alt = ""; img.style.width = s + "px"; img.style.height = s * (bloom ? 1 : 1.15) + "px";
      el.className = "fl"; el.appendChild(img); f.img = img;
    }
    el.style.transform = `translate3d(${f.x}px, ${f.y}px, 0)`;
    box.appendChild(el); falling.push(f);
  }
}
function stepFlowers(dt) {
  for (let k = falling.length - 1; k >= 0; k--) {
    const f = falling[k]; f.t += dt; f.y += f.vy * dt; f.r += f.vr * dt;
    const x = f.x + f.dx * Math.min(1, f.y / L.H) + Math.sin(f.t * f.sp + f.ph) * f.sw;
    f.el.style.transform = `translate3d(${x.toFixed(1)}px, ${f.y.toFixed(1)}px, 0) rotate(${f.r.toFixed(0)}deg)`;
    if (f.img) { const w = Math.sin(f.t * f.sp * 1.7 + f.ph); f.img.style.transform = `rotateX(${(w * 55 * f.fx).toFixed(0)}deg) rotateY(${(-w * 38 * f.fx).toFixed(0)}deg)`; }
    if (f.y > L.H + 40 || f.t > 12) { f.el.remove(); falling.splice(k, 1); }
  }
}

// ---------- countdown ----------
const WED = M.countdown;
const cd = ["d", "h", "m", "s"].map((k) => document.getElementById("cd-" + k));
function tick() {
  if (!cd[0]) return;                                   // no wedding room, no countdown
  const s = Math.max(0, Math.floor((WED - Date.now()) / 1000));
  cd[0].closest(".count").hidden = !s;                  // the day has come: no row of zeros
  [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].forEach((v, i) => { const t = String(v).padStart(i ? 2 : 1, "0"); if (cd[i].textContent !== t) cd[i].textContent = t; });
}
setInterval(tick, 1000); tick();

// ---------- calendars, maps, events, RSVP, share, card ----------
const show1 = (el, on) => { el.hidden = !on; };
function icsFor(evs) {
  const esc = (s) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//cardsforknots//invite//EN"];
  evs.forEach((e) => {
    lines.push("BEGIN:VEVENT", `UID:${e.key}-${M.slug}@${M.site}`, `DTSTAMP:${now}`, `DTSTART:${e.cal[0]}`, `DTEND:${e.cal[1]}`,
      `SUMMARY:${esc(T.calTitle(e.name))}`, `LOCATION:${esc(e.where)}`, "END:VEVENT"); });
  lines.push("END:VCALENDAR");
  return URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
}
function calLink(a, evs) {
  if (IOS) { a.href = icsFor(evs); a.download = `${M.slug}.ics`; a.removeAttribute("target"); return; }
  const e = evs[evs.length - 1];
  a.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(T.calTitle(e.name))}&dates=${e.cal[0]}/${e.cal[1]}&location=${encodeURIComponent(e.where)}`;
  a.removeAttribute("download"); a.target = "_blank";
}
// the end card's buttons follow the main event (the wedding); a button with nothing behind it is not shown
function wireLinks() {
  const main = T.main;
  show1($("#calBtn"), !!main); if (main) calLink($("#calBtn"), IOS ? T.events : [main]);
  show1($("#mapBtn"), !!main?.map); if (main?.map) $("#mapBtn").href = main.map;
  show1($("#rsvpBtn"), !!(M.rsvpPhone || M.rsvpSite));
  show1($("#evBtn"), T.events.length > 0);
  document.querySelectorAll(".acts .row").forEach((r) => { const n = [...r.children].filter((c) => !c.hidden).length; r.classList.toggle("one", n < 2); r.hidden = !n; });
}
function buildEvents() {
  const ol = $("#evList"); ol.textContent = "";
  T.events.forEach((e) => {
    const li = document.createElement("li");
    const h = document.createElement("h4"); h.textContent = e.name;
    const p = document.createElement("p"); p.textContent = e.when;
    const p2 = document.createElement("p"); p2.textContent = e.where; p2.hidden = !e.where;
    const two = document.createElement("div"); two.className = "two";
    if (e.map) { const m = document.createElement("a"); m.textContent = T.btn.map; m.href = e.map; m.target = "_blank"; m.rel = "noopener"; two.append(m); }
    const c = document.createElement("a"); c.textContent = T.btn.cal; c.rel = "noopener"; calLink(c, [e]);
    two.append(c); li.append(h, p, p2, two); ol.appendChild(li);
  });
}
let openSheet = null;
function show(el) { closeAll(); $("#scrim").hidden = false; el.hidden = false; openSheet = el; document.body.style.overflow = "hidden"; }
function closeAll() { document.querySelectorAll(".sheet").forEach((s) => (s.hidden = true)); $("#scrim").hidden = true; openSheet = null; document.body.style.overflow = ""; }
$("#scrim").addEventListener("click", closeAll);
document.querySelectorAll(".sheet .close").forEach((b) => b.addEventListener("click", closeAll));
addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
// phone mockup + All events tab (2026-10-13): All events (owner: "keep All events as a chip snug to the edge and clicking it collapses"). The chip is a tab
// on the right edge; tapping it slides the list of events out from the edge, tapping it again — or the scene, or moving on
// to another stop — tucks it back. The list is the same sheet as before (each event with Map and Calendar), moved into the
// stage as a drawer.
const evSheet = $("#evSheet"), evBtn = $("#evBtn");
stage.appendChild(evSheet); evSheet.classList.add("drawer"); evBtn.setAttribute("aria-expanded", "false");
const evOpen = () => !evSheet.hidden && evSheet.classList.contains("open");
function evDrawer(open) {
  if (open) { if (openSheet) closeAll(); evSheet.hidden = false; void evSheet.offsetWidth; evSheet.classList.add("open"); }
  else { evSheet.classList.remove("open"); setTimeout(() => { if (!evSheet.classList.contains("open")) evSheet.hidden = true; }, 420); }
  evBtn.classList.toggle("open", open); evBtn.setAttribute("aria-expanded", String(open)); document.body.classList.toggle("evd", open);
}
evBtn.addEventListener("click", () => evDrawer(!evOpen()));
evSheet.querySelector(".close")?.addEventListener("click", (e) => { e.stopImmediatePropagation(); evDrawer(false); });
addEventListener("pointerdown", (e) => { if (evOpen() && !e.target.closest("#evSheet, #evBtn")) evDrawer(false); }, true);   // a tap or a swipe anywhere else tucks it back
addEventListener("wheel", () => { if (evOpen()) evDrawer(false); }, { passive: true });
addEventListener("keydown", (e) => { if (e.key === "Escape" && evOpen()) evDrawer(false); });
const RS = { yes: true, n: 2, which: new Set(M.events.map((e) => e.key)) };
$("#rName").value = GUEST;
function buildRsvpChips() {
  const box = $("#rWhich"); box.textContent = "";
  box.closest(".field").hidden = T.events.length < 2;   // one event: nothing to choose
  T.events.forEach((e) => {
    const b = document.createElement("button"); b.textContent = e.name; b.setAttribute("aria-pressed", String(RS.which.has(e.key)));
    b.addEventListener("click", () => { RS.which.has(e.key) ? RS.which.delete(e.key) : RS.which.add(e.key); b.setAttribute("aria-pressed", String(RS.which.has(e.key))); updateRsvp(); });
    box.appendChild(b);
  });
}
function updateRsvp() {
  $("#rYes").setAttribute("aria-checked", String(RS.yes)); $("#rNo").setAttribute("aria-checked", String(!RS.yes));
  $("#rsvpSheet").classList.toggle("no", !RS.yes); $("#rN").textContent = RS.n;
  if (!M.rsvpPhone) return;
  const name = $("#rName").value.trim() || T.rsvp.anon;
  const list = T.events.filter((e) => RS.which.has(e.key)).map((e) => e.name).join(", ") || T.main?.name || "";
  $("#rSend").href = `https://wa.me/${M.rsvpPhone}?text=${encodeURIComponent(RS.yes ? fill(T.msgYes, { name, couple: T.couple, events: list, n: RS.n }) : fill(T.msgNo, { name, couple: T.couple }))}`;
}
$("#rName").addEventListener("input", updateRsvp);
$("#rYes").addEventListener("click", () => { RS.yes = true; updateRsvp(); });
$("#rNo").addEventListener("click", () => { RS.yes = false; updateRsvp(); });
$("#rMinus").addEventListener("click", () => { RS.n = Math.max(1, RS.n - 1); updateRsvp(); });
$("#rPlus").addEventListener("click", () => { RS.n = Math.min(20, RS.n + 1); updateRsvp(); });
$("#rsvpBtn").addEventListener("click", () => show($("#rsvpSheet")));
// the reply saved on the website, into the couple's guest list (the site's own RSVP request; a guest link carries a token,
// a shared link sends the name and gets a token back, so a second reply from this phone updates the first)
$("#rSend").addEventListener("click",e=>{if(window.FMI_PREVIEW){e.preventDefault();toast("Preview only — no RSVP was sent.");}});
function toast(s) { const t = $("#toast"); t.textContent = s; t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 2000); }
$("#shareBtn").addEventListener("click", async () => {
  const url = M.shareUrl || location.href;   // on the site: the plain invitation link, not this guest's own
  try { if (navigator.share) return await navigator.share({ title: T.names, text: T.shareText, url }); } catch (e) { if (e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); toast(T.btn.copied); } catch {}
});
async function makeCard() {   // a portrait picture invite: the garden painting with names on top and every function below
  const c = document.createElement("canvas"); c.width = 1080; c.height = 1350; const x = c.getContext("2d");
  const plate = await loadImg(`img/plate/${ALL_ROOMS.find((R) => R.id === "story").plate}.webp`);
  x.drawImage(plate, 0, 100, 1024, 1280, 0, 0, 1080, 1350);
  const panel = (y, h) => { x.fillStyle = "rgba(255,248,234,.95)"; x.fillRect(70, y, 940, h);
    x.strokeStyle = "#c99a3b"; x.lineWidth = 3; x.strokeRect(84, y + 14, 912, h - 28); x.lineWidth = 1; x.strokeRect(94, y + 24, 892, h - 48); };
  const body = (s) => (LANG === "en" ? `600 ${s}px "Cormorant Garamond"` : `600 ${s * .8}px "${FONTS[LANG].b}"`);
  x.textAlign = "center"; x.textBaseline = "middle";
  panel(50, 400);
  const g = x.createLinearGradient(200, 80, 880, 420); g.addColorStop(0, "#6e1509"); g.addColorStop(.5, "#b5782a"); g.addColorStop(1, "#6e1509"); x.fillStyle = g;
  x.font = body(32); x.letterSpacing = LANG === "en" ? "10px" : "0px"; x.fillText(LANG === "en" ? T.brand.toUpperCase() : T.brand, 540, 118, 860);
  x.letterSpacing = "0px"; x.font = LANG === "en" ? `400 140px "Great Vibes"` : `700 92px "${FONTS[LANG].d}"`; x.fillText(T.names, 540, 232, 860);
  x.font = body(34); x.letterSpacing = LANG === "en" ? "8px" : "0px"; x.fillText(LANG === "en" ? T.marrying.toUpperCase() : T.marrying, 540, 335, 860);
  x.font = body(46); x.fillText(T.dateShort, 540, 395); x.letterSpacing = "0px";
  const evs = T.events.slice(0, 7), ph = 400 + Math.max(0, evs.length - 3) * 94, py = 1300 - ph;   // the panel grows upward for more events
  panel(py, ph);
  evs.forEach((e, n) => { const y = py + 86 + n * 94 + (evs.length < 3 ? (3 - evs.length) * 47 : 0);
    x.fillStyle = "#8f1d14"; x.font = LANG === "en" ? `400 56px "Great Vibes"` : `700 34px "${FONTS[LANG].d}"`; x.fillText(e.name, 540, y - 6, 860);
    x.fillStyle = "#7a2a14"; x.font = body(28); x.fillText(e.when, 540, y + 38, 860); });
  x.fillStyle = "#a0651f"; x.font = body(24); x.letterSpacing = "4px"; x.fillText(M.site, 540, py + ph - 34); x.letterSpacing = "0px";
  return new Promise((r) => c.toBlob(r, "image/jpeg", .9));
}
$("#cardBtn").addEventListener("click", async () => {
  const blob = await makeCard(), file = new File([blob], `${M.slug}-invite.jpg`, { type: "image/jpeg" });
  try { if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title: T.names }); } catch (e) { if (e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
});

// ---------- music ----------
// Two kinds of song: our own audio file (kiliye by default) or the client's own YouTube song (M.musicYt). Both start part-way in
// (M.musicStart seconds) and loop back to that point. musicOn = the guest wants music; the button's aria-pressed = it is playing.
const bgm = $("#bgm"), musicBtn = $("#music"), ytId = M.musicYt || "";
if (M.music) bgm.src = M.music + (M.musicStart ? "#t=" + M.musicStart : ""); else if (!ytId) musicBtn.hidden = true;   // no song chosen: no music button
// a song can start part-way in (music.start, e.g. 1:31) and loops back to that point, not to the beginning
if (M.musicStart && M.music) {
  bgm.loop = false;
  // a start past the end of the song (a changed file) would play nothing: use the beginning
  const from = () => (bgm.duration && M.musicStart > bgm.duration - 3 ? 0 : M.musicStart);
  bgm.addEventListener("loadedmetadata", () => { if (bgm.currentTime < from() - .5) bgm.currentTime = from(); });
  bgm.addEventListener("ended", () => { bgm.currentTime = from(); if (musicOn) bgm.play().catch(() => {}); });
}
let actx = null, gain = null, musicOn = store.get("inv-music") !== "off";
// the client's YouTube song: the official player in a tiny off-screen box (the page only needs its sound). It is loaded a moment
// after the page starts, so it is ready when the guest taps the gate (phones only allow sound that a tap starts). If YouTube
// refuses the song (embedding off, removed, private) the music button simply goes away; the invitation never breaks.
let ytp = null, ytReady = false, ytTimer = 0, ytCheck = 0;
const tapped = () => { try { return started; } catch { return false; } };   // `started` is declared further down
const ytLevel = (v) => { try { ytp.setVolume(Math.round(v)); } catch {} };
function ytFade(to, secs, done) {
  clearInterval(ytTimer); if (!ytp) return done && done();
  let v = 0; try { v = ytp.getVolume(); } catch {}
  const steps = Math.max(1, Math.round(secs * 10)), d = (to - v) / steps; let n = 0;
  ytTimer = setInterval(() => { n++; ytLevel(n >= steps ? to : v + d * n); if (n >= steps) { clearInterval(ytTimer); done && done(); } }, 100);
}
function ytLoad() {
  if (!ytId || ytp) return;
  const box = document.createElement("div");
  box.setAttribute("aria-hidden", "true");
  box.style.cssText = "position:fixed;left:-400px;bottom:0;width:200px;height:200px;overflow:hidden;opacity:.01;pointer-events:none;z-index:-1";
  box.innerHTML = '<div id="ytsong"></div>'; document.body.appendChild(box);
  const make = () => {
    ytp = new window.YT.Player("ytsong", {
      host: "https://www.youtube-nocookie.com", videoId: ytId, width: 200, height: 200,
      playerVars: { playsinline: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, iv_load_policy: 3, start: M.musicStart || 0, origin: location.origin },
      events: {
        onReady: () => { ytReady = true; ytLevel(0); if (tapped() && musicOn) musicSet(true, 1.5); },
        onStateChange: (ev) => { if (ev.data === 0) { try { ytp.seekTo(M.musicStart || 0, true); ytp.playVideo(); } catch {} } },
        onError: () => { musicBtn.hidden = true; clearTimeout(ytCheck); },
      },
    });
  };
  if (window.YT && window.YT.Player) return make();
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => { prev && prev(); make(); };
  const sc = document.createElement("script"); sc.src = "https://www.youtube.com/iframe_api"; sc.async = true; sc.onerror = () => { musicBtn.hidden = true; };
  document.head.appendChild(sc);
}
function ytSet(on, fadeS) {
  if (!ytp || !ytReady) return;                                      // not ready yet: onReady plays it if the guest still wants it
  clearTimeout(ytCheck);
  if (on) {
    try { ytp.playVideo(); } catch {}
    ytFade(55, fadeS);
    // a phone may refuse sound that no tap started: if nothing is playing after a moment the button shows "off" and one tap starts it
    ytCheck = setTimeout(() => { let st = -1; try { st = ytp.getPlayerState(); } catch {} if (musicOn && st !== 1 && st !== 3) musicBtn.setAttribute("aria-pressed", "false"); }, 2800);
  } else ytFade(0, .5, () => { if (!musicOn) { try { ytp.pauseVideo(); } catch {} } });
}
if (ytId) setTimeout(ytLoad, 1200);
function musicSet(on, fadeS = 1.2) {
  if (!M.music && !ytId) return;
  musicOn = on; store.set("inv-music", on ? "on" : "off"); musicBtn.setAttribute("aria-pressed", String(on));
  if (ytId) return ytSet(on, fadeS);
  try {
    if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); gain = actx.createGain(); gain.gain.value = 0; actx.createMediaElementSource(bgm).connect(gain).connect(actx.destination); }
    actx.resume(); const t = actx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t);
    if (on) { bgm.play().catch(() => {}); gain.gain.linearRampToValueAtTime(.55, t + fadeS); }
    else { gain.gain.linearRampToValueAtTime(0, t + .5); setTimeout(() => !musicOn && bgm.pause(), 600); }
  } catch { on ? bgm.play().catch(() => {}) : bgm.pause(); }
}
// the button shows what is happening: pressed = playing; a tap on a button that shows "off" always turns the music on
musicBtn.addEventListener("click", () => musicSet(musicBtn.getAttribute("aria-pressed") !== "true", .6));
document.addEventListener("visibilitychange", () => {
  if (ytId) { if (ytp && ytReady) { try { document.hidden ? ytp.pauseVideo() : musicOn && tapped() && ytp.playVideo(); } catch {} } return; }
  if (!actx) return; document.hidden ? bgm.pause() : musicOn && bgm.play().catch(() => {});
});

async function setLang(l) {
  if (l === LANG) return;
  if (!M.languages.includes(l)) return;
  LANG = l; T = M.text(l);
  await Promise.all(loadFonts(l)).catch(() => {});

  renderText();
}
document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

// ---------- input ----------
let tx = 0, ty = 0, tgx = 0, tgy = 0, mx = -99, my = -99, cx = -99, cy = -99;
const cur = $("#cur");
addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const r = stage.getBoundingClientRect();
  tgx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); tgy = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1); mx = e.clientX; my = e.clientY;
  cur.classList.toggle("big", !!e.target.closest?.("a,button,input"));
});
document.querySelectorAll(".mag").forEach((a) => {
  a.addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return;
    const r = a.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
    a.style.transform = `translate(${dx * .15}px, ${dy * .3}px)`; a.firstElementChild.style.transform = `translate(${dx * .07}px, ${dy * .12}px)`; });
  a.addEventListener("pointerleave", () => { a.style.transform = ""; a.firstElementChild.style.transform = ""; });
});
function onTilt(e) { if (e.gamma == null) return; tgx = clamp(e.gamma / 25, -1, 1); tgy = clamp((e.beta - 50) / 25, -1, 1); }
function startGyro() {
  if (RM) return;
  const DO = window.DeviceOrientationEvent;
  if (DO && typeof DO.requestPermission === "function") DO.requestPermission().then((s) => s === "granted" && addEventListener("deviceorientation", onTilt)).catch(() => {});
  else addEventListener("deviceorientation", onTilt);
}

// ---------- the walk ----------
// one room per scroll unit: 0 → .12 through the front frame, .12 → .6 standing in the room (text), .6 → 1 into the far doorway
// one room per scroll unit: 0 → .1 step in, .1 → .68 stand in the room while its card is up, .68 → 1 walk through the far doorway
const SMOKE = false;                              // doorway smoke: switched off at the owner's request (2026-10-08)
const T_IN = .1, T_OUT = .62, SMOKE_OUT = SMOKE ? .2 : .06;   // cards and front layer wait until here
function camAt(i, t) {
  const g = rooms[i].g.position, R = ROOMS[i], centre = (R.hz - .5) * PH;   // eye level is 0; the painting's centre sits below it
  let z, y = 0, ly = centre, lz = PLATE_Z, open = 0, flash = 0;
  if (i === N - 1) z = lerp(ENTER, HOLD0, eio(clamp(t / T_IN)));      // last room: step onto the road and stay while the car drives off
  else if (t < T_IN) z = lerp(ENTER, HOLD0, eio(t / T_IN));
  else if (t < T_OUT) z = lerp(HOLD0, HOLD1, ease((t - T_IN) / (T_OUT - T_IN)));
  else {
    const f = (t - T_OUT) / (1 - T_OUT), k = eio(f), nx = rooms[i + 1], rise = nx.g.position.y - g.y, nc = rise + (ROOMS[i + 1].hz - .5) * PH;
    z = lerp(HOLD1, PLATE_Z - .4, k);
    y = rise * eio(clamp(f / .85));                                    // up (or down) to the next room's eye level, through the doorway
    ly = f < .5 ? lerp(centre, doorY(R), ease(f * 2)) : lerp(doorY(R), nc, ease(f * 2 - 1));   // eyes on the doorway, then on the next room
    lz = f < .5 ? PLATE_Z : lerp(PLATE_Z, PLATE_Z - SL, ease(f * 2 - 1));
    open = 1;
  }
  return { pos: new THREE.Vector3(0, g.y + y, g.z + z), look: new THREE.Vector3(0, g.y + ly, g.z + lz), open, flash };
}

let Ps = 0, prevPs = 0, vel = 0, last = performance.now(), started = false, introT0 = -1, lastCh = 0;
let sheenAt = 0; const doorsEl = $("#doors");
const rail = $("#rail i"), hint = $("#hint"), hudN = $("#hudN"), hudT = $("#hudT"), root = document.documentElement;
const FT = Q.has("debug") && Q.has("ft") ? [] : null, px1 = new Uint8Array(4);   // ?debug=1&ft=1: time each frame's full work (tests/perf.mjs)
// ---------- one swipe, one stop (2026-10-13) ----------
// Owner, 2026-10-13: "in mobile it's like we have more scrolls, and it makes the clients hate the style: make it snapping
// to the details part, along with scroll keep a small button or something to move to next event". Each stop has one
// resting point, the moment its card is fully up. A swipe up or down, however short (a deliberate one: 24 px or more),
// moves exactly one stop; so does one turn of the mouse wheel or trackpad, the arrow and page keys, and the note's button
// ("Next · <the next stop>"). The page then glides there and the camera follows at its own steady pace (frame(): at most
// 1.15 stops a second). The scroll is short and CSS scroll snap holds the same points for a dragged scrollbar. Sheets
// (All events, RSVP) scroll as before. ?nosnap turns all this off (testing).
const SNAP_K = 1, SNAP_HOLD = 0.48, SNAP_ON = !Q.has("nosnap");
const NEXT_WORD = { en: "Next", ta: "அடுத்து", hi: "आगे", ml: "അടുത്തത്", te: "తర్వాత", kn: "ಮುಂದೆ" };
const snapAt = (n) => (n <= 0 ? 0 : n >= N - 1 ? N - 1 + .75 : n + SNAP_HOLD);   // in stops (0 … N − 1 + .75)
function placeSnaps() {
  const sp = $("#spacer"); if (!sp) return;
  sp.querySelectorAll(".snap").forEach((m) => m.remove());
  if (!SNAP_ON) return;
  const len = (N - 1 + .75) * innerHeight * SNAP_K;   // the scroll's length (the spacer is one screen taller than it)
  for (let n = 0; n < N; n++) { const m = document.createElement("i"); m.className = "snap"; m.style.top = (snapAt(n) / (N - 1 + .75) * len - sp.offsetTop) + "px"; sp.appendChild(m); }
}
const snapMax = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
function snapHere() {   // the stop the page is at (or nearest to)
  const x = scrollY / snapMax() * (N - 1 + .75); let best = 0;
  for (let n = 1; n < N; n++) if (Math.abs(snapAt(n) - x) < Math.abs(snapAt(best) - x)) best = n;
  return best;
}
let snapGoal = -1, snapAtMs = 0;
function snapStep(dir) {   // one stop on (dir 1) or back (dir −1)
  if (typeof glideBusy === "function" && glideBusy()) return;   // one stop at a time (2026-10-13): still travelling to the last one: halt there first
  const from = snapGoal >= 0 && performance.now() - snapAtMs < 1400 ? snapGoal : snapHere();
  const n = clamp(from + dir, 0, N - 1); snapGoal = n; snapAtMs = performance.now();
  scrollTo({ top: snapAt(n) / (N - 1 + .75) * snapMax(), behavior: "instant" });   // a slow glide, a small Next (2026-10-13): the camera's glide is the motion
}
const goNext = () => snapStep(1);
$("#hint").addEventListener("click", goNext);
const snapFree = (e) => !SNAP_ON || !started || openSheet || (e && e.target && e.target.closest && e.target.closest(".sheet"));
let snapY0 = null, snapDone = false;   // snapDone: this touch has already moved one stop (answers at once, travels slowly (2026-10-13))
addEventListener("touchstart", (e) => { snapDone = false; snapY0 = snapFree(e) || e.touches.length > 1 ? null : e.touches[0].clientY; }, { passive: true });
addEventListener("touchmove", (e) => {   // the page moves only stop by stop; answers at once, travels slowly (2026-10-13): the stop is taken as soon as the finger has moved 24 px
  if (snapY0 === null) return; if (e.cancelable) e.preventDefault();
  const dy = (e.touches[0]?.clientY ?? snapY0) - snapY0; if (!snapDone && Math.abs(dy) >= 24) { snapDone = true; snapStep(dy < 0 ? 1 : -1); }
}, { passive: false });
addEventListener("touchend", (e) => {
  if (snapY0 === null) return; const dy = (e.changedTouches[0]?.clientY ?? snapY0) - snapY0; snapY0 = null;
  if (!snapDone && Math.abs(dy) >= 24) snapStep(dy < 0 ? 1 : -1); snapDone = false;
}, { passive: true });
let wheelAcc = 0, wheelAt = 0, wheelArmed = true;
addEventListener("wheel", (e) => {
  if (snapFree(e)) return; e.preventDefault();
  const now = performance.now(); if (now - wheelAt > 260) { wheelAcc = 0; wheelArmed = true; } wheelAt = now;   // a pause ends one turn of the wheel
  wheelAcc += e.deltaY; if (wheelArmed && Math.abs(wheelAcc) > 30) { wheelArmed = false; snapStep(wheelAcc > 0 ? 1 : -1); }
}, { passive: false });
addEventListener("keydown", (e) => {
  if (snapFree() || e.target.closest?.("input,textarea")) return;
  const d = { ArrowDown: 1, PageDown: 1, " ": 1, ArrowUp: -1, PageUp: -1 }[e.key]; if (d) { e.preventDefault(); snapStep(d); }
});
let nextFor = -1;
function nextLabel(i) {   // "Next · The Wedding"
  $("#hint")?.classList.toggle("first", i === 0);
  $("#hint")?.classList.toggle("busy", glideBusy());   // one stop at a time (2026-10-13): dimmed while the camera travels   // a slow glide, a small Next (2026-10-13): at the first stop the note says how to move on
  if (nextFor === i + "|" + LANG) return; nextFor = i + "|" + LANG;
  const el = $("#hintN"), n = i + 1; if (!el) return;
  el.textContent = n < N ? (NEXT_WORD[LANG] || NEXT_WORD.en) + " · " + T.titles[ROOMS[n].id] : "";
}
// the note never covers a card (2026-10-13): wherever the note at the foot would overlap the card that is up (a room whose card sits low, or the site
// preview lifting the note above its bar), it steps out of the way until that card goes (checked four times a second)
let clashAt = -1;
function noteClash(now) {
  if (now - clashAt < .25) return; clashAt = now;
  const h = $("#hint"); if (!h) return;
  if (!h.classList.contains("on")) { h.classList.remove("clash"); return; }
  const r = h.getBoundingClientRect(); let hit = false;
  document.querySelectorAll(".ch.on .plaque").forEach((p) => { const q = p.getBoundingClientRect();
    if (q.width && r.top < q.bottom - 2 && r.bottom > q.top + 2 && r.left < q.right && r.right > q.left) hit = true; });
  h.classList.toggle("clash", hit);
}
// ---------- a slow glide, a small Next (2026-10-13) ----------
// Owner: "make the transition from one event to another slower, fluid smoother, don't make the transition snappier, just
// make the scroll snap to the event card". The camera eases out of a stop, travels and eases into the next (a curve that
// starts at the speed it already has and ends at rest, exactly on the card): about 2.2 s for one stop, a little more for a
// longer jump. A swipe mid-way starts a fresh curve from where it is, at the speed it has. Reduced motion: no glide.
const GLIDE = { x: 0, v: 0, from: 0, v0: 0, to: 0, t: 0, d: 0, step: false };   // step: travelling to a stop (one stop at a time (2026-10-13))
const glideBusy = () => GLIDE.step && GLIDE.d > 0 && GLIDE.t < GLIDE.d * .8;   // one stop at a time (2026-10-13): still on the way (until ~97% there)
function glideAim(goal) {
  const g = GLIDE, dist = Math.abs(goal - g.x), dir = Math.sign(goal - g.x);
  let D = dist < 1 ? 1.6 + 3.4 * dist : Math.min(10, 5 + 1.4 * (dist - 1));   // answers at once, travels slowly (2026-10-13): about 5 s a stop (owner: "even slower so that users can see the beauty of the design")
  if (g.v * dir > 0) D = Math.max(.35, Math.min(D, 3 * dist / Math.abs(g.v)));   // already heading there: never overshoot
  // sets off at once at a slow, even pace (from a dead stop nothing showed for about a third of a second), or keeps the speed
  // it already has if that is quicker; turning back starts back at once
  g.from = g.x; g.v0 = dir * Math.max(g.v * dir, 2.2 * dist / D); g.to = goal; g.t = 0; g.d = D;   // answers at once, travels slowly (2026-10-13); one stop at a time (2026-10-13): a clear push at once, then slowing all the way into the card
  g.step = dist > .5;
}
function glide(goal, dt, cap) {   // the camera's place, in stops
  const g = GLIDE;
  if (RM) { g.x = g.to = Math.min(goal, cap); g.v = g.d = 0; return g.x; }
  if (Math.abs(goal - g.to) > 1e-4) glideAim(goal);
  if (g.d > 0) {
    g.t = Math.min(g.d, g.t + dt); const D = g.d, s = g.t / D, s2 = s * s, s3 = s2 * s;
    g.x = (2 * s3 - 3 * s2 + 1) * g.from + (s3 - 2 * s2 + s) * D * g.v0 + (3 * s2 - 2 * s3) * g.to;
    g.v = ((6 * s2 - 6 * s) * g.from + (3 * s2 - 4 * s + 1) * D * g.v0 + (6 * s - 6 * s2) * g.to) / D;
    if (s >= 1) { g.x = g.to; g.v = 0; g.d = 0; }
  } else g.x = g.to;
  if (g.x > cap) { g.x = cap; g.v = 0; glideAim(g.to); }   // a stop still being built: wait at the last one ready, then glide on from rest
  return g.x;
}
function frame(nowMs) {
  const ft0 = FT && performance.now();
  const now = nowMs / 1000, raw = nowMs - last, dt = Math.min(.05, raw / 1000); last = nowMs;
  if (started) govern(raw);
  const max = root.scrollHeight - innerHeight;
  const P = max > 0 ? clamp(scrollY / max) * (N - 1 + .75) : 0;
  prevPs = Ps; Ps = glide(P, dt, Infinity);   // a slow glide, a small Next (2026-10-13): a slow, fluid glide to the card
  vel += ((Math.abs(Ps - prevPs) / Math.max(dt, .001)) - vel) * (1 - Math.exp(-dt * 6));
  const i = Math.min(N - 1, Math.floor(Ps)), t = Ps - i;
  const tl = RM ? 0 : 1 - Math.exp(-dt * 3); tx += (tgx - tx) * tl; ty += (tgy - ty) * tl;
  for (let k = 0; k < N; k++) if (k >= i - 1 && k <= i + 2) ensure(k);
  stepWarm(now, t < T_OUT - .08);   // lag fix (2026-10-11)

  const C = camAt(i, t);
  // smoke: gathers as we walk up to a doorway, thickest as we pass through, then thins away as the next scene arrives
  let smoke = 0;
  if (i < N - 1 && t > T_OUT) smoke = ease(clamp(((t - T_OUT) / (1 - T_OUT) - .3) / .6));
  if (i > 0 && t < SMOKE_OUT) smoke = Math.max(smoke, 1 - ease(clamp(t / SMOKE_OUT)));
  let intro = 1;
  if (introT0 >= 0) { intro = eio(clamp((now - introT0) / 2.6)); if (intro >= 1) introT0 = -1; }
  else if (!started) intro = 0;
  C.pos.z += (1 - intro) * .7; C.look.z += (1 - intro) * .7;        // the opening: a slow step toward the front door
  const sway = RM ? 0 : door.done ? 1 : .18 + .82 * intro;   // a gentle sway at the gate (it stays framed), full once inside
  camera.position.set(C.pos.x + tx * .12 * sway, C.pos.y - ty * .08 * sway + Math.sin(now * .5) * .008, C.pos.z);
  camera.lookAt(C.look.x + tx * .04 * sway, C.look.y - ty * .03 * sway, C.look.z);

  const focus = i + (t > T_OUT && i < N - 1 ? ease((t - T_OUT) / (1 - T_OUT)) : 0);   // the room the eye is focused on
  let fgAny = false;
  rooms.forEach((k) => {
    if (k.state !== "ready") return;
    const own = k.i === i;
    k.plate.material.uniforms.uBlur.value = 0;   // softness comes from the lens (whole layers), never per picture
    // while a room's card is up, its people stand in front of the card (drawn on the layer above the page text)
    const front = own && (i === 0 || t > SMOKE_OUT) && t < T_OUT + .02;   // in front of the card once the smoke has cleared
    // every doorway stays open onto the real next room (one continuous walk); the painted door shows only until that room has loaded
    const next = rooms[k.i + 1];
    k.plate.material.uniforms.uOpen.value = next && next.state === "ready" ? 1 : 0;
    k.plate.material.uniforms.uT.value = now;
    for (const c of k.cast) {
      c.mesh.material.uniforms.uT.value = now;
      if (c.c.faces && !RM) {
        const U = c.mesh.material.uniforms;
        c.c.faces.forEach((f, n) => {
          if (now > f.next + .2) f.next = now + 2.4 + Math.random() * 3.2;             // each person blinks on their own clock
          const b = clamp(1 - Math.abs(now - f.next - .08) / .08);                    // close, hold, open in ~0.16 s
          U.uBlinkW.value.setComponent(n, b);
          U.uNod.value[n] = c.c.nod === false ? 0 : .045 * Math.sin(now * .9 + f.phase) * (.65 + .35 * Math.sin(now * .31 + f.phase * 2));   // a slow sideways tilt (off where a room asks)
        });
      }
      if (c.c.car && own) {                                         // the car drives off toward the horizon
        const d = eio(clamp((t - .15) / .55));
        const z = lerp(c.F.z, c.c.zEnd, d), y = c.F.y;                       // it drives along the road's real floor toward the horizon
        c.mesh.position.set(c.F.x, y + Math.abs(Math.sin(now * 9)) * .004 * (d > 0 && d < 1 ? 1 : 0), z);
        c.sh.position.set(c.F.x, y + .002, z + c.w * .06);
        c.mesh.renderOrder = k.base + 10 + c.mesh.position.z;
      }
      // people fade a little as the camera walks past them into the doorway, so no one is ever cut by the lens
      const dz = camera.position.z - (k.g.position.z + c.mesh.position.z);
      c.mesh.material.uniforms.uO.value = clamp((dz - .35) / .5);
      c.sh.material.opacity = (c.c.shadowO ?? .55) * c.mesh.material.uniforms.uO.value;
      c.mesh.visible = !front; c.fg.visible = front; if (front) { c.fg.position.copy(c.mesh.position); fgAny = true; }
    }
    if (k.frame) {   // the front frame only shows once we are close: from afar it would seem to hang in the air
      const dz = camera.position.z - (k.g.position.z + k.frame.position.z), o = Math.min(clamp((2.7 - dz) / .5), clamp(dz / .25 + .2));
      k.frame.material.uniforms.uO.value = o; k.frame.visible = o > .01;
    }
    for (const x of k.extras) if (x.kind === "glow") x.s.scale.setScalar(x.base * (1 + Math.sin(now * 11) * .06 + Math.sin(now * 17) * .04));
  });
  for (const m of pointMats) m.uniforms.uT.value = now;
  if (falling.length) stepFlowers(dt);
  stepDoor(now);

  post.material.uniforms.uVel.value = RM ? 0 : clamp(vel * .35 + C.flash * .4, 0, .9);
  post.material.uniforms.uFlash.value = Math.max(C.flash, door.done ? 0 : door.flash);
  post.material.uniforms.uSmoke.value = SMOKE ? (RM ? smoke * .6 : smoke) : 0; post.material.uniforms.uDrift.value = Ps;
  post.material.uniforms.uT.value = now;
  // the lens: the event we stand in is sharp; walking through its doorway racks focus to the next; rooms beyond stay soft
  const dC = focus - i, kC = RM ? 0 : smoothstep(.2, .95, dC), kN = RM ? Math.min(1, 1 - dC) : smoothstep(.12, .85, 1 - dC);
  const BL = L.H * L.dpr / 2 * .0055;   // full softness (kept gentle), in half-size pixels
  const pass = (name, show) => {
    rooms.forEach((k) => { k.g.visible = k.state === "ready" && show(k.i); });
    door.g.visible = name === "cur" && door.ready && !door.done;
    renderer.setRenderTarget(layers[name]); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera);
  };
  const hasN = i < N - 1 && rooms[i + 1].state === "ready", hasF = rooms.some((k) => k.i > i + 1 && k.state === "ready");
  // slow phones (level 2): the soft layers behind are redrawn every other frame; a fresh room set is always drawn at once
  const key = i + ":" + hasN + hasF, fresh = key !== softKey, odd = QUAL.level >= 2 && (++tick2 & 1) && !fresh; softKey = key;
  if (hasF && !odd) { pass("far", (n) => n > i + 1); soften("far", BL * 1.1); }
  if (hasN && !(odd && kN > .99)) { pass("next", (n) => n === i + 1); if (kN > .001) soften("next", BL * kN); }
  pass("cur", (n) => n <= i); if (kC > .001) soften("cur", BL * kC);
  rooms.forEach((k) => { k.g.visible = k.state === "ready"; }); door.g.visible = false;
  renderer.setClearColor(0xe9b77a, 1);
  const PU = post.material.uniforms; PU.uKC.value = smoothstep(0, .12, kC); PU.uKN.value = smoothstep(0, .12, kN); PU.uHasN.value = hasN ? 1 : 0; PU.uHasF.value = hasF ? 1 : 0;
  // (the soft picture takes over only while it is still nearly sharp, so there is never a double image or outline)
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  if (fgAny || fgWas) fgRenderer.render(fgScene, camera);
  fgWas = fgAny;

  sections.forEach((_, n) => domFor(n, started && intro > .85 ? Ps - n : -1));
  // the gold foil's slow sheen: only on what is showing (the card on screen, the gate's tag, an open sheet), ~12 times a second.
  // Setting it on the whole page every frame made the browser restyle everything: it halved the frame rate on a slow phone.
  if (now - sheenAt > .08) {
    sheenAt = now; const v = ((now * 9) % 260).toFixed(1) + "%";
    for (const s of sections) if (s.classList.contains("on")) s.style.setProperty("--sheen", v);
    if (!started || !door.done) doorsEl.style.setProperty("--sheen", v);
    if (openSheet) openSheet.style.setProperty("--sheen", v);
  }
  const shown = t > .86 && i < N - 1 ? i + 1 : i;
  if (shown !== lastCh) {
    lastCh = shown; hudN.textContent = String(shown + 1).padStart(2, "0"); hudT.textContent = T.titles[ROOMS[shown].id];
    root.style.setProperty("--hud", ROOMS[shown].hud || "#fff1cc");
    const id = ROOMS[shown].id;   // flowers at the muhurtham, the reception and the send-off
    if (started && id === "wedding") shower(40, "rice"), shower(18, "petal");
    if (started && id === "reception") shower(26, "petal");
    if (started && id === "end") shower(30, "petal");
  }
  rail.style.height = (Ps / (N - 1 + .75)) * 100 + "%";
  hint.classList.toggle("on", started && introT0 < 0 && i < N - 1 && !openSheet); nextLabel(i); noteClash(now);   // one swipe, one stop (2026-10-13): the note is the next button, all the way
  root.classList.toggle("snap", SNAP_ON && started);
  document.body.classList.toggle("at-end", Ps > N - 1 - .05);
  if (mx > -99) { cx += (mx - cx) * .25; cy += (my - cy) * .25; cur.style.transform = `translate(${cx}px, ${cy}px)`; }
  if (FT) { renderer.getContext().readPixels(0, 0, 1, 1, 6408, 5121, px1); FT.push(performance.now() - ft0); if (FT.length > 600) FT.shift(); }   // wait for the GPU, then time
  requestAnimationFrame(frame);
}

// ---------- boot ----------
$("#hudOf").textContent = String(N).padStart(2, "0");
$(".lang").hidden = M.languages.length < 2;   // one language: no switch
renderText();
layout(); addEventListener("resize", () => { layout(); fitTag(); });
history.scrollRestoration = "manual"; scrollTo(0, 0);
const pctEl = $("#pct"); let shownPct = 0, realPct = 0;
const fontLoads = [document.fonts.load('400 40px "Great Vibes"'), document.fonts.load('600 40px "Cormorant Garamond"'), document.fonts.load('italic 600 40px "Cormorant Garamond"')];
fontLoads.push(...loadFonts(LANG));
const total = fontLoads.length + 3; let doneN = 0; const bump = () => { realPct = ++doneN / total; };
let looping = false; const loop = () => { if (!looping) { looping = true; requestAnimationFrame(frame); } };
const doorTry = (n) => buildDoor().then(() => { if (n === 0) bump(); $("#doors").classList.add("has3d"); loop(); },
  (e) => { if (n === 0) bump(); console.error("door", e?.target?.src || e); if (n < 3 && !started) setTimeout(() => doorTry(n + 1), 1500 * (n + 1)); });   // a few retries; the warm ground stands in meanwhile
doorTry(0);
fontLoads.forEach((p) => p.then(bump, bump));
(function count() { shownPct += (realPct - shownPct) * .12; pctEl.textContent = String(Math.round(shownPct * 100)).padStart(3, "0"); if (shownPct < .995) requestAnimationFrame(count); })();
await Promise.allSettled(fontLoads);
renderText();
await Promise.all([ensure(0).then(bump), ensure(1).then(bump)]);
rooms.forEach((_, k) => ensure(k));   // the rest load behind the doors while the guest reads the tag
layout();
renderer.compile(scene, camera);   // lag fix (2026-10-11): every shader made now, not the first time its object comes into view
loop();
realPct = shownPct = 1; pctEl.textContent = "100"; $("#tapl").textContent = T.btn.tap;
$("#doors").classList.add("ready");
$("#doors").addEventListener("click", () => {
  if (started) return; started = true;
  // The faded opening control must not retain keyboard focus or pull the iframe back to its top.
  doorsEl.tabIndex=-1;doorsEl.setAttribute("aria-hidden","true");stage.tabIndex=-1;stage.focus({preventScroll:true});
  startGyro();
  if (musicOn) musicSet(true, 2.5);
  $("#doors").classList.add("open"); door.t0 = performance.now() / 1000;
  document.body.classList.remove("locked"); document.body.classList.add("go");
  introT0 = performance.now() / 1000 + .5;
  shower(24, "petal");
}, { once: true });

if(window.FMI_THUMBNAIL){document.documentElement.classList.add("fmi-thumbnail");document.querySelector("#doors").click();}
