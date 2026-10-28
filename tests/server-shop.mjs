import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('homepage is the shop, not a marketing landing',async()=>{
 const home=await readFile(new URL('../src/Home.tsx',import.meta.url),'utf8');
 const shop=await readFile(new URL('../src/Storefront.tsx',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
 assert.match(home,/from '\.\/Storefront'/);
 assert.match(shop,/Holy Matrimony/);
 assert.match(shop,/shopKinds/);
 const catalog=await readFile(new URL('../src/shop.ts',import.meta.url),'utf8');
 assert.match(catalog,/Wedding Websites/);
 assert.match(catalog,/Wedding Invitation Videos/);
 assert.match(shop,/fmi-shop-filters/);
 assert.match(shop,/Use this design/);
 assert.equal(shop.includes('/akay'),false);
 assert.equal(shop.includes('/assembly'),false);
 assert.match(app,/path==='\/'\|\|path==='\/templates'\?<Storefront\/>/);
});

test('Create charges Razorpay before the public page exists',async()=>{
 const editor=await readFile(new URL('../src/studio/TextEditor.tsx',import.meta.url),'utf8');
 const checkout=await readFile(new URL('../src/payments.ts',import.meta.url),'utf8');
 const payments=await readFile(new URL('../api/payments.mjs',import.meta.url),'utf8');
 const studio=await readFile(new URL('../api/studio.mjs',import.meta.url),'utf8');
 assert.match(editor,/>Create </);
 assert.match(editor,/ensureWebsitePayment/);
 assert.match(editor,/Copy link/);
 assert.match(checkout,/\/api\/create-order/);
 assert.match(checkout,/\/api\/verify-payment/);
 assert.match(checkout,/\/api\/payments\?action=resume/);
 assert.match(checkout,/payment\.failed/);
 assert.equal(checkout.includes('requestSignIn'),false);
 assert.equal(editor.includes('requestSignIn'),false);
 assert.match(payments,/razorpay/);
 assert.match(payments,/action==='resume'/);
 assert.match(studio,/requireCapturedPayment/);
 assert.equal(editor.includes('Publish invitation'),false);
});
