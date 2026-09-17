import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTemplate, genericCode, draftData, SECTIONS} from '../server/studio-policy.mjs';
import {teamCookie, isTeam, requireTeam, equalSecret, sameOrigin} from '../server/studio-auth.mjs';

const baseline = `<!doctype html><html><head><meta charset="utf-8"><style>body{color:#222}</style></head><body>
${SECTIONS.map(id => `<section data-section="${id}" id="${id}"></section>`).join('')}
<span data-field="bride">Bride</span><span data-field="groom">Groom</span>
<span data-field="date">2026-12-12</span><span data-field="venue">The garden</span>
<img data-photo="0" src="/assets/temple/couple.webp" alt="Couple">
<button onclick="document.getElementById('hero').scrollIntoView()">Start</button>
<script>window.templateReady=true;</script></body></html>`;
const add = html => baseline.replace('</body>', `${html}</body>`);
const invalid = fn => assert.throws(fn, error => error.status === 400);
const partial = {timeline: [], preEvents: []};

test('policy accepts baseline and bounded visual edits while keeping sections and bindings', () => {
  const output = validateTemplate(baseline.replace('color:#222', 'color:#123456;padding:24px').replace('alt="Couple"', 'alt="Wedding couple"'), baseline);
  assert.match(output, /color:#123456/);
  for (const section of SECTIONS) assert.ok(output.includes(`data-section="${section}"`));
  for (const field of ['bride', 'groom', 'date', 'venue']) assert.ok(output.includes(`data-field="${field}"`));
});

test('policy rejects added executable scripts, event handlers and embedded documents', () => {
  for (const payload of [
    '<script>alert(1)</script>', '<img src="/assets/a.png" onerror="alert(1)">',
    '<iframe src="/assets/a.html"></iframe>', '<object data="/assets/a.html"></object>',
    '<embed src="/assets/a.html">', '<base href="https://evil.example/">',
    '<meta http-equiv="refresh" content="0;url=https://evil.example">',
    '<meta name="referrer" content="unsafe-url">',
    '<form action="https://evil.example"><input name="secret"></form>',
    '<svg><a href="#hero"><animate attributeName="href" values="javascript:alert(1)"/></a></svg>',
    '<div srcdoc="<script>alert(1)</script>"></div>',
  ]) invalid(() => validateTemplate(add(payload), baseline));
});

test('baseline script cannot acquire a source, change execution type or run a second time', () => {
  invalid(() => validateTemplate(baseline.replace('<script>', '<script src="/assets/injected.js">'), baseline));
  invalid(() => validateTemplate(baseline.replace('<script>', '<script type="module">'), baseline));
  invalid(() => validateTemplate(add('<script>window.templateReady=true;</script>'), baseline));
});

test('policy rejects external assets and executable or external styles', () => {
  for (const payload of [
    '<img src="https://evil.example/a.png">', '<video poster="https://evil.example/a.jpg"></video>',
    '<style>@import "https://evil.example/a.css";</style>',
    '<style>body{background:url(https://evil.example/a.png)}</style>',
    '<div style="background:expression(alert(1))"></div>',
    '<a href="javascript:alert(1)">Click</a>',
    String.raw`<style>body{background:u\72l(https://evil.example/a.png)}</style>`,
    String.raw`<style>@im\70ort "https://evil.example/a.css";</style>`,
    '<img src="/assets/../api/private">',
  ]) invalid(() => validateTemplate(add(payload), baseline));
});

test('alternate asset attributes cannot bypass the local asset restriction', () => {
  invalid(() => validateTemplate(add('<img src="/assets/a.png" srcset="https://evil.example/a.png 2x">'), baseline));
  invalid(() => validateTemplate(add('<svg><image xlink:href="https://evil.example/a.png"></image></svg>'), baseline));
});

test('map links use actual Google map hosts rather than lookalike host prefixes', () => {
  assert.doesNotThrow(() => validateTemplate(add('<a href="https://www.google.com/maps?q=Chennai">Map</a>'), baseline));
  invalid(() => validateTemplate(add('<a href="https://maps.google.com.evil.example/">Map</a>'), baseline));
});

test('removing a required section or binding is rejected', () => {
  invalid(() => validateTemplate(baseline.replace('data-section="venue"', 'data-section="other"'), baseline));
  invalid(() => validateTemplate(baseline.replace('data-field="bride"', 'data-field="other"'), baseline));
});

test('generic code removes bound personal text and photo source but retains bindings', () => {
  const output = genericCode(baseline.replace('>Bride<', '>Private Person<'));
  assert.doesNotMatch(output, /Private Person|2026-12-12|The garden|src="\/assets\/temple\/couple.webp"/);
  assert.match(output, /data-field="bride"/);
  assert.match(output, /data-photo="0"/);
});

test('partial drafts accept empty optional details without inventing event values', () => {
  const data = draftData(partial, 'emerald-noir');
  assert.equal(data.bride, ''); assert.equal(data.date, ''); assert.equal(data.time, '');
  assert.equal(data.template, 'emerald-noir'); assert.deepEqual(data.photos, []);
  assert.deepEqual(data.timeline, []);
});

test('draft dates and times reject impossible calendar dates and malformed times', () => {
  for (const date of ['2026-02-30', '2026-13-01', '2026-00-01', '2026-1-01', '2025-02-29']) {
    invalid(() => draftData({...partial, date}, 'emerald-noir'));
  }
  assert.equal(draftData({...partial, date: '2028-02-29', time: '23:59'}, 'emerald-noir').date, '2028-02-29');
  for (const time of ['24:00', '12:60', 'midnight']) invalid(() => draftData({...partial, time}, 'emerald-noir'));
});

test('draft event rows permit postponed empty time but reject malformed or impossible time', () => {
  const event = {title: 'Reception', time: '', description: ''};
  assert.equal(draftData({...partial, timeline: [event]}, 'emerald-noir').timeline[0].time, '');
  for (const time of ['not-a-date', '2026-02-30T12:00', '2026-12-01T25:00']) {
    invalid(() => draftData({...partial, timeline: [{...event, time}]}, 'emerald-noir'));
  }
  invalid(() => draftData({...partial, timeline: [null]}, 'emerald-noir'));
});

test('draft photos are limited to four library assets with invalid supplied values rejected', () => {
  const photos = ['/assets/temple/couple.webp', '/assets/photo.jpg'];
  assert.deepEqual(draftData({...partial, photos}, 'emerald-noir').photos, photos);
  for (const photos of [['https://evil.example/a.png'], ['data:image/png;base64,AAAA'], ['/api/media?slug=test&slot=0'], Array(5).fill('/assets/a.jpg'), 'not-an-array']) {
    invalid(() => draftData({...partial, photos}, 'emerald-noir'));
  }
});

test('draft rejects unsupported music and oversized text fields', () => {
  assert.equal(draftData({...partial, music: '/assets/temple/invite-bg.mp3'}, 'royal-temple').music, '/assets/temple/invite-bg.mp3');
  invalid(() => draftData({...partial, music: 'https://evil.example/a.mp3'}, 'emerald-noir'));
  invalid(() => draftData({...partial, bride: 'x'.repeat(101)}, 'emerald-noir'));
});

test('team cookie round-trips through real browser cookie formatting, expires and rejects tampering', t => {
  const previous = process.env.STUDIO_TEAM_KEY;
  const vercel = process.env.VERCEL;
  process.env.STUDIO_TEAM_KEY = 'test-studio-team-access-secret'; process.env.VERCEL = '1';
  let now = Date.now(); t.mock.method(Date, 'now', () => now);
  try {
    const value = teamCookie();
    assert.match(value, /; HttpOnly; SameSite=Strict; Path=\/; Max-Age=43200; Secure$/);
    const cookie = value.split(';')[0];
    const req = {headers: {cookie: `unrelated=one; ${cookie}; last=two`}};
    assert.equal(isTeam(req), true); assert.doesNotThrow(() => requireTeam(req));
    assert.equal(isTeam({headers: {cookie: cookie.replace(/.$/, cookie.endsWith('a') ? 'b' : 'a')}}), false);
    assert.equal(isTeam({headers: {cookie: 'fmi_studio=not-a-valid-cookie'}}), false);
    assert.equal(isTeam({headers: {}}), false);
    now += 12 * 3600000 + 1;
    assert.equal(isTeam(req), false); assert.throws(() => requireTeam(req), {status: 401});
    delete process.env.STUDIO_TEAM_KEY; assert.equal(isTeam(req), false);
  } finally {
    t.mock.restoreAll();
    if (previous === undefined) delete process.env.STUDIO_TEAM_KEY; else process.env.STUDIO_TEAM_KEY = previous;
    if (vercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = vercel;
  }
});

test('secret comparison and same-origin checks reject missing keys and foreign hosts', () => {
  assert.equal(equalSecret('', ''), false); assert.equal(equalSecret('same', 'same'), true); assert.equal(equalSecret('one', 'two'), false);
  assert.doesNotThrow(() => sameOrigin({headers: {host: 'findmyinvite.com', origin: 'https://findmyinvite.com'}}));
  assert.throws(() => sameOrigin({headers: {host: 'findmyinvite.com', origin: 'https://evil.example'}}), {status: 403});
});
