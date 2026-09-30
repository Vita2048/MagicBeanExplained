# Magic Bean — full tutorial visual review

Watch it in a browser (no build step): https://vita2048.github.io/MagicBeanExplained/player.html — standalone audio-clock player with the AndrewNeural narration, word-timed subtitles and the full 1080p canvas animation.

8 minutes 27 seconds, 1920×1080, 30 fps. Twelve HyperFrames scenes with en-US-AndrewNeural narration and word-timed subtitles; final MP4 in `renders/`.

Run `npm run dev` for HyperFrames Studio. The graphics and captions are separate timeline tracks. Use Play or scrub the timeline.

Key moments: independent rims at 7 / 10 / 13 seconds; center switch at 16.3; connected chamber circulation at 20; three half-rim flips at 27.2 / 29.7 / 32.2; whole-model inspection at 35–41; construction question at 41.

`scene-template.txt` and `scene.js` own the approved opening. `tutorial-scenes.js` owns the eleven lessons, script cues and visual steps. `teaching-model.js` reuses the real puzzle for the model demonstrations. `teaching-kit.js` contains the diagram primitives and exact mask equations. `puzzle-choreography.js` owns the deterministic movement. `node build.mjs` extracts the real geometry and movement definitions from the original MagicBean source and assembles the full HyperFrames composition. `node build.mjs --opening-only` rebuilds just the opening if needed. Original source is read only. Browser dependencies and reference assets are local in `assets/`.

## Chapters

| Start | Topic |
|---|---|
| 0:00 | Two images become a working puzzle |
| 0:45 | Parts that move together |
| 1:15 | Three lobe centers |
| 1:55 | Inside/outside masks |
| 2:40 | Circular channels |
| 3:20 | Mechanical regions and gaps |
| 4:15 | Contour extraction |
| 5:00 | Extrusion and bevels |
| 5:45 | Layers and pivots |
| 6:25 | Beads and slots |
| 7:05 | Test the geometry through movement |
| 7:55 | Materials and recap |

## Companion lab

Serve this directory with a local static HTTP server, then open `companion/index.html`. The lab steps through centers, body masks, channel subtraction, extrusion and bevels. Adjust R, channel half-width and depth, then choose Rebuild geometry. It demonstrates the raised-face pipeline, while `assets/puzzle.js` contains the full source-derived five-part model and its movement definitions.

Verification: `verify-runtime.mjs` checks the opening movements. `verify-full.mjs` checks Studio timeline registration, full subtitle coverage, six non-sequential rendering states, canvas text extents, and all companion stages plus parameter rebuilding. HyperFrames `check` covers the assembled composition, layout, contrast and timeline assertions. Review PNGs are in `snapshots/` and `verification/`.

Subtitle times are provisional visual-review timings; align to measured narration if audio is later requested.
