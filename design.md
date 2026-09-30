# Opening visual direction

Concept: the user's two photographic reference states become a tangible, inspectable Three.js puzzle beside them.

1920x1080, 30 fps, 45 seconds. Teaching bench palette inherited from 7Segment: background #091321, surfaces #101f30, foreground #edf4fc, secondary #a8b9cd, mint #77edcc, amber #ffc878, divider #33495e. The model sits on a pale #e1e9ed field so its blue shell and channels read as in the source. Preserve all original model materials and lighting colors. No decorative ambient movement while demonstrating mechanics.

Fonts: local Teaching Sans (Segoe UI) and Teaching Mono (Consolas), reused from 7Segment. Title 54px, panel headings 30px, stage title 32px, labels 22px, subtitles 34px. Main title and subtitle remain separate. Flat panels, 20px corner radius, no decorative shadows. Model casts its own local contact shadows in face-on views.

Layout: title across top, reference column left (548px), 40px gutter, animated result on right (1188px). Reference is fully visible, not cropped. Captions reserved at y950–1040, centered with a two-line maximum. Image and 3D canvas stay above y900. Reference state highlights are borders outside the photo, never overlays obscuring it.

Motion: source-derived rigid pivots and slot permutations, deterministic time sampling; discrete-text-sequence for subtitles and stage labels. Brief entry opacity/lift and a final title change. All movement controlled by one paused GSAP timeline. Silence explicitly requested for this review.

## Full tutorial extension

The approved opening stays intact. Eleven teaching scenes use a 1776×680 drawing area beneath a 52px title, a short takeaway at y916, and the same full-width caption band. Diagrams pair with concise code excerpts at 25px. Use distinct, consistent part colors: fixed frame mint #77edcc, rotor amber #ffc878, top half blue #8fc9ff, lower-left violet #b5a7fa, lower-right pink #f3abc5. Diagram grids and shaded interiors may use #1c3042, #2b4355, #21483f and #183d38; active code rows use #243a46. Error examples use #ff9d92. Text on pale model panels uses #32485a. These colors are semantic teaching aids.

Layers use mint for the core, gray-blue #a8b9cd for the recessed bed, blue for the front, and pink for the back. Omit cosmetic screws and raised decorations while layers are separated so viewers can read the structure.
