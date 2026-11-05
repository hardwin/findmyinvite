// The rooms, front to back. id = the scene it shows; a scene the couple has no content for is skipped (invite.js),
// and the walk goes straight from the room before it to the room after it. Each painting is hung with its horizon (hz) at eye level; its floor meets the back wall at
// row fl, so everything painted below that folds down into a real floor. door = the far doorway's centre (u, v) and
// db = its threshold row: the next room's floor continues from that threshold. cast: u, v = where the feet are on the
// painting (they stand on the real floor there); sh = how tall it looks from the reference eye (share of the painting's
// height); ground = where it touches the floor, up from the image's bottom. tint / rim = the room's light on the people.
export const ROOMS = [
  { id: "welcome", plate: "p0_facade", mask: true, hz: .48, fl: .572, door: [.5, .461], db: .572, hud: "#fff1cc", tint: "#ffe0b0", rim: "#ffe8c0", cast: [] },
  { id: "engagement", plate: "p1_home", mask: true, hz: .36, fl: .488, door: [.5, .371], db: .488, hud: "#fff1cc", tint: "#ffd2a0", rim: "#ffe4b0",
    cast: [{ img: "c1_engage", u: .5, v: .58, sh: .3, shadowW: 1.0, shadowD: .4, shadowO: .65, couple: true }] },
  { id: "story", plate: "p2_garden", mask: true, hz: .44, fl: .532, door: [.5, .433], db: .532, frame: "f2_arch", frameZ: 0, frameScale: 1.55, hud: "#fff1cc",
    tint: "#ffcf90", rim: "#ffe2a0",
    cast: [{ img: "c2_bench", u: .5, v: .73, sh: .27, shadowD: .4, couple: true }] },
  { id: "wedding", plate: "p3_mandapam", mask: true, hz: .42, fl: .52, door: [.5, .399], db: .52, frame: "f3_pillars", frameZ: 0, frameScale: 1.55, hud: "#fff1cc",
    tint: "#ffe0b0", rim: "#fff0c8",
    cast: [
      { img: "c9_family", u: .5, v: .566, sh: .172, shadowD: .25, shadowO: .45 },
      { img: "c8_ceremony", u: .5, v: .625, sh: .165, shadowD: .35, couple: true, nod: false }   // muhurtham: blinking only,
    ],
    fire: { of: "c8_ceremony", x: -.035, y: .36 } },
  { id: "reception", plate: "p4_reception", mask: true, hz: .33, fl: .47, door: [.5, .346], db: .47, frame: "f4_flowers", frameZ: 0, frameScale: 1.55, hud: "#fff1cc", sparkle: true,
    tint: "#ffd8cc", rim: "#fff2d8",
    cast: [{ img: "c6_sofa", u: .5, v: .518, sh: .21, shadowW: 1.15, shadowD: .5, shadowO: .8, couple: true }] },
  { id: "end", plate: "p5_road", mask: false, hz: .5, fl: .616, door: [.5, .5], db: .6, hud: "#fff1cc", sparkle: true,
    tint: "#efb8c4", rim: "#ffc890",
    cast: [{ img: "c7_car", u: .5, v: .8, sh: .3, car: true, zEnd: -5.95, ground: .295, shadowW: .9, shadowD: .3, shadowO: .6 }],
    sign: { u: .5, v: .558, w: .25 } },
];
