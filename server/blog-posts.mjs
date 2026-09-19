import {readdir,readFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {databaseConfigured,db} from './core.mjs';
export const BLOG_SLUG=/^[a-z0-9]+(-[a-z0-9]+)*$/;
export const BLOG_DIR=join(dirname(fileURLToPath(import.meta.url)),'..','content','blog');
export const FILE_SOURCES=/\.(md|json)$/;
function unquote(value){
 const text=String(value||'').trim();
 if((text.startsWith('"')&&text.endsWith('"'))||(text.startsWith("'")&&text.endsWith("'")))return text.slice(1,-1);
 return text;
}
export function normalizePost(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const slug=unquote(input.slug);
 if(!BLOG_SLUG.test(slug))return null;
 const title=unquote(input.title);
 const body=String(input.body||'').trim();
 if(!title||!body)return null;
 const excerpt=unquote(input.excerpt||input.description);
 const description=unquote(input.description||input.excerpt);
 const published=input.published===true||input.published==='true';
 const publishedAt=unquote(input.published_at||input.publishedAt);
 if(published&&!publishedAt)return null;
 const h1=unquote(input.h1)||title.replace(/\s*\|\s*FindMyInvite\s*$/,'').trim()||title;
 return {slug,title,h1,excerpt,description:description||excerpt,body,published,publishedAt};
}
export function parseMarkdownPost(raw){
 const match=String(raw).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
 if(!match)return null;
 const meta={};
 for(const line of match[1].split(/\r?\n/)){
  const index=line.indexOf(':');
  if(index<1)continue;
  meta[line.slice(0,index).trim()]=unquote(line.slice(index+1));
 }
 return normalizePost({...meta,body:match[2].trim()});
}
export function isPublished(post,now=Date.now()){
 if(!post||!post.published||!post.publishedAt)return false;
 const at=Date.parse(post.publishedAt);
 return Number.isFinite(at)&&at<=now;
}
export async function loadFilePosts(){
 let names=[];
 try{names=await readdir(BLOG_DIR);}catch{return [];}
 const posts=[];
 for(const name of names){
  if(!FILE_SOURCES.test(name))continue;
  try{
   const raw=await readFile(join(BLOG_DIR,name),'utf8');
   const post=name.endsWith('.json')?normalizePost(JSON.parse(raw)):parseMarkdownPost(raw);
   if(post)posts.push(post);
  }catch{}
 }
 return posts;
}
export async function loadDatabasePosts(){
 if(!databaseConfigured())return [];
 try{
  const rows=await db('blog_posts?published=eq.true&published_at=lte.'+encodeURIComponent(new Date().toISOString())+'&select=slug,title,excerpt,body,published_at&order=published_at.desc&limit=50');
  return (Array.isArray(rows)?rows:[]).map(row=>normalizePost({...row,published:true,publishedAt:row.published_at})).filter(Boolean);
 }catch{return [];}
}
export function mergePosts(filePosts,databasePosts,now=Date.now()){
 const bySlug=new Map();
 for(const post of databasePosts||[])if(isPublished(post,now))bySlug.set(post.slug,post);
 for(const post of filePosts||[])if(isPublished(post,now))bySlug.set(post.slug,post);
 return [...bySlug.values()].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,50);
}
export async function publishedPosts(now=Date.now()){
 const [files,rows]=await Promise.all([loadFilePosts(),loadDatabasePosts()]);
 return mergePosts(files,rows,now);
}
export async function publishedPost(slug,now=Date.now()){
 if(typeof slug!=='string'||!BLOG_SLUG.test(slug))return null;
 return (await publishedPosts(now)).find(post=>post.slug===slug)||null;
}
export function publicPost(post){
 if(!post)return null;
 return {slug:post.slug,title:post.title,excerpt:post.excerpt,body:post.body,publishedAt:post.publishedAt};
}
