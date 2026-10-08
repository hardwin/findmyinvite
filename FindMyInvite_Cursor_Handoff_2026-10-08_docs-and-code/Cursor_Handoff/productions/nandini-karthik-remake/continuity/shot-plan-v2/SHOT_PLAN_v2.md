# Shot Plan Blueprint v2 — MAZE (16:9)

Iterate **this one image** until Ashok confirms. Then stills → video.

## Why v2
v1 read as a linear corridor. Ashok wants a **maze**: every shot is **one adjacent turn** (left / right / forward / pivot-pull). No teleport. No two shots in the same room.

## Rooms (one shot each)
| Shot | Room | Turn from prior | Camera | Characters | Text |
|------|------|-----------------|--------|------------|------|
| S1 | A Palm approach garden | — (start) | In A looking toward B | Empty | — |
| S2 | B Central colonnade courtyard | **FWD** from A | In B looking toward C | Empty | — |
| S3 | C East floral arcade aisle | **RIGHT** from B | In C looking toward F | Empty | — |
| S4 | F Stair cascade court | **FWD** (or L into F) from C | On stairs looking toward E | Empty | — |
| S5 | E Ceremony stage / mandap | **LEFT** from F | Base of stage looking UP | Couple STANDING | Optional names |
| S6 | D Lotus pond photoshoot | **LEFT / PIVOT-PULL** from E | Orbit at pond | Couple STANDING | Nandini ♡ Karthik · 22 Feb 2027 · ITC Grand Chola |

## Maze graph
```
A — B — C
|   |   |
D — E — F
```
Path: **A → B → C → F → E → D** (Hamiltonian; no room reuse).

## Hard rules
1. No two shots in the same room
2. Every hop = one adjacent turn only (L / R / FWD / pivot-pull)
3. Couple stands — camera moves
4. Forbid vista reuse across shots

## Status
**AWAITING_ASHOK_APPROVAL** — artifact: `SHOT_PLAN_BLUEPRINT_16x9_v2.jpg`
