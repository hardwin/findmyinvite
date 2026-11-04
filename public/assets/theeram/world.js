// Theeram's backwater: the stops along the canal, in sailing order, and the banks around them.
// Units are metres; the canal runs along −z from the gatehouse, WATER_W (6.4 m) wide, so its banks start 3.2 m from the
// middle. Stops alternate sides (left, right, left …), so the boat always zigzags. Each stop: its cut-out, how tall it
// stands (h, metres, so the couple are about 1.75 m), how far from the canal's middle (x), whether it floats on the water,
// and where the camera holds.
export const GAP = 11;            // metres between stops along the canal
export const GATE_GAP = 6.5;      // from the gatehouse to the first stop
export const EYE = 1.45;          // the guest's eye height, standing in the boat

export const STOPS = {
  welcome:    { cut: "s_jetty",     h: 2.35, x: 2.9,  cam: { back: 4.6, across: .9, look: 1.6 }, shower: 24 },
  story:      { cut: "s_vallam",    h: 2.0,  x: 1.2,  float: true, cam: { back: 5.0, across: .7, look: 1.0 } },
  engagement: { cut: "s_veranda",   h: 2.1,  x: 3.9,  cam: { back: 5.2, across: 1.0, look: 1.5 } },
  wedding:    { cut: "s_mandapam",  h: 2.2,  x: 4.0,  cam: { back: 5.6, across: 1.0, look: 1.55 }, shower: 30 },
  reception:  { cut: "s_houseboat", h: 4.0,  x: 2.8,  float: true, cam: { back: 10.5, across: 1.4, look: 1.9 }, shower: 20 },
  end:        { cut: "s_nets",      h: 4.7,  x: 3.8,  cam: { back: 7.2, across: 1.0, look: 2.2 }, shower: 30 },
  // the last stop: a clay diya on a lotus leaf, floating in the middle of the canal; hold it to light it and float it away
  wishes:     { lamp: { size: 1.3, wick: [.69, .25] }, x: 0, cam: { back: 3.2, across: 0, look: .55 } },   // size: the leaf's width (m); wick: where the flame sits on the picture
};

// the banks around the canal (scattered with a fixed seed, kept clear of the stops and of the camera's view)
export const DECOR = {
  trees: ["k_palm", "k_palm", "k_banana"], treeH: [5.0, 8.5], treeX: [4.3, 11], treeStep: 3.0,
  bush: "k_bush", bushH: [.55, .85], bushX: [3.5, 4.4], bushStep: 2.6,
  lily: "k_lily", lilyH: .32, lilyX: [1.9, 2.8], lilyStep: 4.2,
  arch: null, archH: 3.4, archW: 2.6, archSpacing: 2.6, archCount: 0,
  gopuram: { cut: null, h: 0, beyond: 0 },
};
