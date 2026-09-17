import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';

/** An original, procedural little studio companion. No downloaded character assets. */
export default function LoveRobot({busy = false}: {busy?: boolean}) {
  const host = useRef<HTMLDivElement>(null);
  const thinking = useRef(busy);
  const [ready, setReady] = useState(false);
  useEffect(() => { thinking.current = busy; }, [busy]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'}); }
    catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
    camera.position.set(0, 0.05, 6.4);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x78608e, 2.6));
    const light = new THREE.DirectionalLight(0xfff1d9, 3.2);
    light.position.set(-3, 4, 5); scene.add(light);
    const rim = new THREE.DirectionalLight(0xe2adff, 2);
    rim.position.set(3, 1, -2); scene.add(rim);
    const cream = new THREE.MeshStandardMaterial({color: 0xfff9ee, roughness: 0.3, metalness: 0.12});
    const visor = new THREE.MeshStandardMaterial({color: 0x251f45, roughness: 0.23, metalness: 0.24});
    const pink = new THREE.MeshStandardMaterial({color: 0xf891bf, roughness: 0.32, metalness: 0.14});
    const glow = new THREE.MeshStandardMaterial({color: 0xffc6ef, emissive: 0xf183cf, emissiveIntensity: 0.65});
    const gold = new THREE.MeshStandardMaterial({color: 0xd5ae6d, metalness: 0.65, roughness: 0.25});
    const geometries: THREE.BufferGeometry[] = [];
    const sphere = new THREE.SphereGeometry(1, 28, 20); geometries.push(sphere);
    const robot = new THREE.Group(); scene.add(robot);
    const ellipsoid = (parent: THREE.Object3D, material: THREE.Material, position: number[], scale: number[]) => {
      const mesh = new THREE.Mesh(sphere, material);
      mesh.position.set(position[0], position[1], position[2]);
      mesh.scale.set(scale[0], scale[1], scale[2]); parent.add(mesh); return mesh;
    };
    ellipsoid(robot, cream, [0, -0.46, 0], [0.44, 0.6, 0.32]);
    ellipsoid(robot, gold, [0, 0.1, 0], [0.16, 0.14, 0.15]);
    const head = new THREE.Group(); head.position.y = 0.61; robot.add(head);
    ellipsoid(head, cream, [0, 0, 0], [0.62, 0.53, 0.41]);
    ellipsoid(head, visor, [0, -0.02, 0.32], [0.49, 0.29, 0.16]);
    ellipsoid(head, pink, [-0.62, -0.01, 0], [0.07, 0.16, 0.15]);
    ellipsoid(head, pink, [0.62, -0.01, 0], [0.07, 0.16, 0.15]);
    ellipsoid(head, gold, [0.12, 0.57, 0], [0.025, 0.1, 0.025]);
    const antenna = ellipsoid(head, pink, [0.12, 0.67, 0], [0.075, 0.075, 0.075]);
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -0.5);
    heartShape.bezierCurveTo(-0.1, -0.38, -0.55, -0.06, -0.55, 0.22);
    heartShape.bezierCurveTo(-0.55, 0.57, -0.16, 0.67, 0, 0.36);
    heartShape.bezierCurveTo(0.16, 0.67, 0.55, 0.57, 0.55, 0.22);
    heartShape.bezierCurveTo(0.55, -0.06, 0.1, -0.38, 0, -0.5);
    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, {depth: 0.14, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.07, bevelThickness: 0.07, curveSegments: 16});
    geometries.push(heartGeometry);
    const eyes = [-0.2, 0.2].map(x => {
      const eye = new THREE.Mesh(heartGeometry, glow); eye.scale.setScalar(0.14); eye.position.set(x, 0.04, 0.475); head.add(eye); return eye;
    });
    const smileCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.09, -0.11, 0.481), new THREE.Vector3(0, -0.15, 0.492), new THREE.Vector3(0.09, -0.11, 0.481)]);
    const smileGeometry = new THREE.TubeGeometry(smileCurve, 12, 0.015, 5, false); geometries.push(smileGeometry);
    head.add(new THREE.Mesh(smileGeometry, glow));
    const armLeft = new THREE.Group(); armLeft.position.set(-0.39, -0.2, 0); robot.add(armLeft);
    const leftHand = ellipsoid(armLeft, cream, [-0.2, 0.02, 0], [0.33, 0.12, 0.13]); leftHand.rotation.z = -0.5;
    const armRight = new THREE.Group(); armRight.position.set(0.4, -0.18, 0); robot.add(armRight);
    const rightHand = ellipsoid(armRight, cream, [0.2, 0.06, 0], [0.3, 0.12, 0.13]); rightHand.rotation.z = 0.6;
    const heart = new THREE.Mesh(heartGeometry, pink); heart.position.set(-0.82, 0.07, 0.18); heart.scale.setScalar(0.46); robot.add(heart);
    ellipsoid(robot, gold, [0, -0.26, 0.31], [0.065, 0.065, 0.022]);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let visible = true;
    let lastFrame = 0;
    const draw = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      if (now - lastFrame > 33 || reduced.matches) {
        lastFrame = now;
        const t = reduced.matches ? 0 : now / 1000;
        robot.position.y = Math.sin(t * 1.7) * 0.07;
        robot.rotation.z = Math.sin(t * 0.9) * 0.045;
        robot.rotation.y = -0.12 + Math.sin(t * 0.7) * 0.1;
        head.rotation.z = thinking.current ? Math.sin(t * 2.3) * 0.13 : Math.sin(t * 0.8) * 0.055;
        armRight.rotation.z = 0.1 + Math.max(0, Math.sin(t * 0.65)) * Math.sin(t * 6) * 0.33;
        heart.rotation.y = Math.sin(t * 1.2) * 0.22;
        heart.scale.setScalar(0.46 + Math.sin(t * 2) * 0.025);
        antenna.scale.setScalar(0.075 + (thinking.current ? Math.sin(t * 4) * 0.012 : 0));
        const blink = !reduced.matches && t % 5.4 > 5.22 ? 0.13 : 1;
        eyes.forEach(eye => { eye.scale.y = 0.14 * blink; });
        renderer.render(scene, camera);
      }
      if (!reduced.matches) frame = requestAnimationFrame(draw);
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const resize = () => {
      const width = container.clientWidth, height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
      renderer.render(scene, camera); start();
    };
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container);
    const visibilityObserver = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; if (visible) start(); });
    visibilityObserver.observe(container);
    document.addEventListener('visibilitychange', start); reduced.addEventListener('change', start);
    resize(); setReady(true);
    return () => {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', start); reduced.removeEventListener('change', start);
      geometries.forEach(g => g.dispose()); [cream, visor, pink, glow, gold].forEach(m => m.dispose());
      renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div className="fmi-love-robot" aria-hidden="true">
    <div className="fmi-love-robot-canvas" ref={host}/>
    {!ready && <span className="fmi-love-robot-fallback"><span>♥ ♥</span><i>♥</i></span>}
  </div>;
}
