// Reads one couple's invitation data (data.js shape) and works out everything the page shows: which temple stops the walk
// goes through, every line of text in each language, calendar times, the countdown, links, the blessing counter's address and
// the link preview. No page code in here, so it also runs in node (tests/check.mjs).
import { WORDS, CAL } from "./i18n.js";

// the temple stops in walking order (world.js has one entry per stop): the carved gateway, the pillared corridor (story),
// the temple tank (engagement), the mandapam (wedding), the chariot (reception), the deepa stambham (thank you), the lamp
export const ALL_SCENES = ["welcome", "story", "engagement", "wedding", "reception", "end", "wishes"];
export const LANGS = ["en","ml","ta","te","kn","hi"];
const TYPES = ["engagement", "wedding", "reception", "other"];

const pad = (n) => String(n).padStart(2, "0");
const SEP = " · ";   // " · " that never starts a line: a long line breaks after the dot
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? "");
// strip control characters and angle brackets, trim, cap the length (text is always set as text, never as HTML)
const clean = (s, max = 200) => String(s ?? "").replace(/[\u0000-\u0009\u000b-\u001f\u007f<>]/g, "").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim().slice(0, max);
// a value given as plain text or per language ({ en, ta }) → the text for one language (falls back to the other)
function pick(v, lang, max) {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return clean(v, max);
  if (Array.isArray(v)) return v.map((x) => pick(x && typeof x === "object" && "text" in x ? x.text : x, lang, max)).filter(Boolean).join("\n");
  if (typeof v === "object") return clean(v[lang] ?? v.en ?? v.ta ?? Object.values(v).find((x) => typeof x === "string") ?? "", max);
  return "";
}
const hasLang = (v, lang) => v != null && (typeof v === "string" ? !!v.trim() : typeof v === "object" && typeof v[lang] === "string" && !!v[lang].trim());

function parseDate(s) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(s || "").trim()); if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3], dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { y, m: mo, d, wd: dt.getUTCDay() };
}
function parseTime(s) {
  const m = /^(\d{1,2})[:.](\d{2})/.exec(String(s || "").trim()); if (!m) return null;
  const h = +m[1], mi = +m[2]; return h > 23 || mi > 59 ? null : { h, mi };
}
function parseTz(s) {
  const m = /^([+-])(\d{1,2}):?(\d{2})$/.exec(String(s || "").trim()); if (!m) return 330;   // India by default
  return (m[1] === "-" ? -1 : 1) * (+m[2] * 60 + +m[3]);
}
// local wall time → a moment (ms), and the calendar's UTC stamp (20270214T043000Z)
const msAt = (D, t, tz) => Date.UTC(D.y, D.m - 1, D.d, t ? t.h : 0, t ? t.mi : 0) - tz * 60000;
const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// ---------- dates and times, by hand in both languages ----------
// the day and its month never part at a line break ("12 September" stays together)
const dateLong = (D, l, year = true) => `${CAL[l].days[D.wd]}, ${D.d}\u00a0${CAL[l].months[D.m - 1]}${year ? " " + D.y : ""}`;
const dateShort = (D) => `${pad(D.d)}${SEP}${pad(D.m)}${SEP}${D.y}`;
const hm = (t, mins) => `${t.h % 12 || 12}${mins ? ":" + pad(t.mi) : ""}`;
const mer = (t) => (t.h < 12 ? "AM" : "PM");
// Malayalam and Tamil say the part of the day before the time (രാവിലെ 10:30, காலை 10:30) and "o'clock" on a whole hour.
// The part of the day and its time are held together with a no-break space, so they never part at a line break.
const PART = {
  ml: { at: ["രാത്രി", "പുലർച്ചെ", "രാവിലെ", "ഉച്ചയ്ക്ക്", "വൈകുന്നേരം", "രാത്രി"], oclock: " മണി" },
  ta: { at: ["இரவு", "அதிகாலை", "காலை", "மதியம்", "மாலை", "இரவு"], oclock: " மணி" },
  te: { at: ["రాత్రి", "తెల్లవారుజామున", "ఉదయం", "మధ్యాహ్నం", "సాయంత్రం", "రాత్రి"], oclock: " గంటలకు" },
  kn: { at: ["ರಾತ್ರಿ", "ಮುಂಜಾನೆ", "ಬೆಳಗ್ಗೆ", "ಮಧ್ಯಾಹ್ನ", "ಸಂಜೆ", "ರಾತ್ರಿ"], oclock: " ಗಂಟೆಗೆ" },
  hi: { at: ["रात", "भोर", "सुबह", "दोपहर", "शाम", "रात"], oclock: " बजे" },
};
const part = (t, l) => PART[l].at[t.h < 4 ? 0 : t.h < 6 ? 1 : t.h < 12 ? 2 : t.h < 15 ? 3 : t.h < 20 ? 4 : 5];
const NB = "\u00a0";
function timeText(a, b, l, W, exact) {
  if (!a) return "";
  const ind = !!PART[l], at = (t, mins) => `${part(t, l)}${NB}${hm(t, mins)}`;
  if (!b && exact) return ind ? `${at(a, !!a.mi)}${a.mi ? "" : PART[l].oclock}` : `${hm(a, !!a.mi)}${NB}${mer(a)}`;   // a muhurtham is a moment, never "onwards"
  const mins = !!(a.mi || (b && b.mi));
  if (ind) {
    if (!b) return fill(W.onwards, { t: `${at(a, mins)}${a.mi ? "" : PART[l].oclock}` });
    return part(a, l) === part(b, l) ? `${at(a, mins)} – ${hm(b, mins)}` : `${at(a, mins)} – ${at(b, mins)}`;
  }
  if (!b) return fill(W.onwards, { t: `${hm(a, mins)}${NB}${mer(a)}` });
  return mer(a) === mer(b) ? `${hm(a, mins)} – ${hm(b, mins)}${NB}${mer(b)}` : `${hm(a, mins)}${NB}${mer(a)} – ${hm(b, mins)}${NB}${mer(b)}`;
}

// an event's type, from `type`, or guessed from its name (so the website's plain event list also works)
function typeOf(e) {
  if (TYPES.includes(e.type)) return e.type;
  const n = JSON.stringify(e.name ?? "").toLowerCase();
  if (/engage|nischay|nichay|நிச்சய/.test(n)) return "engagement";
  if (/recep|வரவேற்பு/.test(n)) return "reception";
  if (/wedding|marriage|muhurt|kalyan|thaali|தாலி|திருமண|முகூர்த்த|கல்யாண/.test(n)) return "wedding";
  return "other";
}
const mapLink = (q) => (/^https:\/\//.test(q) ? q : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q));
// a site address the page may talk to: same site (/…), https, or a local test server; never another site via //
const siteUrl = (s) => (s && /^(https:\/\/|\/(?!\/)|http:\/\/localhost[:/])/.test(s.url || "")
  ? { url: String(s.url), token: /^[A-Za-z0-9]{32}$/.test(s.token || "") ? s.token : "", demo: !!s.demo } : null);

export function readInvite(raw = {}) {
  const warn = [];
  if (!raw || typeof raw !== "object") raw = {};
  if (!raw.nameOrder && raw.name_order) raw = { ...raw, nameOrder: raw.name_order };   // the website's spelling
  const tz = parseTz(raw.timezone);
  let language = LANGS.includes(raw.language) ? raw.language : "en";
  const languages = (Array.isArray(raw.languages) ? raw.languages : [language]).filter((l) => LANGS.includes(l));
  if (!languages.includes(language)) languages.unshift(language);
  // offer a second language only if the names really exist in it
  const langs = languages.filter((l) => l === language || (hasLang(raw.bride, l) && hasLang(raw.groom, l)));
  if (langs.length < languages.length) warn.push("a language was dropped from the switch: the names are not filled in for it");

  // ---------- events ----------
  const events = [];
  (Array.isArray(raw.events) ? raw.events : []).forEach((e, n) => {
    if (!e || typeof e !== "object") return;
    let date = e.date, start = e.start;
    if (!date && e.datetime) { [date, start] = String(e.datetime).split(/[ T]/); }   // the website's "YYYY-MM-DD HH:MM:SS"
    const D = parseDate(date);
    if (!D) { warn.push(`event ${n + 1} skipped: no valid date (YYYY-MM-DD)`); return; }
    const a = parseTime(start), b = parseTime(e.end), type = typeOf(e);
    const t0 = msAt(D, a, tz), t1 = b ? msAt(D, b, tz) + (b.h * 60 + b.mi < (a ? a.h * 60 + a.mi : 0) ? 864e5 : 0) : t0 + (a ? 3 : 24) * 36e5;
    events.push({ n, type, D, a, b, tz, t0, t1, main: !!e.main, raw: e,
      key: `${type}-${n}`, map: clean(e.map || e.map_url || "", 300), cal: [stamp(t0), stamp(t1)] });
  });
  events.sort((x, y) => x.t0 - y.t0);
  const first = (t) => events.find((e) => e.type === t);
  const main = events.find((e) => e.main) || first("wedding") || events[0] || null;
  if (!first("wedding")) warn.push("no wedding event: the mandapam stop is skipped");

  // ---------- which stops the walk goes through ----------
  // welcome and thank-you are always there; story needs a story; engagement / wedding / reception need that event;
  // the blessing lamp is on unless the couple turns it off (wishes: false, or hide: ["wishes"])
  const hide = new Set(Array.isArray(raw.hide) ? raw.hide : []);
  const storyOn = !!pick(raw.story, language, 600);
  const wishesOn = raw.wishes !== false && !hide.has("wishes");
  const scenes = ALL_SCENES.filter((s) => {
    if (s === "welcome" || s === "end") return true;
    if (hide.has(s)) return false;
    if (s === "wishes") return wishesOn;
    return s === "story" ? storyOn : !!first(s);
  });

  // ---------- everything else ----------
  let countdown = main ? main.t0 : 0;
  if (raw.countdown) { const [d, t] = String(raw.countdown).split(/[ T]/), D = parseDate(d); if (D) countdown = msAt(D, parseTime(t), tz); }
  const phone = String(raw.rsvp?.whatsapp ?? raw.rsvpPhone ?? "").replace(/\D/g, "");
  const rsvpPhone = phone.length >= 8 && phone.length <= 15 ? phone : "";
  const m = raw.music, musicSrc = m == null || m === false ? "" : clean(typeof m === "string" ? m : m.src || "", 400);
  // where the song starts (and where it loops back to): seconds, or "1:31"
  const st = m && typeof m === "object" ? String(m.start ?? "") : "", sm = /^(\d+):(\d{1,2})$/.exec(st);
  const musicStart = sm ? +sm[1] * 60 + +sm[2] : Math.max(0, +st || 0);
  // RSVPs saved on the website (the couple's guest list), the same request the site's own invites send:
  // POST <url> {token?, name?, rsvp: {status, party_size, events: {choices: {e0: "yes", …}}}}
  const rsvpSite = siteUrl(raw.rsvp?.site);
  // the wish counter on the website: GET <url> → {count}; POST <url> {token?, n: 1} → {count}. Without it, each phone
  // counts its own blessings (see README.md "Blessing count")
  const wishesSite = wishesOn ? siteUrl(raw.wishes?.site) : null;
  const nameEn = [pick(raw.groom, "en", 40), pick(raw.bride, "en", 40)];
  const slug = (raw.nameOrder === "bride_first" ? nameEn.reverse() : nameEn).join("-").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "invite";

  const model = {
    language, languages: langs, scenes, events, main, countdown, tz, slug, warn,
    rsvpPhone, rsvpSite, wishesSite, music: musicSrc, musicStart,
    shareUrl: /^https?:\/\//.test(raw.share?.url || "") ? String(raw.share.url) : "", guest: clean(raw.guest || "", 40),
    site: clean(raw.site || "findmyinvite.com", 60),
    hasBlessing: !!pick(raw.blessing, language),
    text: (l) => strings(raw, model, l),
  };
  return model;
}

// the story card sits above the couple: a long story (the site's story chapters) keeps whole lines up to ~200 letters,
// so the card never grows down over their faces
function storyFit(t, max = 200) {
  if (t.length <= max) return t;
  let out = "";
  for (const line of t.split("\n")) { if ((out + "\n" + line).length > max) break; out = out ? out + "\n" + line : line; }
  return out || t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}
// every string the page shows, for one language
function strings(raw, M, l) {
  const W = WORDS[l], H = raw.headings || {};
  const head = (k) => pick(H[k], l, 120) || (typeof W[k] === "string" ? W[k] : "");
  const names = raw.nameOrder === "bride_first" ? [raw.bride, raw.groom] : [raw.groom, raw.bride];
  const couple = names.map((v) => pick(v, l, 160)).filter(Boolean).join(W.and);
  const ev = (e) => {
    if (!e) return null;
    const name = pick(e.raw.name, l, 60) || W.types[e.type], tt = pick(e.raw.time, l, 80) || timeText(e.a, e.b, l, W, e.type === "wedding");
    const venue = pick(e.raw.venue, l, 160), place = pick(e.raw.place ?? e.raw.city, l, 160);
    return { key: e.key, type: e.type, name, time: tt, when: pick(e.raw.when, l, 120) || [dateLong(e.D, l, false), tt].filter(Boolean).join(SEP),
      whenFull: [dateLong(e.D, l), tt].filter(Boolean).join(SEP), where: [venue, place].filter(Boolean).join(", "),
      at: [venue, place].filter(Boolean).join(SEP), map: e.map ? mapLink(e.map) : "", cal: e.cal, D: e.D };
  };
  const first = (t) => ev(M.events.find((e) => e.type === t));
  const main = ev(M.main), eng = first("engagement"), wed = first("wedding"), rec = first("reception");
  const titles = {}; for (const s of ALL_SCENES) titles[s] = pick(H["title_" + s], l, 40) || W.titles[s];
  const dateStr = main ? dateLong(main.D, l).replace(/\u00a0/g, " ") : "";   // plain spaces in link previews and share text
  return {
    lang: l, brand: head("brand"), hello: W.hello, names: couple, marrying: head("marrying"), walkIn: head("walkIn"),
    dateShort: main ? dateShort(main.D) : "", blessing: pick(raw.blessing, l, 160),
    storyLabel: head("story"), story: storyFit(pick(raw.story, l, 600)),
    engLabel: head("engagement"), engWhen: eng ? eng.whenFull : "", engWhere: eng ? eng.at : "",
    wedLabel: head("wedding"), wedDate: wed ? `${CAL[l].days[wed.D.wd]}, ${dateShort(wed.D)}` : "",
    wedTime: wed && wed.time ? `${head("muhurtham")}${SEP}${wed.time}` : "", venue: wed ? wed.at : "",
    recLabel: head("reception"), recWhen: rec ? [dateLong(rec.D, l, false), rec.time].filter(Boolean).join(SEP) : "", recWhere: rec ? rec.at : "",
    thanks: head("thanks"), thanksLine: head("thanksLine"),
    wishLabel: head("wishLabel"), wishHow: head("wishHow"), wishCount: W.wishCount, wishOne: W.wishOne,
    wishMsgs: W.wishMsgs.map((s) => fill(s, { couple })),
    units: W.units, btn: W.btn, rsvp: W.rsvp, sheetEvents: W.sheetEvents, titles,
    events: M.events.map(ev), main,
    msgYes: W.msgYes, msgNo: W.msgNo, couple,
    calTitle: (name) => fill(W.calTitle, { event: name, couple }),
    shareText: fill(W.shareText, { couple, date: dateStr }),
    ogTitle: pick(raw.share?.title, l, 120) || fill(W.ogTitle, { couple }),
    ogDesc: pick(raw.share?.description, l, 240) || (main ? fill(W.ogDesc, { event: main.name, date: dateStr, place: main.at }).replace(/ · \./, ".") : ""),
    ogImage: clean(raw.share?.image || "og.jpg", 400),
  };
}
