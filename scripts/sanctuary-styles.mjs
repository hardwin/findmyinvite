// Keep the original CSS declarations used by the imported markup, including
// Tailwind's theme, preflight, properties and media-query containers.
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
const root=path.resolve(import.meta.dirname,'..');
const reference=path.resolve(root,'../../work/reference/royal-sanctuary');
const output=path.join(root,'public/studio/templates/royal-sanctuary.html');
let html=fs.readFileSync(output,'utf8');
const recovered=path.join(root,'public/assets/royal-sanctuary/recovered.css');
if(!fs.existsSync(reference)){
 fs.writeFileSync(output,html.replace('/*SOURCE_CSS*/',fs.readFileSync(recovered,'utf8')));
 process.exit(0);
}
const classes=new Set([...html.matchAll(/class="([^"]*)"/g)].flatMap(m=>m[1].split(/\s+/)));
const escaped=[...classes].filter(Boolean).map(c=>'.'+c.replace(/([^a-zA-Z0-9_-])/g,'\\$1'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/template-imports/royal-sanctuary.assets.json'),'utf8'));
const fonts=new Map(manifest.assets.filter(a=>a.local.endsWith('.woff2')).map(a=>[a.source.split('/').at(-1).split('?')[0],a.local]));
let styles='';
for(const file of ['92bc0ff439aba29d.css','c962c252d868c8e2.css','d384e2c6e254307a.css']){
 const css=postcss.parse(fs.readFileSync(path.join(reference,file),'utf8'));
 css.walkAtRules('import',r=>r.remove());
 css.walkAtRules('font-face',r=>{const src=r.nodes.find(n=>n.prop==='src');const key=src?.value.match(/url\([^)]*\/([^/?)]+)(?:\?[^)]*)?\)/)?.[1];if(!fonts.has(key)){r.remove();return}src.value=`url(${fonts.get(key)}) format('woff2')`;});
 css.walkRules(rule=>{if(rule.parent?.type==='atrule'&&/keyframes$/.test(rule.parent.name))return;const selector=rule.selector||'';if(selector.includes('.')&&!escaped.some(c=>{let at=selector.indexOf(c);while(at>=0){const next=selector[at+c.length];if(!next||!/[a-zA-Z0-9_\\-]/.test(next))return true;at=selector.indexOf(c,at+1)}return false}))rule.remove();});
 css.walkDecls(d=>{if(/url\(/.test(d.value)&&![...d.value.matchAll(/url\(['"]?([^)'"\s]+)/g)].every(m=>m[1].startsWith('/assets/')))d.remove();});
 css.walkAtRules(r=>{if(r.nodes?.length===0)r.remove()});
 styles+=css.toString();
}
html=html.replace('/*SOURCE_CSS*/',styles);
fs.writeFileSync(recovered,styles);
fs.writeFileSync(output,html);
console.log('Localized original stylesheet rules:',styles.length,'characters. Template:',Buffer.byteLength(html),'bytes.');
