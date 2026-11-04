// Thiruvarul's temple: the stops along the granite walkway, in walking order, and the temple grounds around them.
// Units are metres; the walkway runs along −z from the temple doors. Stops alternate sides (left, right, left …) in the
// order the couple keeps them, so the camera always zigzags. Each stop: its cut-out (set piece + couple), how tall it
// stands (h, metres, so the couple are about 1.75 m), how far from the walkway's centre (x), and where the camera holds.
export const GAP = 10;            // metres between stops along the walkway
export const GATE_GAP = 6;        // from the doors to the first stop
export const EYE = 1.45;          // the guest's eye height

export const STOPS = {
  welcome:    { cut: "s_welcome",  h: 2.1,  x: 1.6,  cam: { back: 4.6, across: .7,  look: 1.72 }, shower: 24 },
  story:      { cut: "s_walk",     h: 1.76, x: .45,  dz: 1.3, cam: { back: 7.4, across: .1, look: 1.62 }, tunnel: true },
  engagement: { cut: "s_tank",     h: 1.93, x: 1.85, cam: { back: 5.0, across: .7,  look: 1.62 } },
  wedding:    { cut: "s_wedding",  h: 1.89, x: 1.85, cam: { back: 5.0, across: .8,  look: 1.25 }, shower: 30 },
  reception:  { cut: "s_chariot",  h: 2.4,  x: 2.0,  cam: { back: 6.2, across: .75, look: 1.72 }, shower: 20 },
  end:        { cut: "s_lamp",     h: 1.94, x: 1.6,  cam: { back: 4.8, across: .7,  look: 1.75 }, shower: 30 },
  // the last stop: a 3D brass kuthuvilakku on a granite plinth; press and hold it to light its five wicks and bless
  wishes:     { lamp: { size: 1.3, plinth: .26 }, x: 0, cam: { back: 5.6, across: 0, look: 1.12 } },   // on the walkway itself, the gopuram straight behind
};

// the temple grounds around the walkway (scattered with a fixed seed, kept clear of the stops and the camera's view)
export const DECOR = {
  trees: ["t_palm", "t_peepal"], treeH: [4.2, 7.0], treeX: [3.4, 10], treeStep: 3.4,
  bush: "t_pots", bushH: [.5, .7], bushX: [1.25, 2.2], bushStep: 2.4,
  arch: "t_pillars", archH: 3.6, archW: 2.6, archSpacing: 2.6, archCount: 5,
  gopuram: { cut: "t_gopuram", h: 19, beyond: 52 },   // the tall temple tower closing the walkway, past the lamp
};
