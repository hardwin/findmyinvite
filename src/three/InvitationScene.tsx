import {useEffect,useRef} from 'react';
import * as THREE from 'three';

/** Coded green-and-gold door panels, matching the reference's procedural gate. */
export default function InvitationScene({open}:{open:boolean}) {
  const host=useRef<HTMLDivElement>(null),opening=useRef(open);
  useEffect(()=>{opening.current=open},[open]);
  useEffect(()=>{
    const container=host.current;if(!container)return;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true})}catch{return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.style.cssText='display:block;width:100%;height:100%';container.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.z=3;
    const pivots=[new THREE.Group(),new THREE.Group()];pivots.forEach(p=>scene.add(p));
    const geometries:THREE.BufferGeometry[]=[],materials:THREE.Material[]=[];
    const green=new THREE.MeshBasicMaterial({color:0x062e24,side:THREE.DoubleSide});materials.push(green);
    const gold=new THREE.LineBasicMaterial({color:0xb39754,transparent:true,opacity:.32});materials.push(gold);
    const line=(points:THREE.Vector3[],group:THREE.Group)=>{const geometry=new THREE.BufferGeometry().setFromPoints(points);geometries.push(geometry);group.add(new THREE.Line(geometry,gold));};
    const resize=()=>{
      const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
      geometries.splice(0).forEach(g=>g.dispose());pivots.forEach(p=>p.clear());
      const height=2*camera.position.z*Math.tan(THREE.MathUtils.degToRad(20)),width=height*camera.aspect,half=width/2;
      pivots.forEach((pivot,index)=>{
        const sign=index===0?1:-1;pivot.position.x=index===0?-half:half;
        const geometry=new THREE.PlaneGeometry(half,height);geometries.push(geometry);
        const panel=new THREE.Mesh(geometry,green);panel.position.x=sign*half/2;pivot.add(panel);
        const inset=Math.min(.045,half*.08),outer=sign*inset,inner=sign*(half-inset),top=height/2-inset;
        line([new THREE.Vector3(outer,-top,.006),new THREE.Vector3(inner,-top,.006),new THREE.Vector3(inner,top,.006),new THREE.Vector3(outer,top,.006),new THREE.Vector3(outer,-top,.006)],pivot);
        // Fine nested corner arcs are geometry, not replacement image assets.
        for(const vertical of [-1,1])for(const radius of [.14,.2]){
          const points=[];for(let n=0;n<=32;n++){const a=n/32*Math.PI/2;points.push(new THREE.Vector3(sign*(inset+radius*Math.cos(a)),vertical*(top-radius*Math.sin(a)),.01));}line(points,pivot);
        }
      });
    };
    const observer=new ResizeObserver(resize);observer.observe(container);resize();
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,last=performance.now(),angle=0;
    const animate=(now:number)=>{const delta=Math.min((now-last)/1000,.1);last=now;const target=opening.current?Math.PI*.52:0;angle=reduced.matches?target:THREE.MathUtils.damp(angle,target,3.8,delta);pivots[0].rotation.y=-angle;pivots[1].rotation.y=angle;renderer.render(scene,camera);frame=requestAnimationFrame(animate)};
    frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove()};
  },[]);
  return <div ref={host} aria-hidden="true" style={{width:'100%',height:'100%',pointerEvents:'none'}}/>;
}
