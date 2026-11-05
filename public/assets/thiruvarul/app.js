// Thiruvarul — a walk through a Tamil temple on the wedding morning (built on the Poovanam engine). The guest opens the
// temple's carved teak doors, and scrolling carries the camera along a granite walkway that zigzags between the couple's
// stops: a carved stone gateway, a pillared corridor (their story), the temple tank (engagement), the wedding mandapam,
// the temple chariot (reception) and a deepa stambham (thank you). At the end a real 3D brass kuthuvilakku waits to be lit,
// with the gopuram rising behind it. Every stop holds while its card is up.
// Real 3D: a sky dome, a hazy far line, ground and walkway, palms and peepal trees and brass lamps standing as cut-outs that
// turn to face the guest, and a lens that keeps the stop in focus and lets the rest of the temple grounds go soft.
import * as THREE from "./vendor/three.module.min.js";
// versioned imports: a website may serve these files with a long cache, so bump ?v when one of them changes
import { readInvite, ALL_SCENES } from "./invite.js?v=1";
import { STOPS, DECOR, GAP, GATE_GAP, EYE } from "./world.js?v=t7";
import { CUT_SIZES } from "./img/cut/sizes.js?v=1";   // every cut-out picture's size, so the walk can be laid out before they arrive

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
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // the garden is the same every visit

const Q = new URLSearchParams(window.FMI_SEARCH || "");
// ---------- the couple's invitation: one data source ----------
// the website hands it over as window.TV_INVITE (or its own the source boot data, read by site.js); ?invite=tests/x.json loads a
// test file from this folder; else the sample in data.js
async function inviteData(){if(!window.TV_INVITE)throw Error("Invitation data unavailable");return window.TV_INVITE;}
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
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? "");

// ---------- the stops this couple has (invite.js decides: welcome and thank-you always; the rest follow the content) ----------
// no story → no pillared corridor, no engagement → no temple tank, no reception → no chariot, the lamp can be turned off
const KEYS = ALL_SCENES.filter((k) => M.scenes.includes(k));
document.querySelectorAll(".ch").forEach((s) => { if (!KEYS.includes(s.dataset.key)) s.remove(); });
const sections = KEYS.map((k) => $(`.ch[data-key="${k}"]`));
sections[sections.length - 1].appendChild($(".acts"));   // RSVP and the links wait on the last card of the walk
const N = KEYS.length;
$("#hudTot").textContent = String(N).padStart(2, "0");
const titleOf = (n) => T.titles[KEYS[n]];

// ---------- renderer ----------
const HAZE = new THREE.Color("#f3e6d2");       // the warm golden haze of a temple morning
const stage = $("#stage");
const renderer = new THREE.WebGLRenderer({ canvas: $("#gl"), antialias: false, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setClearColor(HAZE, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, .5, .05, 260);

const imgCache = {};
// a picture that fails to arrive is asked for again (up to 3 tries), and a final failure is not remembered, so a later call retries
const loadOnce = (src) => new Promise((res, rej) => { const im = new Image(); im.decoding = "async"; im.onload = () => res(im); im.onerror = rej; im.src = src; });
const loadImg = (src) => imgCache[src] || (imgCache[src] = (async () => {
  for (let k = 0; ; k++) { try { return await loadOnce(k ? src + (src.includes("?") ? "&" : "?") + "r=" + k : src); } catch (e) { if (k >= 2) { delete imgCache[src]; throw e; } await new Promise((r) => setTimeout(r, 400 * (k + 1))); } }
})());
// the same, with a few more, slower tries (used for the pictures the temple cannot do without)
const loadImgRetry = async (src, n = 3) => { for (let k = 0; ; k++) { try { return await loadImg(src); } catch (e) { if (k >= n) throw e; await new Promise((r) => setTimeout(r, 900 * (k + 1))); } } };
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
function tex(im, o = {}) {
  const t = new THREE.Texture(im); t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  if (typeof ImageBitmap !== "undefined" && im instanceof ImageBitmap) t.flipY = false;   // already flipped when it was decoded
  t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = o.aniso || 4;
  if (o.wrap) t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
  return t;
}

// ---------- the path: a flagstone ribbon that sways gently; the stops stand beside it, left, right, left … ----------
const pathX = (z) => .35 * Math.sin(z * .16) + .2 * Math.sin(z * .053 + 1.3);
const stopZ = (n) => -(GATE_GAP + n * GAP);
const SIDE = (n) => (n % 2 ? 1 : -1);
const END_Z = stopZ(N - 1) - 75;   // the walkway runs on to the gopuram

// ---------- cut-outs: painted things standing in the garden ----------
// A cut-out is drawn twice: once solid (its opaque body writes depth, so the lens knows how far it is) and once as a soft
// fringe (its half-transparent edge, blended), so edges are smooth without any halo. Trees and hanging flowers sway.
const CUT_VERT = `uniform float uT, uWind, uHang, uSeed, uBreath; uniform vec2 uSize; varying vec2 vUv; varying float vDist;
  void main(){ vUv = uv; vec3 p = position;
    float w = uHang > .5 ? pow(1.0 - uv.y, 1.4) : uv.y * uv.y;
    p.x += (sin(uT * .9 + uSeed * 6.3 + uv.y * 1.5) * .7 + sin(uT * 2.1 + uSeed * 3.1 + uv.y * 4.0) * .3) * uWind * w;
    p.z += sin(uT * .7 + uSeed * 4.0) * uWind * .4 * w;
    float b = sin(uT * 1.6 + uSeed * 7.0) * .005 * uBreath; p.y += b * smoothstep(-.1, .5, uv.y) * uSize.y;   // a breath
    vec4 mv = modelViewMatrix * vec4(p, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv; }`;
const CUT_FRAG = `uniform sampler2D map, blinkMap; uniform vec3 uHaze; uniform float uO, uFoot, uFringe, uHazeK, uHasBlink, uLoad; uniform vec2 uBlinkW; uniform vec3 uHead[2];
  varying vec2 vUv; varying float vDist;
  void main(){ vec4 c = texture2D(map, vUv); float a = c.a * uO * uLoad;   // uLoad: 0 until its picture has arrived, then it fades in
    if (uFringe > .5) { if (a >= .5 || a < .03) discard; } else if (a < .5) discard;
    vec3 col = c.rgb;
    if (uHasBlink > .5) {                                                             // eyelids: the closed-eye patch of the nearer face
      vec4 bl = texture2D(blinkMap, vUv);
      float w = abs(vUv.x - uHead[0].x) < abs(vUv.x - uHead[1].x) ? uBlinkW.x : uBlinkW.y;
      col = mix(col, bl.rgb, bl.a * w);
    }
    col *= mix(1.0 - .3 * uFoot, 1.0, smoothstep(.0, .09, vUv.y));                   // a touch of ground shade at the feet
    col = mix(col, uHaze, smoothstep(14.0, 80.0, vDist) * uHazeK);                     // far things fade into the morning haze
    gl_FragColor = vec4(col, uFringe > .5 ? a : 1.0); }`;
const timeU = { value: 0 }, hazeU = { value: HAZE };
const blankTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); blankTex.needsUpdate = true;
const blinkU = { value: blankTex };
const cuts = [];      // every cut-out: { mesh, fringe, group, h, w, face (turns to the camera), person }
// A cut-out can be made before its picture has arrived: `pic` is a shared picture (sharedPic below: one texture per file,
// however many trees use it) or a loaded image. It stays invisible until the picture is there, then fades in.
function cutOut(pic, h, o = {}) {
  const img = pic.size ? null : pic, sz = pic.size || [pic.width, pic.height];
  const w = h * sz[0] / sz[1], t = img ? tex(img) : pic.t;
  const geo = new THREE.PlaneGeometry(w, h, 1, o.hang || o.wind ? 12 : 1); geo.translate(0, h / 2, 0);
  const U = () => ({ map: { value: t }, uT: timeU, uWind: { value: o.wind || 0 }, uHang: { value: o.hang ? 1 : 0 }, uSeed: { value: rnd() },
    uBreath: { value: o.person ? 1 : 0 }, uSize: { value: new THREE.Vector2(w, h) }, uHaze: hazeU, uO: { value: 1 }, uFoot: { value: o.foot ?? 0 },
    uHazeK: { value: o.hazeK ?? .55 }, uFringe: { value: 0 }, blinkMap: { value: blankTex }, uHasBlink: { value: 0 }, uBlinkW: { value: new THREE.Vector2() },
    uHead: { value: [new THREE.Vector3(), new THREE.Vector3()] }, uLoad: { value: img || pic.ready ? 1 : 0 } });
  const u1 = U(), u2 = U(); u2.uFringe.value = 1; for (const k of ["uSeed", "uO", "uHasBlink", "uBlinkW", "uHead", "blinkMap", "uLoad"]) u2[k] = u1[k];
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: CUT_VERT, fragmentShader: CUT_FRAG, uniforms: u1 }));
  const fringe = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: CUT_VERT, fragmentShader: CUT_FRAG, uniforms: u2, transparent: true, depthWrite: false }));
  mesh.frustumCulled = fringe.frustumCulled = false;
  const group = new THREE.Group(); group.add(mesh, fringe);
  const c = { mesh, fringe, group, h, w, face: o.face !== false, person: !!o.person, u: u1, vis: 1 };
  if (!img && !pic.ready) pic.users.push(c);
  cuts.push(c); return c;
}
// One texture per picture file, made before the file arrives (its size comes from img/cut/sizes.js), so the palace can be
// laid out at once and every cut-out using it fades in when it lands. load() starts the download (the queue below).
const pics = {};
function sharedPic(name) {
  if (pics[name]) return pics[name];
  const size = CUT_SIZES[name]; if (!size) return null;
  const p = pics[name] = { name, size, t: new THREE.Texture(), ready: false, users: [], fade: 0, p: null };
  p.t.colorSpace = THREE.NoColorSpace; p.t.minFilter = THREE.LinearMipmapLinearFilter; p.t.anisotropy = 4;
  return p;
}
// the downloads, a few at a time, in the order the guest will need them (the gate's view first, then stop by stop)
const picQueue = [];
let picBusy = 0;
function loadPic(p, first) {
  if (!p || p.p) return p?.p;
  p.p = new Promise((res) => { (first ? picQueue.unshift.bind(picQueue) : picQueue.push.bind(picQueue))({ p, res }); });
  pumpPics(); return p.p;
}
function pumpPics() {
  while (picBusy < 4 && picQueue.length) {
    const { p, res } = picQueue.shift(); picBusy++;
    loadTexRetry(C + p.name + ".webp").then((im) => { p.t.image = im; if (typeof ImageBitmap !== "undefined" && im instanceof ImageBitmap) p.t.flipY = false; p.t.needsUpdate = true; p.ready = true; warm(p.t); }, (e) => console.error("picture", p.name, e?.target?.src || e))
      .finally(() => { picBusy--; res(p); pumpPics(); });
  }
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
// arrived pictures fade in over half a second
function stepPics(dt) {
  for (const k in pics) { const p = pics[k]; if (!p.ready || p.fade >= 1) continue;
    p.fade = Math.min(1, p.fade + dt * 2); for (const c of p.users) c.u.uLoad.value = p.fade; }
}
// where the faces are comes first (a tiny file: the cards fit around the faces with it); the eyelid picture comes once the
// stop's own picture has arrived (`after`), so it never holds up anything the guest sees sooner
async function addBlink(c, name, after) {
  try {
    const getJson = async (u) => { for (let k = 0; ; k++) { try { const r = await fetch(u); if (r.ok) return await r.json(); throw new Error(r.status); } catch (e) { if (k >= 3) throw e; await new Promise((ok) => setTimeout(ok, 900 * (k + 1))); } } };
    const faces = await getJson(C + name + "_faces.json");
    faces.slice(0, 2).forEach((f, k) => c.u.uHead.value[k].set(f.x, f.y, f.r)); c.faceBoxes = faces.slice(0, 2);
    await after;
    const im = await loadTexRetry(C + name + "_blink.webp");
    c.u.blinkMap.value = warm(tex(im)); c.u.uHasBlink.value = 1;
    c.faces = faces.slice(0, 2).map(() => ({ next: performance.now() / 1000 + 1 + Math.random() * 3 }));
  } catch {}   // no blink pictures: the couple simply don't blink
}
// a soft round shadow on the ground under anything that stands
const shadowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, "rgba(40,22,52,.55)"); g.addColorStop(.55, "rgba(40,22,52,.22)"); g.addColorStop(1, "rgba(40,22,52,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t; })();
function shadow(w, d, o = .6) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: o }));
  m.rotation.x = -Math.PI / 2; m.position.y = .012; m.renderOrder = 2; return m;
}

// ---------- the ground: lawn everywhere, the flagstone path along the walk ----------
const GROUND_VERT = `varying vec2 vW; varying float vDist; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xz; vec4 mv = viewMatrix * w; vDist = -mv.z; gl_Position = projectionMatrix * mv; }`;
const lawnMat = new THREE.ShaderMaterial({ vertexShader: GROUND_VERT, uniforms: { map: { value: null }, uHaze: hazeU },
  fragmentShader: `uniform sampler2D map; uniform vec3 uHaze; varying vec2 vW; varying float vDist;
    void main(){ vec3 c = texture2D(map, vW / 3.2).rgb; float l = dot(c, vec3(.3, .59, .11));
      c = mix(c, vec3(l), .18) * vec3(.97, .99, .95);                                    // a softer, spring green
      gl_FragColor = vec4(mix(c, uHaze, smoothstep(8.0, 95.0, vDist) * .82), 1.0); }` });
const lawn = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), lawnMat); lawn.rotation.x = -Math.PI / 2; lawn.frustumCulled = false; scene.add(lawn);
const PATH_W = 1.7;
const pathMat = new THREE.ShaderMaterial({ vertexShader: `varying vec2 vUv; varying float vDist; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv; }`,
  uniforms: { map: { value: null }, uHaze: hazeU }, transparent: true, depthWrite: false,
  fragmentShader: `uniform sampler2D map; uniform vec3 uHaze; varying vec2 vUv; varying float vDist;
    float h(float n){ return fract(sin(n * 91.7) * 43758.5); }
    void main(){ vec3 c = texture2D(map, vUv).rgb;
      float e = abs(vUv.x - .5) * 2.0, wob = .06 * sin(vUv.y * 9.0) + .05 * sin(vUv.y * 23.0 + 2.0);   // an uneven, grassy edge
      float a = 1.0 - smoothstep(.78 + wob, .98 + wob, e);
      gl_FragColor = vec4(mix(c, uHaze, smoothstep(8.0, 95.0, vDist) * .82), a); }` });
{
  const z0 = 9, len = z0 - END_Z, segs = Math.ceil(len / .5), geo = new THREE.PlaneGeometry(PATH_W, len, 1, segs);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let n = 0; n < p.count; n++) { const z = z0 - (p.getY(n) + len / 2); p.setXYZ(n, p.getX(n) + pathX(z), .01, z); uv.setY(n, (z0 - z) / PATH_W); }
  geo.computeVertexNormals();
  const path = new THREE.Mesh(geo, pathMat); path.frustumCulled = false; path.renderOrder = 1; scene.add(path);
}

// ---------- the sky and the far garden: they travel with the guest, as far things do ----------
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { map: { value: null }, uT: timeU },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D map; uniform float uT; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, vec2(vUv.x * 4.0 + uT * .0015, vUv.y)).rgb, 1.0); }` });
const sky = new THREE.Mesh(new THREE.CylinderGeometry(170, 170, 150, 48, 1, true), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
const farMat = new THREE.ShaderMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, uniforms: { map: { value: null }, uHaze: hazeU },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D map; uniform vec3 uHaze; varying vec2 vUv;
    void main(){ vec4 c = texture2D(map, vec2(vUv.x * 5.0, vUv.y)); gl_FragColor = vec4(mix(c.rgb, uHaze, .38), c.a); }` });
const far = new THREE.Mesh(new THREE.CylinderGeometry(120, 120, 36, 48, 1, true), farMat); far.frustumCulled = false; far.renderOrder = -9; far.visible = false; scene.add(far);   // shown once its picture is in (envLate)

let petals = null;
// ---------- drifting flower petals in the air around the guest (real 3D: near ones pass close and go soft) ----------
const petalMat = new THREE.ShaderMaterial({ uniforms: { uT: timeU, uCam: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(9, 5, 14) }, uPx: { value: 30 } },
  vertexShader: `attribute vec4 seed; uniform float uT, uPx; uniform vec3 uCam, uBox; varying float vA; varying vec3 vCol;
    void main(){
      vec3 q = seed.xyz * uBox;
      q.y -= uT * (.18 + seed.w * .22); q.x += uT * .12 + sin(uT * .7 + seed.w * 20.0) * .5; q.z += cos(uT * .5 + seed.w * 13.0) * .35;
      vec3 c = uCam + vec3(0.0, 0.0, -uBox.z * .35);
      vec3 rel = mod(q - c + uBox * .5, uBox) - uBox * .5;           // the petals wrap around the guest as they walk
      vec3 p = vec3(c.x + rel.x, mod(q.y, uBox.y) + .05, c.z + rel.z);
      vA = uT * (1.0 + seed.w * 2.0) + seed.w * 40.0;
      vCol = (seed.w < .4 ? vec3(1.0, .62, .12) : seed.w < .7 ? vec3(.86, .2, .3) : vec3(1.0, .97, .9)) * (.9 + seed.y * .15);   // marigold, rose, jasmine
      vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = uPx * (.6 + seed.x * .6) / -mv.z; gl_Position = projectionMatrix * mv;
      if (-mv.z < 1.6) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }`,   // none drift right past the lens (they would cover a face)
  fragmentShader: `varying float vA; varying vec3 vCol;
    void main(){ vec2 d = gl_PointCoord - .5; float s = sin(vA), c = cos(vA); d = mat2(c, -s, s, c) * d;
      d.y *= 1.0 + .8 * abs(sin(vA * 1.7));                             // the petal tumbles: its oval widens and narrows
      if (length(d * vec2(1.0, 1.9)) > .32) discard;
      gl_FragColor = vec4(vCol * (.85 + .3 * (.5 - d.y)), 1.0); }` });
{
  const n = PHONE ? 140 : 220, geo = new THREE.BufferGeometry(), s = new Float32Array(n * 4);
  for (let k = 0; k < n * 4; k++) s[k] = rnd();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); geo.setAttribute("seed", new THREE.BufferAttribute(s, 4));
  const pts = new THREE.Points(geo, petalMat); pts.frustumCulled = false; pts.userData.n = n; scene.add(pts); petals = pts;
}
// a fountain's sparkle: droplets in the light, rising and falling
function sparkle(at, w, h) {
  const n = 70, geo = new THREE.BufferGeometry(), s = new Float32Array(n * 4);
  for (let k = 0; k < n * 4; k++) s[k] = rnd();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); geo.setAttribute("seed", new THREE.BufferAttribute(s, 4));
  const m = new THREE.Points(geo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: timeU, uPx: { value: 22 }, uW: { value: w }, uH: { value: h } },
    vertexShader: `attribute vec4 seed; uniform float uT, uPx, uW, uH; varying float vA;
      void main(){ float life = fract(uT * (.35 + seed.w * .3) + seed.z * 7.0);
        vec3 p = vec3((seed.x - .5) * uW, uH * (.35 + .65 * seed.y) + sin(life * 3.14159) * .18, (seed.z - .5) * .3);
        vA = sin(life * 3.14159) * (.4 + .6 * step(.6, fract(seed.x * 13.0 + uT * 2.0)));
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = uPx * (.5 + seed.w) / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1.0, .97, .92) * (1.0 - smoothstep(0.0, .5, d)) * vA, 0.0); }` }));
  m.position.copy(at); m.frustumCulled = false; scene.add(m);
}

// butterflies: a few flutter beside each stop and over the path, wings beating (the picture squeezed across its body).
// They keep to the outer side of a stop and low, so they never pass in front of a face.
const flutter = []; let flyPic = null;   // the butterflies' picture (they show once it has arrived)
function butterflies(t, around, n, o = {}) {
  for (let k = 0; k < n; k++) {
    const s = .14 + rnd() * .07, m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: t, alphaTest: .45, side: THREE.DoubleSide }));
    m.frustumCulled = false; scene.add(m);
    flutter.push({ m, size: s, fade: 1, at: around.clone(), r: (o.r || .5) + rnd() * (o.r || .5), h: (o.h || .7) + rnd() * (o.hr || .5), sp: .3 + rnd() * .35, ph: rnd() * 6.28, fl: 10 + rnd() * 5, dir: rnd() < .5 ? -1 : 1 });
  }
}
// A butterfly that would pass in front of a face (on screen, nearer than the face) dissolves away and comes back once it is
// clear: nothing ever covers a face (same guard as templates/poovanam, 2026-10-09).
const BV = new THREE.Vector3();
function stepButterflies(now, dt = 1 / 60) {
  const faces = facesOnScreen(), k = 1 - Math.exp(-dt * 12), fpx = L.H / (2 * Math.tan(camera.fov * Math.PI / 360));
  for (const b of flutter) {
    const a = now * b.sp * b.dir + b.ph;
    b.m.position.set(b.at.x + Math.cos(a) * b.r + Math.sin(a * 2.3) * .2, b.h + Math.sin(a * 1.7) * .25 + Math.abs(Math.sin(now * b.fl * .5)) * .03, b.at.z + Math.sin(a) * b.r * .7);
    b.m.quaternion.copy(camera.quaternion); b.m.rotateZ(Math.sin(a) * .5 * b.dir);
    b.m.scale.set(RM ? 1 : .18 + .82 * Math.abs(Math.cos(now * b.fl + b.ph)), 1, 1);   // the wings beat
    let near = false;
    if (faces.length) {
      const d = b.m.position.distanceTo(camera.position); BV.copy(b.m.position).project(camera);
      const sx = (BV.x * .5 + .5) * L.W, sy = (-BV.y * .5 + .5) * L.H, br = b.size * fpx / Math.max(d, .1) * .7;
      near = BV.z < 1 && faces.some((f) => d < f.d && Math.hypot(sx - f.x, sy - f.y) < f.r * 1.8 + br);
    }
    b.fade += ((near ? 0 : 1) - b.fade) * k;
    b.m.material.opacity = b.fade; b.m.visible = b.fade > .02 && (!flyPic || flyPic.ready);   // with the alpha cut-off, a lower opacity dissolves it from the edges in
  }
}
// where the couple's faces are on screen this frame (from the blink face boxes; faces.json y is measured from the bottom)
let facesAt = -1, facesOut = [], frameNo = 0;
const FV = new THREE.Vector3(), FT2 = new THREE.Vector3();
function facesOnScreen() {
  if (facesAt === frameNo) return facesOut;
  facesAt = frameNo; const out = facesOut = []; camera.updateMatrixWorld();
  for (const b of stopsBuilt) for (const c of [b.cut, b.swingCut]) {
    if (!c || !c.faceBoxes || !c.group.visible || c.u.uO.value < .5) continue;
    c.mesh.updateWorldMatrix(true, false);
    for (const f of c.faceBoxes) {
      FV.set((f.x - .5) * c.w, f.y * c.h, 0); c.mesh.localToWorld(FV); FV.project(camera);
      FT2.set((f.x - .5) * c.w, (f.y + f.r) * c.h, 0); c.mesh.localToWorld(FT2); FT2.project(camera);
      const sx = (FV.x * .5 + .5) * L.W, sy = (-FV.y * .5 + .5) * L.H, r = Math.abs((-FT2.y * .5 + .5) * L.H - sy);
      if (FV.z < 1 && sx > -r && sx < L.W + r && sy > -r && sy < L.H + r) out.push({ stop: b.key, x: sx, y: sy, r, d: camera.position.distanceTo(c.group.getWorldPosition(BV)) });
    }
  }
  return out;
}
// butterflies over a face right now (should always be 0; ?debug=1 → __fly())
function flyOverFaces() {
  const faces = facesOnScreen(), fpx = L.H / (2 * Math.tan(camera.fov * Math.PI / 360)); let n = 0;
  for (const b of flutter) {
    if (!b.m.visible || b.fade < .5) continue;
    const d = b.m.position.distanceTo(camera.position); BV.copy(b.m.position).project(camera);
    const sx = (BV.x * .5 + .5) * L.W, sy = (-BV.y * .5 + .5) * L.H, br = b.size * fpx / Math.max(d, .1) * .5;
    if (BV.z < 1 && faces.some((f) => d < f.d && Math.hypot(sx - f.x, sy - f.y) < f.r + br)) n++;
  }
  return n;
}

// ---------- the blessing lamp: a real 3D brass kuthuvilakku on a granite plinth, five wicks waiting to be lit ----------
const lampObj = { g: null, flames: [], halo: null, light: null, glitter: null, rising: [], top: new THREE.Vector3() };
function flameTexture() {   // a soft teardrop flame: white core, golden body, orange edge
  const c = document.createElement("canvas"); c.width = 64; c.height = 128; const x = c.getContext("2d");
  x.translate(32, 92); x.scale(1, 2.1);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, "rgba(255,255,240,1)"); g.addColorStop(.25, "rgba(255,236,150,.95)");
  g.addColorStop(.55, "rgba(255,160,40,.6)"); g.addColorStop(1, "rgba(255,90,0,0)");
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, 30, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}
function buildLamp(at, H, potsI) {
  // the lamp's profile (radius, height), turned like a real one: a wide foot, knotted stem, the oil bowl, a finial on top
  const P = [[0, 0], [.24, 0], [.255, .014], [.25, .04], [.2, .058], [.14, .08], [.095, .11], [.06, .13], [.04, .16], [.032, .2], [.05, .225], [.055, .24],
    [.04, .255], [.028, .3], [.026, .42], [.045, .44], [.05, .455], [.03, .475], [.024, .6], [.05, .625], [.055, .64], [.035, .66], [.03, .69], [.06, .71],
    [.13, .73], [.21, .76], [.235, .78], [.22, .795], [.18, .79], [.06, .778], [.022, .78], [.02, .84], [.045, .86], [.05, .875], [.03, .89], [.035, .92],
    [.022, .95], [.01, .985], [0, 1]];
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ map: skyMat.uniforms.map.value, side: THREE.BackSide })));
  for (const [x, y, z, w, h, c] of [[-3.5, 4.5, 6, 3.2, 2.2, "#fff8ec"], [4.5, 3, 5, 1.4, 4.5, "#ffffff"], [0, -5, 3, 9, 2, "#8a6a48"], [-6, 1, -3, 3, 5, "#ffe9c4"]]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); pl.position.set(x, y, z); pl.lookAt(0, 0, 0); envScene.add(pl);
  }
  const pm = new THREE.PMREMGenerator(renderer), env = pm.fromScene(envScene, .02).texture; pm.dispose();
  const brass = new THREE.MeshPhysicalMaterial({ color: "#e2ac44", metalness: 1, roughness: .24, clearcoat: .4, clearcoatRoughness: .12, envMap: env, envMapIntensity: .9 });
  const S = H.size, base = H.plinth;
  const g = new THREE.Group(); g.position.set(at.x, 0, at.z); scene.add(g);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(.72, base, .72), new THREE.MeshBasicMaterial({ map: pathMat.uniforms.map.value, color: "#fff4e4" }));   // carved from the walkway's granite
  plinth.position.y = base / 2; g.add(plinth);
  const lamp = new THREE.Group(); lamp.position.y = base; lamp.scale.setScalar(S); g.add(lamp);
  lamp.add(new THREE.Mesh(new THREE.LatheGeometry(P.map(([r, y]) => new THREE.Vector2(r, y)), 72), brass));
  const ft = flameTexture(), flames = [];
  for (let k = 0; k < 5; k++) {                       // five spouts round the bowl, a wick and a flame at each tip
    const a = k / 5 * Math.PI * 2 + Math.PI / 2, dir = new THREE.Vector3(Math.cos(a), .32, Math.sin(a)).normalize();
    const sp = new THREE.Mesh(new THREE.ConeGeometry(.036, .14, 18), brass);
    sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); sp.position.set(Math.cos(a) * .27, .8, Math.sin(a) * .27); lamp.add(sp);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    f.position.set(Math.cos(a) * .33, .88, Math.sin(a) * .33); f.scale.set(.06, .12, 1); f.userData = { v: 0, ph: rnd() * 6.3 }; lamp.add(f); flames.push(f);
  }
  scene.add(new THREE.HemisphereLight("#fff6e8", "#a08a70", 1.1));
  const sun = new THREE.DirectionalLight("#fff1dc", 1.8); sun.position.set(-4, 7, 6); scene.add(sun);
  const sun2 = new THREE.DirectionalLight("#ffffff", .8); sun2.position.set(5, 2.5, 6); scene.add(sun2);
  const light = new THREE.PointLight("#ffb347", 0, 2.4); light.position.set(at.x, base + .95 * S, at.z + .3); scene.add(light);   // the lamp's own glow once lit
  const hc = document.createElement("canvas"); hc.width = hc.height = 128; const x = hc.getContext("2d");
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,230,170,.9)"); gr.addColorStop(.4, "rgba(255,180,90,.3)"); gr.addColorStop(1, "rgba(255,150,60,0)");
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128); const ht = new THREE.CanvasTexture(hc); ht.colorSpace = THREE.NoColorSpace;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: ht, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  halo.scale.setScalar(1.3); halo.position.set(at.x, base + .85 * S, at.z - .2); scene.add(halo);
  if (potsI) for (const [dx, dz, h] of [[-.62, .15, .5], [.62, .1, .48]]) {
    const c = cutOut(potsI, h, { wind: 0, foot: .4 }); c.group.position.set(at.x + dx, 0, at.z + dz); scene.add(c.group);
  }
  const sh = shadow(.9, .9, .35); sh.position.set(at.x, .012, at.z); scene.add(sh);
  // golden sparks circling the flames once they burn
  const gn = 80, gg = new THREE.BufferGeometry(), gs = new Float32Array(gn * 4);
  for (let k = 0; k < gn * 4; k++) gs[k] = rnd();
  gg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(gn * 3), 3)); gg.setAttribute("seed", new THREE.BufferAttribute(gs, 4));
  const glitter = new THREE.Points(gg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: timeU, uR: { value: .42 }, uPx: { value: 22 }, uC: { value: 0 } },
    vertexShader: `attribute vec4 seed; uniform float uT, uR, uPx, uC; varying float vA;
      void main(){ float sp = (.25 + seed.x * .5) * (1.0 + uC * 2.0), a = uT * sp + seed.y * 6.283, r = uR * (.6 + seed.z * .7);
        vec3 p = vec3(cos(a) * r, (seed.w - .3) * .5 + sin(a * .7) * .08, sin(a) * r * .6);
        vA = pow(max(0.0, sin(uT * (3.0 + seed.w * 4.0) + seed.x * 30.0)), 3.0) * uC;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = uPx * (.4 + seed.w * .8) / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main(){ vec2 d = gl_PointCoord - .5; float star = max(0.0, 1.0 - length(d) * 2.4) + max(0.0, .9 - abs(d.x) * 14.0) * max(0.0, 1.0 - abs(d.y) * 2.2) + max(0.0, .9 - abs(d.y) * 14.0) * max(0.0, 1.0 - abs(d.x) * 2.2);
        gl_FragColor = vec4(vec3(1.0, .82, .45) * star * vA, 0.0); }` }));
  glitter.position.set(at.x, base + .86 * S, at.z); glitter.frustumCulled = false; scene.add(glitter);
  // little embers rising from the flames
  const ec = document.createElement("canvas"); ec.width = ec.height = 32; const ex = ec.getContext("2d");
  const eg = ex.createRadialGradient(16, 16, 0, 16, 16, 16); eg.addColorStop(0, "rgba(255,240,190,1)"); eg.addColorStop(1, "rgba(255,150,40,0)"); ex.fillStyle = eg; ex.fillRect(0, 0, 32, 32);
  const et = new THREE.CanvasTexture(ec); et.colorSpace = THREE.NoColorSpace;
  const rising = [];
  for (let k = 0; k < 14; k++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: et, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    sp.userData = { ph: k / 14, x: (rnd() - .5) * .45, z: (rnd() - .5) * .25, s: .015 + rnd() * .02, w: rnd() * 6 }; scene.add(sp); rising.push(sp);
  }
  lampObj.top.set(at.x, base + .8 * S, at.z);
  Object.assign(lampObj, { g, flames, halo, light, glitter, rising, lamp });
}
// a temple bell, made on the spot: a few ringing partials that fade (a real bell's overtones are not whole-number multiples)
let bellCtx = null;
function bell(f0 = 560, vol = .22) {
  if (RM) return;
  try {
    bellCtx = bellCtx || new (window.AudioContext || window.webkitAudioContext)(); bellCtx.resume();
    const t = bellCtx.currentTime, out = bellCtx.createGain(); out.gain.value = vol; out.connect(bellCtx.destination);
    for (const [m, a, d] of [[1, 1, 2.8], [2.76, .5, 1.8], [5.4, .25, 1.1], [8.93, .12, .7]]) {
      const o = bellCtx.createOscillator(), g = bellCtx.createGain(); o.frequency.value = f0 * m; o.type = "sine";
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(out); o.start(t); o.stop(t + d + .05);
    }
  } catch {}
}

// the sky, the far trees, the lawn and the path load together with the gate (nothing is drawn until they have arrived,
// so the garden never shows black while it loads)
let envP = null;   // a failed load is forgotten, so the next ask tries again
const envReady = () => envP || (envP = Promise.all(["t_ground", "t_path", "t_sky"].map((n) => loadImgRetry(`img/env/${n}.webp`))).then(([lawnI, pathI, skyI]) => {
  lawnMat.uniforms.map.value = tex(lawnI, { wrap: true, aniso: 8 }); pathMat.uniforms.map.value = tex(pathI, { wrap: true, aniso: 8 });
  skyMat.uniforms.map.value = tex(skyI, { wrap: true });
}, (e) => { envP = null; throw e; }));
// the far line (behind the gate's wall until the doors open) loads once the gate is drawn; until then it is not drawn
let envLateP = null;
const envLate = () => envLateP || (envLateP = loadImgRetry(`img/env/t_far.webp`).then((farI) => { farMat.uniforms.map.value = tex(farI, { wrap: true }); far.visible = true; },
  (e) => { envLateP = null; console.error("far line", e?.target?.src || e); }));

// ---------- building the garden ----------
const C = "img/cut/";
const stopsBuilt = [];   // per stop: where it stands, where the camera holds, what it looks at
async function buildGarden() {
  const names = new Set([...DECOR.trees, DECOR.bush, DECOR.arch, DECOR.gopuram.cut, ...KEYS.map((k) => STOPS[k].cut).filter(Boolean), ...KEYS.filter((k) => STOPS[k].swing).map((k) => STOPS[k].swing.cut)]);
  // laid out at once from the pictures' sizes (img/cut/sizes.js); the pictures arrive in the order the guest needs them:
  // the gate view's first (the first stop, the trees, the bushes: "tap to open" waits for these), then the rest stop by stop
  const imgs = {}; for (const n of names) imgs[n] = sharedPic(n);
  const firstNames = [STOPS[KEYS[0]].cut, ...[].concat(DECOR.trees || []), ...[].concat(DECOR.bush || [])].filter((n) => imgs[n]);
  const firstP = Promise.all([...new Set(firstNames)].map((n) => loadPic(imgs[n])));
  for (const n of names) if (imgs[n]) loadPic(imgs[n]);
  await envReady();
  const flyP = sharedPic("t_butterfly"), flyT = flyP && flyP.t; flyPic = flyP; if (flyP) loadPic(flyP);


  // the stops
  KEYS.forEach((k, n) => {
    const S = STOPS[k], z = stopZ(n), s = SIDE(n), px = pathX(z);
    const at = new THREE.Vector3(px + s * S.x, 0, z + (S.dz || 0));   // dz: stand between two arches, never inside one's plane
    const img = imgs[S.cut];
    const b = { key: k, at, s, S, cut: null };
    if (S.lamp) buildLamp(at, S.lamp, imgs[DECOR.bush]);
    if (img) {
      const c = cutOut(img, S.h, { person: true, foot: .5, hazeK: .3 }); c.group.position.copy(at); scene.add(c.group); b.cut = c;
      if (!S.swing) addBlink(c, S.cut, loadPic(img));
      const sh = shadow(c.w * .95, .9, .55); sh.position.x = at.x; sh.position.z = at.z + .05; scene.add(sh); b.shadows = [sh];
      if (S.swing && imgs[S.swing.cut]) {      // the swing hangs from the pergola's beam and sways
        const sw = cutOut(imgs[S.swing.cut], S.swing.h, { person: true, face: false, hazeK: .3 });
        const pivot = new THREE.Group(); pivot.position.y = S.h * (S.swing.beam ?? .86);
        sw.group.position.set(0, -S.swing.h, -.07); pivot.add(sw.group);   // a hair behind the posts: never fights them for depth
        c.group.add(pivot); b.swing = pivot; b.swingCut = sw; addBlink(sw, S.swing.cut, loadPic(imgs[S.swing.cut]));
        const ss = shadow(sw.w * .8, .6, .4); ss.position.set(at.x, .013, at.z + .1); scene.add(ss); b.shadows.push(ss);
      }
      if (S.sparkle) sparkle(new THREE.Vector3(at.x, 0, at.z + .2), c.w * .5, S.h * .9);
      if (flyT) butterflies(flyT, new THREE.Vector3(at.x + s * (c.w / 2 + .9), 0, at.z - .8), 2, { r: .35, h: .3, hr: .45 });   // low, round the flowers: never at face height
    }
    // the camera holds on the far side of the path, a little back, looking across at the stop: that is the zigzag
    const cz = z + S.cam.back, cpx = pathX(cz);
    b.view = new THREE.Vector3(cpx - s * S.cam.across, EYE, cz);
    b.viewEnd = b.view.clone().lerp(new THREE.Vector3(at.x, EYE, at.z), .13);       // a slow step closer while the card is up
    b.look = new THREE.Vector3(at.x - s * .1, S.cam.look, at.z);
    if (S.lamp) b.look.set(at.x, S.cam.look, at.z);
    if (S.tunnel) {                                                                  // a tunnel of wisteria arches over the path
      const ai = imgs[DECOR.arch];
      if (ai) for (let a = 0; a < DECOR.archCount; a++) {
        const az = z + ((DECOR.archCount - 1) / 2 - a) * DECOR.archSpacing;
        const c = cutOut(ai, DECOR.archH, { face: false, wind: .025, hazeK: .4 }); c.group.position.set(pathX(az), 0, az); scene.add(c.group);
      }
      b.look.set(px + s * S.x * .6, S.cam.look, z);
    }
    stopsBuilt.push(b);
  });
  if (flyT) for (let n = 0; n < N; n++) butterflies(flyT, new THREE.Vector3(pathX(stopZ(n) + GAP / 2), 0, stopZ(n) + GAP / 2), 1, { r: 1.1, h: .35, hr: .5 });
  // between stops the camera swings across the path (through a point on the path between them)
  stopsBuilt.forEach((b, n) => { const nx = stopsBuilt[n + 1]; if (!nx) return;
    const mz = (b.viewEnd.z + nx.view.z) / 2; b.mid = new THREE.Vector3(pathX(mz), EYE + .1, mz); });

  // the temple gopuram at the far end of the walkway: the destination, seen from the doors and growing as the guest walks
  const gI = imgs[DECOR.gopuram.cut], gz = stopZ(N - 1) - DECOR.gopuram.beyond;
  if (gI) { const c = cutOut(gI, DECOR.gopuram.h, { hazeK: .35, foot: .3 }); c.group.position.set(pathX(gz), 0, gz); scene.add(c.group);
    const sh = shadow(c.w * .9, 3, .35); sh.position.set(pathX(gz), .011, gz + .5); scene.add(sh); }
  const nearGopuram = (x, z) => gI && Math.abs(z - gz) < 6 && Math.abs(x - pathX(gz)) < DECOR.gopuram.h * .4;
  // the garden around: wisteria trees in two bands each side, bushes along the path's edges
  const nearStop = (x, z, r) => stopsBuilt.some((b) => Math.abs(b.at.z - z) < r && Math.sign(x - pathX(z)) === b.s && Math.abs(x - b.at.x) < r + 1);
  const inTunnel = (z) => stopsBuilt.some((b) => b.S.tunnel && Math.abs(b.at.z - z) < DECOR.archCount * DECOR.archSpacing / 2 + 1);
  for (let z = 6; z > END_Z + 6; z -= DECOR.treeStep) for (const side of [-1, 1]) {
    for (const band of [0, 1]) {
      if (band && rnd() < .35) continue;
      const x = pathX(z) + side * (band ? 12 + rnd() * 18 : DECOR.treeX[0] + rnd() * (DECOR.treeX[1] - DECOR.treeX[0]));
      const zz = z - rnd() * DECOR.treeStep;
      if ((!band && nearStop(x, zz, 3)) || nearGopuram(x, zz)) continue;
      const ti = imgs[DECOR.trees[Math.floor(rnd() * DECOR.trees.length)]]; if (!ti) continue;
      const h = (band ? 1.25 : 1) * lerp(DECOR.treeH[0], DECOR.treeH[1], rnd());
      const c = cutOut(ti, h, { wind: .05 * h / 5, hazeK: .65 }); c.group.position.set(x, 0, zz); scene.add(c.group);
      if (!band) { const sh = shadow(c.w * .9, 1.4, .35); sh.position.set(x, .011, zz + .1); scene.add(sh); }
    }
  }
  const bi = imgs[DECOR.bush];
  if (bi) for (let z = 4; z > END_Z + 10; z -= DECOR.bushStep) for (const side of [-1, 1]) {
    if (rnd() < .3) continue;
    const zz = z - rnd() * DECOR.bushStep, x = pathX(zz) + side * lerp(DECOR.bushX[0], DECOR.bushX[1], rnd());
    if (nearStop(x, zz, 2.6) || inTunnel(zz) || zz > -1.2) continue;
    const c = cutOut(bi, lerp(DECOR.bushH[0], DECOR.bushH[1], rnd()), { wind: .012, foot: .4 }); c.group.position.set(x, 0, zz); scene.add(c.group);
  }
  return firstP;
}

// ---------- the opener: the temple's carved doors under the gopuram, in real 3D ----------
// an ivy-and-wisteria garden wall with stone pillars (a see-through opening between them), the pillars' inner faces and a
// threshold, and two white wrought-iron gate leaves on hinges: the garden shows between the ironwork. On tap the leaves
// swing inward, the iron catches the light as it turns, and the camera walks through into the garden.
const door = { g: new THREE.Group(), ready: false, t0: -1, done: false, L: null, R: null, flash: 0 };
door.g.visible = false; scene.add(door.g);
const DOOR_D = 10.5;   // the guest starts this far in front of the gate (the whole gate and its pillars in view)
const DOOR_VERT = `varying vec2 vUv; varying vec3 vN, vF, vW; void main(){ vUv = uv; vF = normal; vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const DOOR_FRAG = `uniform sampler2D map; uniform float uMetal, uCut, uExt; uniform vec3 uEdge; varying vec2 vUv; varying vec3 vN, vF, vW;
  float pp(float t, float w){ return w * (1.0 - abs(fract(t / (2.0 * w)) * 2.0 - 1.0)); }   // ping-pong inside an edge band
  void main(){
    vec2 st = vUv;
    if (uExt > .5) {   // the wall runs on past the picture: its outer bands mirrored, never the gate opening
      if (st.x < 0.0) st.x = pp(-st.x, .12); else if (st.x > 1.0) st.x = 1.0 - pp(st.x - 1.0, .12);
      if (vUv.y > 1.0) discard;                                    // above the wall: the garden's own sky
      if (st.y < 0.0) st.y = pp(-st.y, .08);
    }
    vec4 c = texture2D(map, st);
    vec3 col = c.rgb;
    if (uMetal > .5) {
      if (abs(vF.z) < .5) { col = uEdge; c.a = 1.0; }          // the leaf's edge
      else if (vF.z < 0.0) col *= .8;                          // its back
      if (c.a < uCut) discard;
      vec3 n = normalize(vN), V = normalize(cameraPosition - vW), L = normalize(vec3(-.35, .55, 1.0));
      if (dot(n, V) < 0.0) n = -n;
      float d = clamp(dot(n, L), 0.0, 1.0), sp = pow(clamp(dot(reflect(-L, n), V), 0.0, 1.0), 16.0);
      col = col * (.72 + .38 * d) + vec3(1.0, .9, .7) * sp * .18;   // polished teak and brass: darker as it turns, a soft glint
    } else if (c.a < uCut) discard;
    gl_FragColor = vec4(col, 1.0); }`;
function doorMat(img, o = {}) {
  return new THREE.ShaderMaterial({ vertexShader: DOOR_VERT, fragmentShader: DOOR_FRAG,
    uniforms: { map: { value: tex(img) }, uMetal: { value: o.metal ? 1 : 0 }, uCut: { value: o.cut ?? .5 }, uExt: { value: o.ext ? 1 : 0 }, uEdge: { value: new THREE.Color(o.edge || "#3b2010") } } });
}
async function buildDoor() {
  const [wall, ll, lr] = await Promise.all(["wall", "leaf_l", "leaf_r"].map((n) => loadImgRetry(`img/gate/${n}.webp`)));
  const O = { u0: .2959, u1: .7031, v0: .2936, v1: .7669 };      // the temple doorway in the wall picture (from the top)
  const Ww = 2.05 / (O.u1 - O.u0), Hw = Ww * 1.5;                // a gate opening about 2 m wide
  const groundV = .875;                                           // the row where the temple steps meet the ground
  const X = (u) => (u - .5) * Ww, Y = (v) => (groundV - v) * Hw;
  const wg = new THREE.PlaneGeometry(Ww * 5, Hw * 5), wuv = wg.attributes.uv;   // 5× the picture each way: it never ends
  for (let n = 0; n < wuv.count; n++) wuv.setXY(n, (wuv.getX(n) - .5) * 5 + .5, (wuv.getY(n) - .5) * 5 + .5);
  const wallM = new THREE.Mesh(wg, doorMat(wall, { cut: .5, ext: true }));
  wallM.position.y = (groundV - .5) * Hw;                         // the picture's ground row sits on the lawn
  // the pillars' inner faces and the threshold: the gate's depth, seen as the camera moves
  const dz = .06, th = .05, jd = .35, oh = Y(O.v0) - Y(O.v1);
  const stone = new THREE.MeshBasicMaterial({ color: "#d8cfc4", side: THREE.DoubleSide });
  const jambs = [O.u0, O.u1].map((u) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(jd, oh), stone);
    m.rotation.y = Math.PI / 2; m.position.set(X(u), (Y(O.v0) + Y(O.v1)) / 2, -jd / 2); return m; });
  // the leaves: thick iron frames hinged at the pillars, just behind the wall's face
  // the gate picture is trimmed to its iron: its arched rail tops out 8.5% below the picture's top, the spear finials rise above
  const SPIKE = 0, lw = -X(O.u0 - .006), bot = Y(O.v1 + .004), lh = (Y(O.v0) - bot) / (1 - SPIKE), top = bot + lh;
  const leaf = (img, sd) => {
    const geo = new THREE.BoxGeometry(lw, lh, th, 1, 1, 1); geo.translate(-sd * lw / 2, 0, 0);
    const m = new THREE.Mesh(geo, doorMat(img, { metal: true, cut: .45 })); m.position.set(sd * lw, (top + bot) / 2, -dz - th / 2); return m;
  };
  door.L = leaf(ll, -1); door.R = leaf(lr, 1);
  door.g.add(wallM, ...jambs, door.L, door.R);
  door.g.position.set(pathX(0), 0, 0);
  door.ready = true; door.g.visible = true;
}
function stepDoor(now) {
  if (!door.ready || door.done) return;
  const k = door.t0 < 0 ? 0 : now - door.t0, dur = RM ? .5 : 2.6;
  const a = (d) => eio(clamp((k - d) / dur)) * 1.62;                 // to about 93°, the right leaf a beat behind
  door.L.rotation.y = a(.05); door.R.rotation.y = -a(.22);
  door.flash = door.t0 < 0 || RM ? 0 : .1 * Math.sin(Math.PI * clamp((k - .2) / 2));
  if (door.t0 >= 0 && k > dur + 3.4) { door.done = true; door.g.visible = false; }
}

// ---------- the lens: the stop we look at is sharp, the rest of the garden goes gently soft ----------
// The scene is drawn once with its depth. Each pixel's blur size comes from how far it is from the focus; the soft
// picture is gathered at half size, taking a neighbour only if that neighbour's own blur reaches this pixel, so a sharp
// person never smears into the soft garden behind them (no halo, no outline).
const mainRT = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true });
mainRT.depthTexture = new THREE.DepthTexture(4, 4); mainRT.depthTexture.type = THREE.UnsignedIntType;
const cocRT = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false, type: THREE.HalfFloatType });
const blurRT = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false, type: THREE.HalfFloatType });
const quadGeo = new THREE.PlaneGeometry(2, 2);
const QV = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const LIN = `uniform float uNear, uFar, uFocus, uAp; float lin(float d){ return uNear * uFar / (uFar - d * (uFar - uNear)); }
  float coc(float d){ float z = lin(d); return clamp(uAp * abs(z - uFocus) / max(z, .001), 0.0, 1.0); }`;
const lensU = { uNear: { value: camera.near }, uFar: { value: camera.far }, uFocus: { value: 6 }, uAp: { value: .55 } };
const cocQuad = new THREE.Mesh(quadGeo, new THREE.ShaderMaterial({ depthTest: false, depthWrite: false,
  uniforms: { tC: { value: mainRT.texture }, tD: { value: mainRT.depthTexture }, ...lensU }, vertexShader: QV,
  fragmentShader: `uniform sampler2D tC, tD; ${LIN} varying vec2 vUv;
    void main(){ gl_FragColor = vec4(texture2D(tC, vUv).rgb, coc(texture2D(tD, vUv).r)); }` }));
const blurQuad = new THREE.Mesh(quadGeo, new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, defines: { TAPS: 36 },   // fewer taps on a slow phone (QUAL)
  uniforms: { tC: { value: cocRT.texture }, uTexel: { value: new THREE.Vector2() }, uR: { value: 6 } }, vertexShader: QV,
  fragmentShader: `uniform sampler2D tC; uniform vec2 uTexel; uniform float uR; varying vec2 vUv;
    void main(){ vec4 c0 = texture2D(tC, vUv); vec3 acc = c0.rgb; float ws = 1.0;
      for (int k = 0; k < TAPS; k++) {
        float fk = float(k), r = sqrt((fk + .5) / float(TAPS)) * uR, an = fk * 2.39996;
        vec4 s = texture2D(tC, vUv + vec2(cos(an), sin(an)) * r * uTexel);
        float w = smoothstep(r - 1.0, r + .5, s.a * uR);          // only neighbours whose own blur reaches here
        acc += s.rgb * w; ws += w; }
      gl_FragColor = vec4(acc / ws, c0.a); }` }));
const post = new THREE.Mesh(quadGeo, new THREE.ShaderMaterial({ depthTest: false, depthWrite: false,
  uniforms: { tC: { value: mainRT.texture }, tB: { value: blurRT.texture }, tD: { value: mainRT.depthTexture }, ...lensU,
    uVel: { value: 0 }, uT: { value: 0 }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color("#fff6ff") } }, vertexShader: QV,
  fragmentShader: `uniform sampler2D tC, tB, tD; uniform float uVel, uT, uFlash; uniform vec3 uFlashCol; ${LIN} varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 lens(vec2 uv){ float k = smoothstep(.06, .3, coc(texture2D(tD, uv).r)); return mix(texture2D(tC, uv).rgb, texture2D(tB, uv).rgb, k); }
    void main(){
      vec2 c = vUv - .5; float r = dot(c, c);
      vec2 uv = vUv - c * r * uVel * .25;
      float ca = .0005 + .004 * uVel;
      vec3 col = vec3(lens(uv + c * ca).r, lens(uv).g, lens(uv - c * ca).b);
      col *= 1.0 - r * .45;
      col = mix(col, uFlashCol + col * .3, uFlash * (1.0 - r * 1.2));
      col += (h(vUv * 917.0 + fract(uT) * 31.0) - .5) * .035;
      gl_FragColor = vec4(col, 1.0); }` }));
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function quad(mesh, target) { renderer.setRenderTarget(target); renderer.render(mesh, quadCam); }

// ---------- phone performance ----------
// Every frame draws the temple grounds with their depth, works out the lens blur at half size, and stacks them, plus the canvas of
// falling flowers. A phone that cannot keep up steps down by itself (never back up, so it never flickers):
//   level 1: fewer pixels (sharpness 1.25×), and the flower canvas at 1.5×
//   level 2: 1×, the lens blur from 18 samples instead of 36, the flower canvas at 1×, fewer drifting petals
// ?q=0|1|2 forces a level (for testing); the median frame time over a second decides, so one-off loading hitches don't count.
const QUAL = { level: 0, caps: PHONE ? [1.6, 1.25, 1] : [1.5, 1.25, 1], fx: [2, 1.5, 1], taps: [36, 36, 18], petals: [1, 1, .55], times: [], hold: 0, forced: Q.has("q") };
if (QUAL.forced) QUAL.level = clamp(Math.round(+Q.get("q") || 0), 0, 2);
function govern(rawMs) {
  if (QUAL.forced || QUAL.level >= 2 || RM || document.hidden || rawMs > 250) return;   // a hidden tab or a stall is not slowness
  if (QUAL.hold > 0) { QUAL.hold--; return; }
  QUAL.times.push(rawMs); if (QUAL.times.length < 60) return;
  const med = QUAL.times.sort((a, b) => a - b)[30]; QUAL.times = [];
  if (med > 1000 / 40) { QUAL.level++; QUAL.hold = 45; layout(); console.info("invite: quality level", QUAL.level, "(median frame", med.toFixed(1), "ms)"); }
}

// ---------- layout ----------
let L = { W: 1, H: 1 };
function layout() {
  const W = stage.clientWidth, H = stage.clientHeight, dpr = Math.min(devicePixelRatio || 1, QUAL.caps[QUAL.level]);
  const bm = blurQuad.material; if (bm.defines.TAPS !== QUAL.taps[QUAL.level]) { bm.defines.TAPS = QUAL.taps[QUAL.level]; bm.needsUpdate = true; }
  if (petals) petals.geometry.setDrawRange(0, Math.round(petals.userData.n * QUAL.petals[QUAL.level]));
  renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
  const fw = Math.round(W * dpr), fh = Math.round(H * dpr);
  mainRT.setSize(fw, fh); cocRT.setSize(Math.round(fw / 2), Math.round(fh / 2)); blurRT.setSize(Math.round(fw / 2), Math.round(fh / 2));
  blurQuad.material.uniforms.uTexel.value.set(1 / Math.round(fw / 2), 1 / Math.round(fh / 2));
  blurQuad.material.uniforms.uR.value = 5.5 * fh / 1300;           // the softest blur, in half-size pixels (kept gentle)
  petalMat.uniforms.uPx.value = 30 * fh / 1300 * 3;
  camera.aspect = W / H; camera.updateProjectionMatrix();
  L = { W, H }; fxLayout();
  $("#spacer").style.height = (N - 1 + .75) * innerHeight * SNAP_K + innerHeight + "px"; placeSnaps();   // one swipe, one stop (2026-10-13): a short scroll, one snap point a stop
}

// ---------- DOM text ----------
function split(el) {
  // script lines (names, "Thank you") stay whole: the font joins and reshapes letters by their neighbours, so they are
  // revealed with a left-to-right writing wipe instead of letter by letter.
  // Indic lines stay whole to preserve conjuncts and combining marks: in word spans, Chrome drew a stray piece of a Tamil letter above the line
  // (found in Kalyana Payanam)
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
  for (const id of ["helloCurtain", "helloEnd", "helloIntro"]) { const el = document.getElementById(id); if (el) el.textContent = hello; }
  if ($("#helloIntro")) $("#helloIntro").hidden = !hello;
  document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));
  $("#hudT").textContent = titleOf(Math.max(0, lastCh));
  // the tab title and link-preview tags (the server writes the same into the page for WhatsApp and other link previews)
  document.title = `${T.names} · ${T.brand}`;
  const meta = { "#m-desc": T.ogDesc, "#m-ogt": T.ogTitle, "#m-ogd": T.ogDesc };
  for (const k in meta) if (meta[k]) $(k)?.setAttribute("content", meta[k]);
  if (started) $("#tapl").textContent = T.btn.tap;
  wireLinks(); buildEvents(); buildRsvpChips(); updateRsvp();
  $("#hintT").textContent = canHover ? T.btn.wheel : T.btn.swipe; showWishes();
  fitTag();
}
const T_OUT = .62;   // each stop: 0 → .62 the camera holds (its card is up), .62 → 1 it swings across to the next stop
function domFor(n, t) {
  const s = sections[n], last = n === N - 1;
  const vis = t > -.05 && t < (last ? 9 : T_OUT + .02);
  s.classList.toggle("on", vis); if (!vis) return;
  const out = last ? 0 : clamp((t - (T_OUT - .1)) / .1);
  s.style.setProperty("--pp", clamp((t - (n === 0 ? -.4 : .02)) / .1) * (1 - out));
  [...s.querySelectorAll(".split,.rise")].forEach((el, j) => {
    const inn = clamp((t - (n === 0 ? -.3 : last && el.classList.contains("acts") ? .1 : .04) - j * .03) / .14);
    el.style.setProperty("--p", inn * (1 - out));
    el.classList.toggle("done", inn * (1 - out) > .999);   // fully shown: stop clipping, so flourishes are never cut
  });
}

// ---------- flower shower: rose petals, marigolds and jasmine (a temple's own flowers) ----------
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
// ---------- one drawing layer for every falling flower and flying heart ----------
// Each little picture is drawn once into a small bitmap; then all of them are painted onto a single canvas each frame.
// (Moving dozens of separate page elements made the big wish burst stutter on phones.)
const fxC = document.createElement("canvas"); fxC.id = "fx"; fxC.setAttribute("aria-hidden", "true"); stage.appendChild(fxC);
const fx = fxC.getContext("2d"); let fxDpr = 1, fxDirty = false;
function fxLayout() { fxDpr = Math.min(devicePixelRatio || 1, QUAL.fx[QUAL.level]); fxC.width = Math.round(L.W * fxDpr); fxC.height = Math.round(L.H * fxDpr); }
const sprites = new Map();
function sprite(src, asp) {   // asp: height / width of the picture
  let sp = sprites.get(src);
  if (!sp) {
    sp = { c: null, asp }; sprites.set(src, sp);
    const im = new Image();
    im.onload = () => { const c = document.createElement("canvas"); c.width = 64; c.height = Math.round(64 * asp); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); sp.c = c; };
    im.src = src;
  }
  return sp;
}
const parts = [];
// a shower: flowers (or hearts) falling and fluttering down the sides of the screen (hearts: anywhere — the last stop has no faces)
function shower(n, kind) {
  if (RM) return;
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, H = L.H, hearts = kind === "hearts", bloom = i % 3 !== 0;
    const src = bloom ? FLOWERS.bloom[Math.floor(Math.random() * FLOWERS.bloom.length)] : FLOWERS.petal[i % 4];
    parts.push({ fall: true, sp: sprite(src, bloom ? 1 : 46 / 40), size: hearts ? 15 + Math.random() * 10 : 13 + Math.random() * 8,
      x: (hearts ? Math.random() : i % 2 ? Math.random() * .26 : 1 - Math.random() * .26) * L.W, y: -30 - Math.random() * H * .35,
      vy: H / (3.4 + Math.random() * 2.8), dx: -side * Math.random() * .08 * L.W, sw: 6 + Math.random() * 12, ph: Math.random() * 6.3,
      spd: 1.6 + Math.random() * 1.8, r: Math.random() * 6.3, vr: (Math.random() - .5) * 1.6, t: 0 });
  }
}
// a burst of hearts from one point. patterns: "fountain" (a spray upward), "ring" (all round), "heart" (hearts fly out in
// the shape of a heart), "spiral" (a turning stream), "star" (rays). A tap is a small fountain; each wish takes the next.
const PATTERNS = ["fountain", "heart", "ring", "spiral", "star"];
function heartBurst(x, y, n, big, pattern = "fountain") {
  if (RM) n = Math.min(n, 6);
  for (let k = 0; k < n; k++) {
    const size = big ? 16 + Math.random() * 22 : 12 + Math.random() * 12, f = k / n;
    let a = -Math.PI / 2 + (Math.random() - .5) * (big ? 2.6 : 2.0), sp = (big ? 240 : 140) + Math.random() * (big ? 360 : 160), grav = 1, delay = 0, vx, vy;
    if (pattern === "ring") { a = f * Math.PI * 2 + Math.random() * .12; sp = 300 + Math.random() * 60; grav = .35; }
    else if (pattern === "spiral") { a = f * Math.PI * 6; sp = 220 + f * 220; grav = .3; delay = f * .55; }
    else if (pattern === "star") { a = Math.floor(f * 8) / 8 * Math.PI * 2 - Math.PI / 2; sp = 160 + (k % Math.ceil(n / 8)) * 70; grav = .25; }
    if (pattern === "heart") {
      const t = f * Math.PI * 2, hx = 16 * Math.sin(t) ** 3 / 16, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
      vx = hx * 330; vy = hy * 330; grav = .2;
    } else { vx = Math.cos(a) * sp; vy = Math.sin(a) * sp; }
    const fl = k % 3 === 0 ? [FLOWERS.petal[k % 4], 46 / 40] : [FLOWERS.bloom[k % 3], 1];
    parts.push({ fall: false, sp: sprite(fl[0], fl[1]), x, y, vx, vy, grav, r: (Math.random() - .5) * .7, vr: (Math.random() - .5) * 3, t: -delay,
      life: (big ? 1.7 : 1.1) + Math.random() * .6, size });
  }
}
function stepFx(dt) {
  if (!parts.length && !fxDirty) return;
  fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, fxC.width, fxC.height); fxDirty = parts.length > 0;
  const D = fxDpr;
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k]; p.t += dt;
    let x, y, sx = 1, sy = 1, alpha = 1;
    if (p.fall) {
      p.y += p.vy * dt; p.r += p.vr * dt;
      x = p.x + p.dx * Math.min(1, p.y / L.H) + Math.sin(p.t * p.spd + p.ph) * p.sw; y = p.y;
      const w = p.t * p.spd * 1.7 + p.ph; sx = .35 + .65 * Math.abs(Math.cos(w)); sy = .75 + .25 * Math.abs(Math.sin(w * .8));   // it flutters
      if (p.y > L.H + 40 || p.t > 12) { parts.splice(k, 1); continue; }
    } else {
      if (p.t < 0) continue;
      p.vy += 420 * p.grav * dt; p.vx *= Math.exp(-dt * 1.6); p.vy *= Math.exp(-dt * .9); p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      const f = p.t / p.life; sx = sy = Math.min(1, p.t / .12) * (1 - Math.max(0, f - .7) / .3 * .4); alpha = clamp(1 - (f - .65) / .35);
      x = p.x; y = p.y;
      if (f >= 1) { parts.splice(k, 1); continue; }
    }
    if (!p.sp.c) continue;
    const c = Math.cos(p.r), s = Math.sin(p.r), w = p.size, h = p.size * p.sp.asp;
    fx.globalAlpha = alpha;
    fx.setTransform(D * sx * c, D * sx * s, -D * sy * s, D * sy * c, D * x, D * y);
    fx.drawImage(p.sp.c, -w / 2, -h / 2, w, h);
  }
  fx.globalAlpha = 1;
}

// ---------- countdown ----------
const WED = M.countdown;
const cd = ["d", "h", "m", "s"].map((k) => document.getElementById("cd-" + k));
function tick() {
  if (!cd[0]) return;                                   // no wedding stop, no countdown
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
// the last card's buttons follow the main event (the wedding); a button with nothing behind it is not shown
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
// the reply saved on the website, into the couple's guest list (the site's own RSVP request, as in Kalyana Payanam: a guest
// link carries a token, a shared link sends the name and gets a token back, so a second reply from this phone updates the first)
$("#rSend").addEventListener("click",e=>{if(window.FMI_PREVIEW){e.preventDefault();toast("Preview only — no RSVP was sent.");}});
function toast(s) { const t = $("#toast"); t.textContent = s; t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), 2000); }
$("#shareBtn").addEventListener("click", async () => {
  const url = M.shareUrl || location.href;   // on the site: the plain invitation link, not this guest's own
  try { if (navigator.share) return await navigator.share({ title: T.names, text: T.shareText, url }); } catch (e) { if (e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); toast(T.btn.copied); } catch {}
});
async function makeCard() {   // a portrait picture invite: the temple under the names, every function below
  const c = document.createElement("canvas"); c.width = 1080; c.height = 1350; const x = c.getContext("2d");
  const bg = await loadImg("img/env/t_sky.webp"); x.drawImage(bg, 0, 0, 1080, 1350);
  const st = await loadImg(C + STOPS.welcome.cut + ".webp").catch(() => null);
  if (st) { const h = 900, w = h * st.width / st.height; x.drawImage(st, 540 - w / 2, 1350 - h - 30, w, h); }
  const panel = (y, h) => { x.fillStyle = "rgba(255,248,234,.94)"; x.fillRect(70, y, 940, h);
    x.strokeStyle = "#c99a3b"; x.lineWidth = 3; x.strokeRect(84, y + 14, 912, h - 28); x.lineWidth = 1; x.strokeRect(94, y + 24, 892, h - 48); };
  const body = (s) => (LANG === "en" ? `600 ${s}px "Cormorant Garamond"` : `600 ${s * .8}px "${FONTS[LANG].b}"`);
  x.textAlign = "center"; x.textBaseline = "middle";
  panel(50, 400);
  const g = x.createLinearGradient(200, 80, 880, 420); g.addColorStop(0, "#6e1509"); g.addColorStop(.5, "#b5782a"); g.addColorStop(1, "#6e1509"); x.fillStyle = g;
  x.font = body(32); x.letterSpacing = LANG === "en" ? "10px" : "0px"; x.fillText(LANG === "en" ? T.brand.toUpperCase() : T.brand, 540, 118, 860);
  x.letterSpacing = "0px"; x.font = LANG === "en" ? `400 140px "Great Vibes"` : `700 92px "${FONTS[LANG].d}"`; x.fillText(T.names, 540, 232, 860);
  x.font = body(34); x.letterSpacing = LANG === "en" ? "8px" : "0px"; x.fillText(LANG === "en" ? T.marrying.toUpperCase() : T.marrying, 540, 335, 860);
  x.font = body(46); x.fillText(T.dateShort, 540, 395); x.letterSpacing = "0px";
  // the events panel sits low, over the couple's feet; with more than three events it grows upward, but at most four
  // events are drawn so it never reaches their faces
  // (with more events: the temple's own stops first — engagement, wedding, reception — then the rest, in date order)
  const rank = (e) => (e.type === "other" ? 1 : 0), keep = [...T.events].sort((a, b) => rank(a) - rank(b)).slice(0, 4);
  const evs = T.events.filter((e) => keep.includes(e)), ph = Math.max(300, 110 + evs.length * 94), py = 1320 - ph;
  if (evs.length) panel(py, ph);
  evs.forEach((e, n) => { const y = py + ph / 2 - 15 + (n - (evs.length - 1) / 2) * 94;
    x.fillStyle = "#8f1d14"; x.font = LANG === "en" ? `400 54px "Great Vibes"` : `700 32px "${FONTS[LANG].d}"`; x.fillText(e.name, 540, y - 6, 860);
    x.fillStyle = "#7a2a14"; x.font = body(27); x.fillText(e.when, 540, y + 36, 860); });
  return new Promise((r) => c.toBlob(r, "image/jpeg", .9));
}
$("#cardBtn").addEventListener("click", async () => {
  const blob = await makeCard(), file = new File([blob], `${M.slug}-invite.jpg`, { type: "image/jpeg" });
  try { if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title: T.names }); } catch (e) { if (e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
});

// ---------- music ----------
const bgm = $("#bgm"), musicBtn = $("#music");
// no song for Thiruvarul (owner, 2026-10-09): with no music.src the button stays hidden and nothing is downloaded
if (M.music) { bgm.src = M.music + (M.musicStart ? "#t=" + M.musicStart : ""); musicBtn.hidden = false; } else musicBtn.hidden = true;
// a song can start part-way in (music.start, e.g. 1:31) and loops back to that point, not to the beginning
if (M.musicStart) {
  bgm.loop = false;
  bgm.addEventListener("loadedmetadata", () => { if (bgm.currentTime < M.musicStart - .5) bgm.currentTime = M.musicStart; });
  bgm.addEventListener("ended", () => { bgm.currentTime = M.musicStart; if (musicOn) bgm.play().catch(() => {}); });
}
let actx = null, gain = null, musicOn = store.get("inv-music") !== "off";
function musicSet(on, fadeS = 1.2) {
  if (!M.music) return;
  musicOn = on; store.set("inv-music", on ? "on" : "off"); musicBtn.setAttribute("aria-pressed", String(on));
  try {
    if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); gain = actx.createGain(); gain.gain.value = 0; actx.createMediaElementSource(bgm).connect(gain).connect(actx.destination); }
    actx.resume(); const t = actx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t);
    if (on) { bgm.play().catch(() => {}); gain.gain.linearRampToValueAtTime(.55, t + fadeS); }
    else { gain.gain.linearRampToValueAtTime(0, t + .5); setTimeout(() => !musicOn && bgm.pause(), 600); }
  } catch { on ? bgm.play().catch(() => {}) : bgm.pause(); }
}
musicBtn.addEventListener("click", () => musicSet(!musicOn, .6));
document.addEventListener("visibilitychange", () => { if (!actx) return; document.hidden ? bgm.pause() : musicOn && bgm.play().catch(() => {}); });

async function setLang(l) {
  if (l === LANG || !M.languages.includes(l)) return;
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

// ---------- the wish count ----------
// Blessings are counted on this device. No reference-site service is called.
const WISH_KEY="fmi-temple-wishes-"+(M.shareUrl||M.slug);
const wishes={shared:false,total:0,mine:Number(store.get(WISH_KEY)||0)||0,lastGet:Infinity,get(){},add(){this.mine++;store.set(WISH_KEY,String(this.mine));}};
function showWishes() {
  const n = wishes.shared ? wishes.total : wishes.mine, el = document.getElementById("wishCount");
  if (el) el.textContent = n ? (n === 1 ? T.wishOne : fill(T.wishCount, { n: n.toLocaleString(LANG === "ta" ? "ta-IN" : "en-IN") })) : "";
}
function sendWish(k) {
  toast(T.wishMsgs[k % T.wishMsgs.length]);
  wishes.add(); showWishes();
}
const wish = { charge: 0, holding: false, sx: -999, sy: -999, cool: 0, at: false, n: 0, flash: 0, lit: false };
const hintT = $("#hintT"), canHover = matchMedia("(hover: hover)").matches;
let tap = null;
stage.addEventListener("pointerdown", (e) => {
  if (!started || openSheet || e.target.closest("a,button,input,.sheet")) return;
  const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  tap = { x, y, t: performance.now(), id: e.pointerId };
  if (wish.at && Math.hypot(x - wish.sx, y - wish.sy) < 115) wish.holding = true;   // it starts filling once the last burst settles
});
addEventListener("pointermove", (e) => { if (tap && e.pointerId === tap.id) { const r = stage.getBoundingClientRect(); if (Math.hypot(e.clientX - r.left - tap.x, e.clientY - r.top - tap.y) > 14) { tap.moved = true; } } });
const endTap = (e) => {
  const was = wish.holding; wish.holding = false;
  if (!tap || e.pointerId !== tap.id) return;
  if (!was && !tap.moved && performance.now() - tap.t < 400) heartBurst(tap.x, tap.y, 9);   // a tap anywhere: a little burst of flowers
  tap = null;
};
addEventListener("pointerup", endTap); addEventListener("pointercancel", (e) => { wish.holding = false; tap = null; });
stage.addEventListener("contextmenu", (e) => { if (wish.at) e.preventDefault(); });
const ringEl = $("#wishRing"), HV = new THREE.Vector3();
function stepWish(now, dt, here) {
  wish.at = here && !!lampObj.g;
  if (!lampObj.g) return;
  if (wish.at && now - wishes.lastGet > 30) wishes.get();   // keep the local count available at the lamp
  const { flames, halo, light, glitter, rising, top } = lampObj;
  if (wish.cool > 0) wish.cool -= dt;
  wish.charge = clamp(wish.charge + (wish.holding && wish.cool <= 0 ? dt / 1.6 : -dt * 1.2));
  if (wish.charge >= 1) {                                             // the blessing: the bell rings, flowers burst and shower, the count rises
    const k = wish.n++ % PATTERNS.length;
    heartBurst(wish.sx, wish.sy, 38, true, PATTERNS[k]); shower(30); bell(560 + k * 40, .24);
    wish.charge = 0; wish.cool = 1.1; wish.holding = false; wish.flash = 1; wish.lit = true; sendWish(k);
  }
  const c = wish.charge;
  wish.flash = Math.max(0, wish.flash - dt * .7);
  let glow = 0;
  flames.forEach((f, k) => {                                          // the wicks light one by one as the guest holds; once blessed they stay lit
    const on = wish.lit || c > (k + .6) / 5.6 ? 1 : 0, u = f.userData;
    u.v += (on - u.v) * Math.min(1, dt * (on ? 9 : 3)); glow += u.v;
    const fl = RM ? 1 : 1 + Math.sin(now * 13 + u.ph) * .08 + Math.sin(now * 23 + u.ph * 2) * .05;
    f.scale.set(.085 * u.v * (1 + wish.flash * .5), .17 * u.v * fl * (1 + wish.flash * .6 + c * .2), 1); f.material.opacity = Math.min(1, u.v * 1.1);
  });
  light.intensity = glow * .9 + wish.flash * 3; halo.material.opacity = glow / 5 * .7 + wish.flash * .4 + c * .2;
  glitter.material.uniforms.uC.value = Math.max(c, wish.flash, glow / 5 * .35);
  for (const sp of rising) {                                           // embers drift up from the flames
    const u = sp.userData, f = (now * (.22 + c * .4) + u.ph) % 1;
    sp.position.set(top.x + u.x + Math.sin(now * 1.3 + u.w) * .04, top.y + .1 + f * .7, top.z + u.z);
    sp.scale.setScalar(u.s * (1 - f * .5)); sp.material.opacity = RM ? 0 : Math.sin(f * Math.PI) * Math.min(1, glow / 2 + c);
  }
  HV.copy(top).project(camera);
  wish.sx = (HV.x * .5 + .5) * L.W; wish.sy = (-HV.y * .5 + .5) * L.H;
  ringEl.classList.toggle("on", wish.at && HV.z < 1);
  ringEl.style.transform = `translate(${wish.sx.toFixed(1)}px, ${wish.sy.toFixed(1)}px) scale(${(1 + c * .25).toFixed(3)})`; ringEl.style.setProperty("--c", c.toFixed(3));
}

// ---------- the walk ----------
// one stop per scroll unit: 0 → .62 hold on the stop (a slow step closer) while its card is up, .62 → 1 swing across the path
// to the next stop. The camera goes through a point on the path between stops, so its route zigzags left, right, left.
const V = new THREE.Vector3(), W2 = new THREE.Vector3();
const bez = (a, m, b, k, out) => out.set(0, 0, 0).addScaledVector(a, (1 - k) * (1 - k)).addScaledVector(m, 2 * k * (1 - k)).addScaledVector(b, k * k);
function camAt(i, t) {
  const b = stopsBuilt[i], nx = stopsBuilt[i + 1];
  const pos = new THREE.Vector3(), look = new THREE.Vector3();
  if (!nx || t < T_OUT) { pos.lerpVectors(b.view, b.viewEnd, eio(clamp(t / (nx ? T_OUT : .6)))); look.copy(b.look); return { pos, look, focus: pos.distanceTo(b.look) }; }
  const f = (t - T_OUT) / (1 - T_OUT), k = eio(f);
  bez(b.viewEnd, b.mid, nx.view, k, pos);
  look.lerpVectors(b.look, nx.look, smoothstep(.1, .9, f));
  const ahead = W2.set(b.mid.x, 1.2, b.mid.z - 6);                       // mid-swing, the eye glances down the path
  look.lerp(ahead, Math.sin(Math.PI * f) * .45);
  return { pos, look, focus: lerp(b.viewEnd.distanceTo(b.look), nx.view.distanceTo(nx.look), k) * (1 + Math.sin(Math.PI * f) * .8) };
}

let Ps = 0, prevPs = 0, vel = 0, last = performance.now(), started = false, introT0 = -1, lastCh = 0;
let sheenAt = 0; const doorsEl = $("#doors");
const FT = Q.has("debug") && Q.has("ft") ? [] : null, px1 = new Uint8Array(4);   // ?debug=1&ft=1: time each frame's full work (tests/perf.mjs)
const rail = $("#rail i"), hint = $("#hint"), hudN = $("#hudN"), hudT = $("#hudT"), root = document.documentElement;
const startPos = new THREE.Vector3(pathX(0), EYE, DOOR_D), gatePass = new THREE.Vector3(pathX(-1), EYE, -1.2);
// ---------- one swipe, one stop (2026-10-13) ----------
// Owner, 2026-10-13: "in mobile it's like we have more scrolls, and it makes the clients hate the style: make it snapping
// to the details part, along with scroll keep a small button or something to move to next event". Each stop has one
// resting point, the moment its card is fully up. A swipe up or down, however short (a deliberate one: 24 px or more),
// moves exactly one stop; so does one turn of the mouse wheel or trackpad, the arrow and page keys, and the note's button
// ("Next · <the next stop>"). The page then glides there and the camera follows at its own steady pace (frame(): at most
// 1.15 stops a second). The scroll is short and CSS scroll snap holds the same points for a dragged scrollbar. Sheets
// (All events, RSVP) scroll as before. ?nosnap turns all this off (testing).
const SNAP_K = 1, SNAP_HOLD = 0.42, SNAP_ON = !Q.has("nosnap");
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
  el.textContent = n < N ? (NEXT_WORD[LANG] || NEXT_WORD.en) + " · " + titleOf(n) : "";
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
  const ft0 = FT && performance.now(); frameNo++;
  const now = nowMs / 1000, raw = nowMs - last, dt = Math.min(.05, raw / 1000); last = nowMs;
  if (started) govern(raw);
  timeU.value = now;
  const max = root.scrollHeight - innerHeight;
  const P = max > 0 ? clamp(scrollY / max) * (N - 1 + .75) : 0;
  prevPs = Ps; Ps = glide(P, dt, stopsBuilt.length && stopsBuilt.length < N ? stopsBuilt.length - 1 + .5 : Infinity);   // a slow glide, a small Next (2026-10-13): a slow, fluid glide to the card
  vel += ((Math.abs(Ps - prevPs) / Math.max(dt, .001)) - vel) * (1 - Math.exp(-dt * 6));
  const i = Math.min(N - 1, Math.floor(Ps)), t = Ps - i;
  const tl = RM ? 0 : 1 - Math.exp(-dt * 3); tx += (tgx - tx) * tl; ty += (tgy - ty) * tl;

  let pos, look, focus;
  if (stopsBuilt.length) ({ pos, look, focus } = camAt(i, t));
  else { pos = startPos.clone(); look = new THREE.Vector3(pathX(-10), 1.4, -10); focus = DOOR_D; }
  // the opening: from in front of the gate, through it, to the first stop
  let intro = 1;
  if (introT0 >= 0) { intro = clamp((now - introT0) / 3.8); if (intro >= 1) introT0 = -1; }
  else if (!started) intro = 0;
  if (intro < 1) {
    const k = eio(intro), gl = new THREE.Vector3(pathX(-12), 1.35, -12);
    pos = bez(startPos, gatePass, pos, k, new THREE.Vector3());
    look = gl.lerp(look, smoothstep(.35, 1, intro));
    focus = lerp(DOOR_D, focus, smoothstep(.2, .9, intro));
  }
  const sway = RM ? 0 : door.done ? 1 : .18 + .82 * intro;   // a gentle sway at the gate (it stays framed), full once inside
  camera.position.set(pos.x + tx * .1 * sway, pos.y - ty * .07 * sway + Math.sin(now * .5) * .01, pos.z);
  camera.lookAt(look.x + tx * .05 * sway, look.y - ty * .03 * sway, look.z);

  // the couple appear only at the stop we are at and the one we are walking to (never twice in one view)
  stopsBuilt.forEach((b, n) => {
    const v = n === i ? 1 : n === i + 1 ? smoothstep(.55, .78, t) : n === i - 1 ? 1 - smoothstep(0, .12, t) : 0;
    if (b.cut) b.cut.vis = v; if (b.swingCut) b.swingCut.vis = v;
    if (b.shadows) b.shadows.forEach((sh, k) => (sh.material.opacity = (k ? .4 : .55) * v));
  });
  // things turn to face the guest (they are paintings); the swing sways; people near the lens fade so no one is cut
  for (const c of cuts) {
    if (c.face) c.group.rotation.y = Math.atan2(camera.position.x - c.group.position.x, camera.position.z - c.group.position.z) * .85;
    if (c.person) { c.group.getWorldPosition(V); c.u.uO.value = clamp((V.distanceTo(camera.position) - 1.1) / .9) * c.vis; c.group.visible = c.u.uO.value > .01; }
    if (c.faces && !RM) c.faces.forEach((f, k) => {                                        // each of them blinks on their own clock
      if (now > f.next + .2) f.next = now + 2.4 + Math.random() * 3.4;
      c.u.uBlinkW.value.setComponent(k, clamp(1 - Math.abs(now - f.next - .08) / .08));
    });
  }
  for (const b of stopsBuilt) if (b.swing) b.swing.rotation.x = RM ? 0 : .11 * Math.sin(now * 1.15);   // the swing goes back and forth
  petalMat.uniforms.uCam.value.copy(camera.position);
  stepFx(dt); stepPics(dt); stepWarm(now, t < T_OUT - .08);
  stepDoor(now); stepButterflies(now, dt);
  stepWish(now, dt, KEYS[i] === "wishes" || (KEYS[i + 1] === "wishes" && t > .9));
  sky.position.set(camera.position.x, 52, camera.position.z); far.position.set(camera.position.x * .9, 15, camera.position.z * .9);

  // the lens
  lensU.uFocus.value = focus; lensU.uAp.value = (RM ? .3 : .48) * (door.done ? 1 : .2 + .8 * smoothstep(.3, 1, intro));
  renderer.setRenderTarget(mainRT); renderer.clear(); renderer.render(scene, camera);
  quad(cocQuad, cocRT); quad(blurQuad, blurRT);
  const PU = post.material.uniforms;
  PU.uVel.value = RM ? 0 : clamp(vel * .3, 0, .8); PU.uFlash.value = door.done ? 0 : door.flash; PU.uT.value = now;
  quad(post, null);

  sections.forEach((_, n) => domFor(n, started && intro > .85 ? Ps - n : -1));
  // the gold foil's slow sheen: only on what is showing (the card on screen, the doors' tag, an open sheet), ~12 times a
  // second. (Setting it on the whole page every frame restyled everything 60 times a second: in Kalyana Payanam and
  // Poovanam that halved the frame rate on a slowed phone.)
  if (now - sheenAt > .08) {
    sheenAt = now; const v = ((now * 9) % 260).toFixed(1) + "%";
    for (const sec of sections) if (sec.classList.contains("on")) sec.style.setProperty("--sheen", v);
    if (!started || !door.done) doorsEl.style.setProperty("--sheen", v);
    if (openSheet) openSheet.style.setProperty("--sheen", v);
  }
  const shown = t > .86 && i < N - 1 ? i + 1 : i;
  if (shown !== lastCh) {
    lastCh = shown; hudN.textContent = String(shown + 1).padStart(2, "0"); hudT.textContent = titleOf(shown);
    const sh = STOPS[KEYS[shown]].shower; if (started && sh && shown > 0) shower(sh);
  }
  rail.style.height = (Ps / (N - 1 + .75)) * 100 + "%";
  // the persistent note: always there while there is more garden ahead (not over the thank-you buttons or a sheet)
  const onEnd = KEYS[i] === "end" && t < T_OUT + .05;
  hint.classList.toggle("on", started && introT0 < 0 && i < N - 1 && !onEnd && !openSheet); nextLabel(i); noteClash(now);   // one swipe, one stop (2026-10-13): the note is the next button
  root.classList.toggle("snap", SNAP_ON && started);
  document.body.classList.toggle("at-end", Ps > N - 1 - .05);
  if (mx > -99) { cx += (mx - cx) * .25; cy += (my - cy) * .25; cur.style.transform = `translate(${cx}px, ${cy}px)`; }
  if (FT) { renderer.getContext().readPixels(0, 0, 1, 1, 6408, 5121, px1); FT.push(performance.now() - ft0); if (FT.length > 600) FT.shift(); }   // wait for the GPU, then time
  requestAnimationFrame(frame);
}


// ---------- boot ----------
$(".lang").hidden = M.languages.length < 2;   // one language: no switch
renderText();
layout(); addEventListener("resize", () => { layout(); fitTag(); });
history.scrollRestoration = "manual"; scrollTo(0, 0);
const pctEl = $("#pct"); let shownPct = 0, realPct = 0;
const fontLoads = [document.fonts.load('400 40px "Great Vibes"'), document.fonts.load('600 40px "Cormorant Garamond"'), document.fonts.load('italic 600 40px "Cormorant Garamond"')];
fontLoads.push(...loadFonts(LANG));
const total = fontLoads.length + 2; let doneN = 0; const bump = () => { realPct = ++doneN / total; };
let looping = false; const loop = () => { if (!looping) { looping = true; requestAnimationFrame(frame); } };
// the doors: a few more tries if their pictures don't arrive; until then the warm ground and the name tag stand in
const doorTry = (n) => Promise.all([buildDoor(), envReady()]).then(() => { if (n === 0) bump(); $("#doors").classList.add("has3d"); loop(); envLate(); },
  (e) => { if (n === 0) bump(); console.error("doors", e?.target?.src || e); loop(); if (n < 3 && !started) setTimeout(() => doorTry(n + 1), 1500 * (n + 1)); });
doorTry(0);
fontLoads.forEach((p) => p.then(bump, bump));
(function count() { shownPct += (realPct - shownPct) * .12; pctEl.textContent = String(Math.round(shownPct * 100)).padStart(3, "0"); if (shownPct < .995) requestAnimationFrame(count); })();
await Promise.allSettled(fontLoads);
renderText();
for (let k = 0; ; k++) {   // the temple's pictures: a dropped connection is tried again (nothing is added until they have all arrived)
  try { const firstP = await buildGarden(); await firstP; bump(); break; }   // laid out at once; "tap to open" once the gate view's pictures are in
  catch (e) { if (k >= 2) { bump(); console.error("temple", e?.target?.src || e); break; } await new Promise((r) => setTimeout(r, 2000 * (k + 1))); }
}
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
  $("#doors").classList.add("open"); door.t0 = performance.now() / 1000; bell(520, .2); setTimeout(() => bell(620, .14), 420);   // the temple bells ring as the doors open
  document.body.classList.remove("locked"); document.body.classList.add("go");
  introT0 = performance.now() / 1000 + .4;
  shower(26);
  if (KEYS.includes("wishes")) wishes.get();   // initialize the local blessing display
}, { once: true });

if(window.FMI_THUMBNAIL){document.documentElement.classList.add("fmi-thumbnail");document.querySelector("#doors").click();}
