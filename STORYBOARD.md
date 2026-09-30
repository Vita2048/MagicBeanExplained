# Full tutorial — visual review

Approved opening preserved; all remaining scenes built. Audio and MP4 deferred. Detailed narrative plan: ../STORYBOARD.md.

## Frame 1

status: animated
src: compositions/opening.html
start: 0
duration: 45
rules: discrete-text-sequence; Three.js adapter with source-derived rigid rotations

Two reference states become the animated puzzle.

## Frame 2

status: animated
src: compositions/parts.html
start: 45
duration: 30
rules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter

Start with the parts that move together

Before writing geometry code, decide which parts must move together. This puzzle has a fixed frame, a central rotor, and three outer halves that flip. We give those five structural groups temporary colors so their boundaries are easy to follow. The beads are separate meshes. Removing them reveals the channels underneath. The same layered construction appears on the front and the back.

Takeaway: Five structural groups. Separate beads. One shared coordinate system.

## Frame 3

status: animated
src: compositions/centers.html
start: 75
duration: 40
rules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter

Three centers, placed with sine and cosine

Build the flat drawing in the x-y plane. The z direction will become thickness. Place three lobe centers around the origin, one hundred and twenty degrees apart. Cosine gives the horizontal coordinate; sine gives the vertical coordinate. The angles are ninety, two hundred ten, and three hundred thirty degrees. Here the bead-path radius R is 0.88, and the center distance D is twice R. Draw a bead-path circle at each center. The outer shell will use its own larger radius.

Takeaway: The bead-path radius R and the shell radius are different dimensions.

## Frame 4

status: animated
src: compositions/fields.html
start: 115
duration: 45
rules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter

A function can describe the inside of a shape

Instead of drawing every edge by hand, ask whether a point is inside the shape. For a circle, measure the distance from its center and subtract its radius. A negative result means inside. Zero is the boundary. Positive means outside. Move the test point across the circle and watch the sign change. To combine circles, take the minimum of their values at each point. The body combines three lobe disks with a central disk that connects them. We use the combined function as an inside-outside mask for later construction.

Takeaway: Negative = inside. Zero = boundary. Positive = outside.

## Frame 5

status: animated
src: compositions/channels.html
start: 160
duration: 40
rules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter

Cut a circular channel into the raised face

A bead channel is a band around a circle, not a solid disk. Take the absolute difference between distance and the bead-path radius. Subtract the half-width. The negative region is now a circular band. Combine the bands from all three lobes to describe the complete track. Keep points inside the body and outside the track to form the raised face. This removes the upper material. A separate lower bed becomes the channel floor.

Takeaway: Subtract the channel from the raised face; keep a lower layer as its floor.

## Frame 6

status: animated
src: compositions/regions.html
start: 200
duration: 55
rules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter

Split the body into regions that can move

The outer silhouette is not enough. We must decide which material belongs to each part. A circle around the origin defines the central rotor. A line through each lobe center separates its outer flipping half. A dot product tells us which side of that line a point lies on. Intersect each region with the body. The remaining inner material belongs to the fixed frame. Leave a small gap between neighboring parts so they can move independently. Choose the rotor radius so its boundary falls between beads, rather than cutting through them.

Takeaway: Intersect the body with each part’s region, then leave clearance at every seam.

## Frame 7

status: animated
src: compositions/contours.html
start: 255
duration: 45
rules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter

Turn the zero boundary into a closed outline

Three.js needs an outline that it can turn into a mesh. Our traceShapes helper creates it. Sample the mask on a grid, then split every cell into two triangles. On each edge, compare the signs at its endpoints. A sign change means the boundary crosses. Interpolate between those values to estimate the zero crossing. Join the crossings into closed loops. A finer grid gives a more detailed approximation. Outer loops become Shapes. Enclosed empty loops become Paths in the shape’s holes array. Give hole boundaries the opposite winding direction to the outer contour.

Takeaway: traceShapes is our helper. THREE.Shape and THREE.Path are Three.js classes.

## Frame 8

status: animated
src: compositions/extrusion.html
start: 300
duration: 45
rules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter

Add thickness — without closing the seams

Pass the traced shapes to ExtrudeGeometry to turn the flat outlines into solids. Depth creates the side walls. The front face now has real thickness. Bevel size controls the edge’s sideways extent; bevel thickness controls its depth. Rounded edges look molded, but the bevel can expand beyond the input outline. At a mechanical seam, that expansion can enter the neighboring part’s space. The project insets the mask before beveling, then clamps small boundary overshoots. Recompute the normals after adjusting vertices so the shading matches the final mesh.

Takeaway: Inset first, bevel second, then correct small boundary overshoots.

## Frame 9

status: animated
src: compositions/pivots.html
start: 345
duration: 40
rules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter

Stack the layers around the correct pivot

Each part combines a core, a dark channel bed, and raised face layers. Matching layers sit on both sides, so the puzzle has a front and a back. The pivot determines where a part rotates. It is not always the world origin. Subtract the pivot from the geometry’s vertices to make their coordinates local. Then place the Group at the pivot. Its meshes stay together when that Group rotates. The center turns around z. Each outer half flips around its outward-pointing axis.

Takeaway: Local vertex = world vertex − pivot. Put the Group back at the pivot.

## Frame 10

status: animated
src: compositions/beads.html
start: 385
duration: 40
rules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter

One sphere geometry, many bead positions

Every bead reuses the same SphereGeometry. Materials supply the different colors. There are ten evenly spaced positions around each lobe, so the angular step is thirty-six degrees. Add the circular offset to the lobe center to place each bead. The z coordinate selects the front or the back of the puzzle. Three lobes, ten beads, and two faces give sixty beads altogether. There are also three central pocket slots per face. Some slots are empty in each configuration.

Takeaway: 60 beads occupy 66 possible slots. The six vacancies move with the configuration.

## Frame 11

status: animated
src: compositions/movement.html
start: 425
duration: 50
rules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter

Movement is a test of the geometry

A model that looks correct at rest may still intersect when it moves. Turn the rotor sixty degrees. The plastic and its carried beads share the same rigid rotation. The channels now form a connected chamber. Beads circulate around a thirty-slot route on each face. Keep the discrete puzzle state separate from the animation between positions. When the move finishes, update which bead occupies each destination slot. Now inspect a half-rim flip. Watch the seam and the beads throughout the turn. This is a geometric, kinematic animation. A physics engine is not moving the beads.

Takeaway: Check the entire movement, not just its endpoints.

## Frame 12

status: animated
src: compositions/finish.html
start: 475
duration: 30
rules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter

From flat regions to a finished puzzle

Materials, lighting, and small details give the model its finished appearance. But the reusable construction method is underneath: define flat regions and trace their boundaries. Extrude the outlines, round the edges, and organize the parts around the correct pivots. The companion example lets you inspect these stages and change the construction parameters. After every change, check that the channels align and the moving pieces still fit.

Takeaway: Define → trace → extrude → group → test.