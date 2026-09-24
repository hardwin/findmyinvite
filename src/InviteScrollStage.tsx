import {useEffect, useRef} from 'react';
import * as THREE from 'three';

type Props = {
  templateId: string;
  photos?: string[];
  active: boolean;
  /** 0–1 scroll progress through the invite body */
  progress: number;
};

/**
 * Fixed Three.js depth stage behind invite chapters.
 * Plate / photo planes drift with scroll progress (Boat-style atmosphere).
 */
export default function InviteScrollStage({templateId, photos = [], active, progress}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    if (!active) return;
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Skip WebGL on very small / low-power when Save-Data is on
    if (typeof navigator !== 'undefined' && (navigator as Navigator & {connection?: {saveData?: boolean}}).connection?.saveData) return;

    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'});
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
    camera.position.z = 6;

    const loader = new THREE.TextureLoader();
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const planes: THREE.Mesh[] = [];

    const urls = [
      `/assets/${templateId}-section-1.jpg`,
      `/assets/${templateId}-section-3.jpg`,
      `/assets/${templateId}-section-5.jpg`,
      `/assets/${templateId}.jpg`,
      ...photos.slice(0, 2),
    ].filter(Boolean);

    const makePlane = (tex: THREE.Texture, depth: number, scale: number) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      textures.push(tex);
      const geo = new THREE.PlaneGeometry(4.2 * scale, 7.2 * scale);
      geometries.push(geo);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
      materials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = depth;
      mesh.userData.baseZ = depth;
      mesh.userData.phase = Math.random() * Math.PI * 2;
      scene.add(mesh);
      planes.push(mesh);
    };

    let pending = urls.length;
    const maybeDone = () => {
      pending -= 1;
    };

    urls.forEach((url, i) => {
      loader.load(
        url,
        (tex) => {
          makePlane(tex, -1.2 - i * 0.55, 1 - i * 0.06);
          maybeDone();
        },
        undefined,
        () => maybeDone(),
      );
    });

    // Soft ambient fog of gold-tint planes if textures fail
    if (!urls.length) {
      const geo = new THREE.PlaneGeometry(5, 8);
      geometries.push(geo);
      const mat = new THREE.MeshBasicMaterial({color: 0xc9a24a, transparent: true, opacity: 0.08});
      materials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = -2;
      mesh.userData.baseZ = -2;
      mesh.userData.phase = 0;
      scene.add(mesh);
      planes.push(mesh);
    }

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let frame = 0;
    let last = performance.now();
    const animate = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const p = progressRef.current;
      camera.position.y = THREE.MathUtils.damp(camera.position.y, (p - 0.5) * 1.4, 3.2, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, 6 - p * 1.8, 3.2, dt);
      camera.rotation.z = THREE.MathUtils.damp(camera.rotation.z, (p - 0.5) * 0.04, 2.5, dt);

      planes.forEach((mesh, i) => {
        const baseZ = mesh.userData.baseZ as number;
        const phase = mesh.userData.phase as number;
        mesh.position.z = baseZ + p * (0.8 + i * 0.15);
        mesh.position.x = Math.sin(now * 0.00015 + phase) * 0.12 + (i % 2 ? 0.25 : -0.25) * p;
        mesh.rotation.z = Math.sin(now * 0.0002 + phase) * 0.03;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.12 + (1 - Math.abs(p - i / Math.max(planes.length, 1))) * 0.18;
      });

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [active, templateId, photos]);

  if (!active) return null;
  return <div ref={hostRef} className="invite-scroll-stage" aria-hidden="true" />;
}
