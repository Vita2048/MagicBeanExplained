import * as THREE from './three.module.js';
import {RoomEnvironment} from './RoomEnvironment.js';
import {mergeVertices} from './BufferGeometryUtils.js';
export function createPuzzle(container) {
  const TAU = Math.PI * 2;
  const STEP = TAU / 10;
  const R = 0.88;
  // D = 2*R = 1.76. Rotor edge passes exactly midway between the
  // inner and outer marbles (mid k3/k4 and k6/k7 along each rim, i.e.
  // lobe-local 126°/234°): Rr = hypot(D - R*sin36°, R*cos36°) ~= 1.432.
  // Ports are then 59.5°/60.5° (within GAP), so a 60° rotor step still
  // aligns, and the seam sits in the visible gaps between marbles
  // instead of clipping them. Equal spacing lets one rigid 60° rotor
  // toggle between two states:
  // even = separate circles, odd = one central chamber (big loop).
  const D = 2 * R;
  const OUTER_RADIUS = 1.50;
  const TRACK_HALF = 0.275;
  const ROTOR_RADIUS = Math.hypot(
    D - R * Math.sin(STEP), R * Math.cos(STEP)
  );
  const GAP = 0.012;
  // Rounded plastic stays inside each mechanical region. Insetting before
  // beveling preserves the seam clearance, including throughout a flip.
  const BASE_DEPTH = 0.28;
  const BASE_Z = -0.14;
  const BED_Z = 0.178;
  const FACE_DEPTH = 0.205;
  const FACE_Z = 0.178;
  const BASE_BEVEL = 0.10;
  const FACE_BEVEL = 0.05;
  const DETAIL_Z = 0.438;
  const RAISED_Z = 0.44;
  const BEAN_Z = 0.435;
  const OUTER_SLOTS = [0, 1, 2, 8, 9];
  // Centre 60° transfer rings (not a fixed k-list any more):
  // k4/k6 six-ring (full) + k5/pocket six-ring (3 beads + 3 blanks),
  // both defined in movementDefinition in exact angular order.
  const reducedMotion = false;

  const angles = [0, 1, 2].map(i => Math.PI / 2 + i * TAU / 3);
  const normals = angles.map(a =>
    new THREE.Vector3(Math.cos(a), Math.sin(a), 0)
  );
  const centers = normals.map(n => n.clone().multiplyScalar(D));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e1e9ed');

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0, 13.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.appendChild(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label',
    'Two-sided Magic Bean puzzle. Drag beans, click outer lobes to flip, ' +
    'or click the center to transfer beans.');

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight('#d8ecf7', '#3d5a6e', 0.85));

  const keyLight = new THREE.DirectionalLight('#fff8f0', 3.6);
  keyLight.position.set(-4, 6, 9);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  Object.assign(keyLight.shadow.camera, {
    left: -5, right: 5, top: 5, bottom: -5,
    near: 0.5, far: 25
  });
  keyLight.shadow.normalBias = 0.025;
  keyLight.shadow.bias = -0.0001;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);

  const fill = new THREE.DirectionalLight('#a9dcff', 0.7);
  fill.position.set(5, -2, 6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight('#b9eaff', 1.45);
  rim.position.set(2, 5, -6);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.ShadowMaterial({
      color: '#7692a3',
      opacity: 0.18
    })
  );
  // Keep the shadow tight to the object instead of letting it float far behind it.
  floor.position.z = -0.95;
  floor.receiveShadow = true;
  scene.add(floor);

  const root = new THREE.Group();
  root.position.y = -0.28;
  scene.add(root);

  // Face-on at rest: the bean's +z looks straight down the camera axis,
  // and the top lobe stays on screen-up. Dragging the background still orbits.
  let viewYaw = 0;
  let viewPitch = 0;
  const viewTarget = new THREE.Quaternion();

  function updateViewTarget() {
    viewTarget.setFromEuler(
      new THREE.Euler(viewPitch, viewYaw, 0, 'YXZ')
    );
  }

  updateViewTarget();
  root.quaternion.copy(viewTarget);

  function showFace(face) {
    viewYaw = face ? Math.PI : 0;
    viewPitch = 0;
    updateViewTarget();
  }

  function visibleFace() {
    const direction = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(root.quaternion);
    return direction.z >= 0 ? 0 : 1;
  }

  // Colors sampled from MagicBean.jpg / MagicBean.png:
  // outer flipping shells = saturated glossy sky blue,
  // inner body + rotor = pale blue-grey satin, grooves = near-black navy.
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: '#5cade3',
    roughness: 0.16,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.15,
    specularIntensity: 1.0
  });

  const paleMat = new THREE.MeshPhysicalMaterial({
    color: '#a9c6e6',
    roughness: 0.38,
    metalness: 0.0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.55
  });

  const coreMat = new THREE.MeshPhysicalMaterial({
    color: '#3d8abf',
    roughness: 0.32,
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
    envMapIntensity: 0.7
  });

  const trackMat = new THREE.MeshStandardMaterial({
    color: '#0b1e32',
    roughness: 0.62,
    metalness: 0.05
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: '#4a9fd3',
    roughness: 0.22,
    metalness: 0.0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.0
  });

  const grooveMat = new THREE.MeshPhysicalMaterial({
    color: '#3f8cbd',
    roughness: 0.28,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.8
  });

  const holeMat = new THREE.MeshStandardMaterial({
    color: '#071423',
    roughness: 0.55,
    metalness: 0.1
  });

  const pickables = [];

  // -----------------------------------------------------
  // Smooth molded geometry from 2D signed-distance masks.
  // Each movable region is a real, separately extruded part.
  // -----------------------------------------------------

  function bodyField(x, y) {
    let value = Math.hypot(x, y) - (ROTOR_RADIUS + 0.06);

    for (const c of centers) {
      value = Math.min(
        value,
        Math.hypot(x - c.x, y - c.y) - OUTER_RADIUS
      );
    }

    return value;
  }

  function trackField(x, y) {
    let value = Infinity;

    for (const c of centers) {
      value = Math.min(
        value,
        Math.abs(Math.hypot(x - c.x, y - c.y) - R) - TRACK_HALF
      );
    }

    return value;
  }

  // The three annular grooves leave a connected Y AND three small hub
  // crescents on the rotor. Those crescents rotate from the lobe hubs to
  // the gaps between lobes, as shown in MagicBeanRotationTrick.jpg.
  const ROTOR_BEVEL = 0.018;
  function rotorTrackField(x, y) {
    return trackField(x, y);
  }

  function outwardDistance(x, y, lobe) {
    const c = centers[lobe];
    const n = normals[lobe];
    return (x - c.x) * n.x + (y - c.y) * n.y;
  }

  function regionField(type, lobe, x, y) {
    if (type === 'rotor') {
      return Math.hypot(x, y) - (ROTOR_RADIUS - GAP);
    }

    if (type === 'outer') {
      const c = centers[lobe];

      return Math.max(
        Math.hypot(x - c.x, y - c.y) - OUTER_RADIUS,
        GAP - outwardDistance(x, y, lobe)
      );
    }

    let field = ROTOR_RADIUS + GAP - Math.hypot(x, y);

    for (let i = 0; i < 3; i++) {
      field = Math.max(
        field,
        outwardDistance(x, y, i) + GAP
      );
    }

    return field;
  }

  function polygonArea(points) {
    let area = 0;

    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      area += a.x * b.y - b.x * a.y;
    }

    return area / 2;
  }

  function insidePolygon(point, polygon) {
    let inside = false;

    for (let i = 0, j = polygon.length - 1;
         i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j];

      if (
        ((a.y > point.y) !== (b.y > point.y)) &&
        point.x <
          (b.x - a.x) * (point.y - a.y) /
          (b.y - a.y) + a.x
      ) {
        inside = !inside;
      }
    }

    return inside;
  }

  function traceShapes(field) {
    const extent = D + OUTER_RADIUS + 0.15;
    const count = Math.ceil(2 * extent / 0.024);
    const min = -extent;
    const step = 2 * extent / count;
    const stride = count + 1;
    const values = new Float64Array(stride * stride);

    for (let y = 0; y <= count; y++) {
      for (let x = 0; x <= count; x++) {
        let value = field(min + x * step, min + y * step);
        if (Math.abs(value) < 1e-10) value = 1e-10;
        values[y * stride + x] = value;
      }
    }

    const nodes = [];
    const edgeMap = new Map();

    function crossing(a, b) {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (edgeMap.has(key)) return edgeMap.get(key);

      const t = values[a] / (values[a] - values[b]);

      const ax = a % stride;
      const ay = Math.floor(a / stride);
      const bx = b % stride;
      const by = Math.floor(b / stride);

      const id = nodes.length;

      nodes.push({
        p: new THREE.Vector2(
          min + (ax + (bx - ax) * t) * step,
          min + (ay + (by - ay) * t) * step
        ),
        links: []
      });

      edgeMap.set(key, id);
      return id;
    }

    function triangle(a, b, c) {
      const hits = [];

      for (const [u, v] of [[a, b], [b, c], [c, a]]) {
        if ((values[u] < 0) !== (values[v] < 0)) {
          hits.push(crossing(u, v));
        }
      }

      if (hits.length === 2) {
        nodes[hits[0]].links.push(hits[1]);
        nodes[hits[1]].links.push(hits[0]);
      }
    }

    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        const a = y * stride + x;
        const b = a + 1;
        const d = a + stride;
        const c = d + 1;

        triangle(a, b, c);
        triangle(a, c, d);
      }
    }

    const visited = new Set();
    const loops = [];

    for (let start = 0; start < nodes.length; start++) {
      if (visited.has(start)) continue;

      let previous = -1;
      let current = start;
      let closed = false;
      const points = [];

      for (let guard = 0; guard <= nodes.length; guard++) {
        if (visited.has(current)) {
          closed = current === start;
          break;
        }

        visited.add(current);
        points.push(nodes[current].p);

        const next = nodes[current].links.find(i => i !== previous);
        if (next === undefined) break;

        previous = current;
        current = next;
      }

      if (closed && points.length >= 4) {
        const clean = [];

        for (const p of points) {
          if (
            !clean.length ||
            p.distanceToSquared(clean[clean.length - 1]) > 0.000004
          ) {
            clean.push(p);
          }
        }

        if (
          clean.length > 3 &&
          clean[0].distanceToSquared(clean[clean.length - 1]) < 0.000004
        ) {
          clean.pop();
        }

        const area = Math.abs(polygonArea(clean));

        if (clean.length >= 3 && area > 0.0002) {
          loops.push({ points: clean, area, parent: -1, depth: 0 });
        }
      }
    }

    loops.sort((a, b) => b.area - a.area);

    for (let i = 0; i < loops.length; i++) {
      let bestArea = Infinity;

      for (let j = 0; j < i; j++) {
        if (
          loops[j].area < bestArea &&
          insidePolygon(loops[i].points[0], loops[j].points)
        ) {
          loops[i].parent = j;
          bestArea = loops[j].area;
        }
      }

      if (loops[i].parent >= 0) {
        loops[i].depth = loops[loops[i].parent].depth + 1;
      }
    }

    const shapes = [];
    const shapeMap = new Map();

    for (let i = 0; i < loops.length; i++) {
      if (loops[i].depth % 2 === 0) {
        const shape = new THREE.Shape(loops[i].points);
        shapeMap.set(i, shape);
        shapes.push(shape);
      }
    }

    for (let i = 0; i < loops.length; i++) {
      if (loops[i].depth % 2 === 1) {
        shapeMap.get(loops[i].parent).holes.push(
          new THREE.Path(loops[i].points)
        );
      }
    }

    return shapes;
  }

  const parts = {};

  function addPart(type, lobe = -1) {
    const group = new THREE.Group();

    const pivot = type === 'outer'
      ? centers[lobe].clone()
      : new THREE.Vector3();

    group.position.copy(pivot);
    root.add(group);

    const meta = {
      kind: type === 'outer' ? 'flip' :
            type === 'rotor' ? 'center' : 'body',
      lobe
    };

    const mask = (x, y) => Math.max(
      bodyField(x, y),
      regionField(type, lobe, x, y)
    );

    const solidMask = (x, y) => Math.max(
      mask(x, y),
      type === 'rotor' ? -rotorTrackField(x, y) : -trackField(x, y)
    );

    // ExtrudeGeometry expands contours by bevelSize. Erode the field by
    // that amount first: the final silhouette never crosses a split plane
    // or the rotor circle. Do not scale XY to simulate a dome: the fixed
    // and rotating halves have different pivots and that expansion jams them.
    const baseShapes = traceShapes((x, y) => mask(x, y) + BASE_BEVEL);
    const faceBevel = type === 'rotor' ? ROTOR_BEVEL : FACE_BEVEL;
    const faceShapes = traceShapes((x, y) => solidMask(x, y) + faceBevel);

    function makeGeometry(shapes, depth, bevel, bevelHeight = bevel) {
      let geometry = new THREE.ExtrudeGeometry(shapes, {
        depth,
        steps: 1,
        bevelEnabled: bevel > 0,
        bevelSize: bevel,
        bevelThickness: bevelHeight,
        bevelSegments: 8,
        curveSegments: 32
      });
      // Marching contours approximate arcs and acute corners. Project any
      // tiny bevel overshoot back to the exact mechanical boundary before
      // computing normals; this also keeps mirrored halves identical.
      const position = geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        let x = position.getX(i), y = position.getY(i);
        const radius = Math.hypot(x, y);
        if (type === 'rotor' && radius > ROTOR_RADIUS - GAP) {
          x *= (ROTOR_RADIUS - GAP) / radius;
          y *= (ROTOR_RADIUS - GAP) / radius;
        } else if (type === 'fixed' && radius < ROTOR_RADIUS + GAP) {
          x *= (ROTOR_RADIUS + GAP) / radius;
          y *= (ROTOR_RADIUS + GAP) / radius;
        }
        for (let j = 0; j < 3; j++) {
          if (type === 'rotor' || (type === 'outer' && j !== lobe)) continue;
          const distance = outwardDistance(x, y, j);
          const correction = type === 'outer'
            ? Math.max(0, GAP - distance)
            : Math.min(0, -GAP - distance);
          x += normals[j].x * correction;
          y += normals[j].y * correction;
        }
        position.setXY(i, x, y);
      }
      geometry.deleteAttribute('normal');
      geometry.deleteAttribute('uv');
      geometry = mergeVertices(geometry, 0.0001);
      geometry.computeVertexNormals();
      geometry.translate(-pivot.x, -pivot.y, 0);
      return geometry;
    }

    const baseGeometry = makeGeometry(baseShapes, BASE_DEPTH, BASE_BEVEL, 0.025);
    const base = new THREE.Mesh(baseGeometry, coreMat);
    base.position.z = BASE_Z;
    base.castShadow = true;
    base.receiveShadow = true;
    base.userData = meta;
    group.add(base);
    pickables.push(base);

    // Dark beds sit below the raised molded face.
    const bedGeometry = makeGeometry(traceShapes(mask), 0.008, 0);

    for (const sign of [1, -1]) {
      const bed = new THREE.Mesh(bedGeometry, trackMat);
      bed.position.z = sign * BED_Z;
      bed.scale.z = sign;
      bed.receiveShadow = true;
      bed.userData = meta;
      group.add(bed);
      pickables.push(bed);
    }

    const faceDepth = FACE_DEPTH + FACE_BEVEL - faceBevel;
    const faceLayers = type === 'outer'
      ? [
          // The blue shell and pale hub are disconnected islands of the
          // same rotating half, with the annular marble channel between.
          { material: shellMat, shapes: traceShapes((x, y) => Math.max(
              solidMask(x, y), R - Math.hypot(x - pivot.x, y - pivot.y)
            ) + faceBevel) },
          { material: paleMat, shapes: traceShapes((x, y) => Math.max(
              solidMask(x, y), Math.hypot(x - pivot.x, y - pivot.y) - R
            ) + faceBevel) }
        ]
      : [{ material: paleMat, shapes: faceShapes }];

    for (const layer of faceLayers) {
      const faceGeometry = makeGeometry(layer.shapes, faceDepth, faceBevel);
      for (const sign of [1, -1]) {
        const face = new THREE.Mesh(faceGeometry, layer.material);

        face.position.z = sign * FACE_Z;
        face.scale.z = sign;
        face.castShadow = true;
        face.receiveShadow = true;
        face.userData = meta;
        group.add(face);
        pickables.push(face);
      }
    }

    const part = { group, pivot, meta };
    parts[type === 'outer' ? `outer${lobe}` : type] = part;
    return part;
  }

  addPart('fixed');
  addPart('rotor');
  for (let lobe = 0; lobe < 3; lobe++) addPart('outer', lobe);

  // -----------------------------------------------------
  // Two-state central rotor: 60° steps, even = separate circles,
  // odd = one central chamber. The Y points between the lobes in
  // the first state and toward the lobe hubs in the second state.
  // -----------------------------------------------------

  // Rotor position in 60° steps (0-5). Even = separate circles
  // (marbles rotate in each circle), odd = chamber (all marbles
  // can travel through the centre). Plastic and inner beans both
  // turn 60° using the existing slot permutation.
  let rotorRotation = 0;

  function rotorIsChamber() {
    return (rotorRotation % 2 + 2) % 2 === 1;
  }

  // -----------------------------------------------------
  // Molded decorative details, present on both faces.
  // -----------------------------------------------------

  const detailSphere = new THREE.SphereGeometry(1, 24, 16);

  function detail(part, position, scale, material, angle = 0) {
    const mesh = new THREE.Mesh(detailSphere, material);
    mesh.position.copy(position).sub(part.pivot);
    mesh.scale.copy(scale);
    mesh.rotation.z = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = part.meta;
    part.group.add(mesh);
    pickables.push(mesh);
    return mesh;
  }

  // Thin molded scallops and inset dots follow the rim, as in the photos.
  // All details are hosted on the same half as the plastic below them.
  function moldedLine(part, points, material, radius = 0.007) {
    for (const sign of [1, -1]) {
      const curve = new THREE.CatmullRomCurve3(points.map(p =>
        new THREE.Vector3(p.x - part.pivot.x, p.y - part.pivot.y,
          sign * (DETAIL_Z - 0.007))
      ), true);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 6, true), material);
      mesh.userData = part.meta;
      part.group.add(mesh);
      pickables.push(mesh);
    }
  }

  for (let lobe = 0; lobe < 3; lobe++) {
    const part = parts[`outer${lobe}`];
    const center = centers[lobe];
    for (let k = -2; k <= 2; k++) {
      const angle = angles[lobe] + k * STEP;
      const points = [];
      // A shallow lens, with its long axis following the circular shell.
      for (let j = 0; j < 40; j++) {
        const t = j * TAU / 40;
        const a = angle + 0.255 * Math.cos(t);
        const r = 1.33 + 0.11 * Math.sin(t);
        points.push(new THREE.Vector2(center.x + r * Math.cos(a), center.y + r * Math.sin(a)));
      }
      moldedLine(part, points, accentMat);
    }
    for (let k = -2; k <= 1; k++) {
      const angle = angles[lobe] + (k + 0.5) * STEP;
      for (const sign of [1, -1]) {
        const p = new THREE.Vector3(center.x + 1.32 * Math.cos(angle),
          center.y + 1.32 * Math.sin(angle), sign * (DETAIL_Z - 0.002));
        detail(part, p, new THREE.Vector3(0.057, 0.057, 0.009), accentMat);
        detail(part, p.clone().setZ(sign * (DETAIL_Z + 0.006)),
          new THREE.Vector3(0.043, 0.043, 0.008), shellMat);
      }
    }
    for (const off of [1.32, -1.32]) {
      const angle = angles[lobe] + off;
      for (const sign of [1, -1]) {
        detail(part, new THREE.Vector3(center.x + 1.27 * Math.cos(angle),
          center.y + 1.27 * Math.sin(angle), sign * (DETAIL_Z - 0.008)),
          new THREE.Vector3(0.060, 0.075, 0.016), holeMat, angle);
      }
    }

    // One dark pin on each stationary shoulder. The old radius-1.02 pins
    // floated inside the rotor and were struck by its arms every 60°.
    const n = normals[lobe];
    for (const sign of [1, -1]) {
      detail(parts.fixed, new THREE.Vector3(
        center.x - 0.35 * n.x - 1.21 * n.y,
        center.y - 0.35 * n.y + 1.21 * n.x,
        sign * (DETAIL_Z - 0.008)
      ), new THREE.Vector3(0.066, 0.066, 0.014), holeMat);
    }
  }

  function addRaisedShape(part, shape, depth, material) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.022,
      bevelThickness: 0.022,
      bevelSegments: 4,
      curveSegments: 32
    });

    geometry.translate(-part.pivot.x, -part.pivot.y, 0);

    for (const sign of [1, -1]) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = sign * RAISED_Z;
      mesh.scale.z = sign;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = part.meta;
      part.group.add(mesh);
      pickables.push(mesh);
    }
  }

  // Split hex grips follow the lobe seam, with clearance for their bevel.
  function clipPolygon(points, normal, center, sign) {
    const output = [];
    const distance = p =>
      sign * ((p.x - center.x) * normal.x +
              (p.y - center.y) * normal.y) - 0.030;

    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      const da = distance(a), db = distance(b);

      if (da >= 0) output.push(a.clone());

      if ((da >= 0) !== (db >= 0)) {
        output.push(a.clone().lerp(b, da / (da - db)));
      }
    }

    return output;
  }

  // Lobe hub disks are part of the face geometry above. Their inward
  // crescents belong to the rotor; an extra unsplit disk here would bridge
  // that seam and cover the moving crescents.

  // Shallow leaf relief and one inset dot on each broad arm. The local
  // leaf points along +Y, so rotate by (arm angle - PI/2) on both faces.
  for (let lobe = 0; lobe < 3; lobe++) {
    const angle = angles[lobe] - Math.PI / 3;
    const rotation = angle - Math.PI / 2;
    const leaf = new THREE.Shape();
    leaf.moveTo(0, 1.35);
    leaf.bezierCurveTo(-0.20, 1.16, -0.24, 0.81, -0.15, 0.62);
    leaf.quadraticCurveTo(0, 0.54, 0.15, 0.62);
    leaf.bezierCurveTo(0.24, 0.81, 0.20, 1.16, 0, 1.35);
    const points = leaf.getPoints(40).map(p => new THREE.Vector2(
      p.x * Math.cos(rotation) - p.y * Math.sin(rotation),
      p.x * Math.sin(rotation) + p.y * Math.cos(rotation)
    ));
    addRaisedShape(parts.rotor, new THREE.Shape(points), 0.004, paleMat);

    for (const sign of [1, -1]) {
      const position = new THREE.Vector3(
        Math.cos(angle) * 1.00, Math.sin(angle) * 1.00,
        sign * (RAISED_Z + 0.032)
      );
      detail(parts.rotor, position,
        new THREE.Vector3(0.049, 0.049, 0.008), grooveMat);
      detail(parts.rotor, position.clone().setZ(sign * (RAISED_Z + 0.040)),
        new THREE.Vector3(0.035, 0.035, 0.006), paleMat);
    }
  }

  const capShape = new THREE.Shape();
  capShape.absarc(0, 0, 0.44, 0, TAU, false);
  addRaisedShape(parts.rotor, capShape, 0.09, paleMat);

  // Subtle molded lip around the center cap.
  {
    const ringGeo = new THREE.TorusGeometry(0.445, 0.009, 12, 64);
    for (const sign of [1, -1]) {
      const ring = new THREE.Mesh(ringGeo, paleMat);
      ring.position.set(0, 0, sign * (RAISED_Z + 0.082));
      ring.userData = parts.rotor.meta;
      parts.rotor.group.add(ring);
      pickables.push(ring);
    }
  }

  // Broad hex grips are split between the fixed and flipping hub halves,
  // on both faces. No raised detail bridges either mechanical seam.
  {
    const hexPoints = [];
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6 + Math.PI / 6;
      hexPoints.push(new THREE.Vector2(
        0.21 * Math.cos(a), 0.21 * Math.sin(a)
      ));
    }
    function hexHalf(lobe, halfSign) {
      const c = centers[lobe];
      const world = hexPoints.map(p =>
        new THREE.Vector2(p.x + c.x, p.y + c.y)
      );
      const clipped = clipPolygon(world, normals[lobe], c, halfSign);
      // back to lobe-local for ExtrudeGeometry (translated by -pivot later
      // manually here via position, so build around origin)
      return new THREE.Shape(clipped.map(p =>
        new THREE.Vector2(p.x - c.x, p.y - c.y)
      ));
    }
    for (let lobe = 0; lobe < 3; lobe++) {
      for (const halfSign of [1, -1]) {
        const shape = hexHalf(lobe, halfSign);
        if (!shape.getPoints().length) continue;
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: 0.03, bevelEnabled: true,
          bevelSize: 0.012, bevelThickness: 0.012,
          bevelSegments: 2, curveSegments: 6
        });
        for (const faceSign of [1, -1]) {
          const host = halfSign === 1
            ? parts[`outer${lobe}`] : parts.fixed;
          const bolt = new THREE.Mesh(geo, paleMat);
          bolt.position.set(
            centers[lobe].x - host.pivot.x,
            centers[lobe].y - host.pivot.y,
            faceSign * (RAISED_Z + 0.008)
          );
          if (faceSign < 0) bolt.scale.z = -1;
          bolt.userData = host.meta;
          bolt.castShadow = true;
          host.group.add(bolt);
          pickables.push(bolt);
        }
      }
    }
  }

  // -----------------------------------------------------
  // Logical puzzle:
  // 60 physical beans live in 66 slots: 2 faces × 30 lobe slots
  // (3 lobes × 10) + 2 faces × 3 central pocket slots (chamber gaps).
  // Even rotor steps (separate): pockets empty, lobes full.
  // Odd steps (chamber): 3 lobe-k5 slots empty per face, pockets full.
  // 3 vacancies per face always — beads and blanks permute together,
  // exactly like the real toy where marbles sit in the chamber.
  // Both beads and plastic move 60° on every centre click.
  // -----------------------------------------------------

  // Bean colors eyedropped from the product photos: salmon pink, soft
  // lavender, mint cyan, golden yellow, yellow-green, and warm off-white.
  const colors = [
    '#e79c92', '#9d82c7', '#6fced8',
    '#f1c94e', '#a9d170', '#e8e7dd'
  ];

  const beanMaterials = colors.map(color =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.13,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.25,
      specularIntensity: 1.0
    })
  );

  const BEAN_R = 0.265;
  const beanGeometry = new THREE.SphereGeometry(BEAN_R, 40, 28);

  // Lobe slots: 33 per face (30 lobe + 3 pocket), 66 total.
  // face 0: 0-29 lobe, 30-32 pocket; face 1: 33-62 lobe, 63-65 pocket.
  function slotID(face, lobe, k) {
    return face * 33 + lobe * 10 + ((k % 10) + 10) % 10;
  }

  function pocketID(face, p) {
    return face * 33 + 30 + ((p % 3) + 3) % 3;
  }

  // Pocket gaps between lobes (chamber transit positions).
  // Same ring radius as lobe-k5 (D - R = 0.81) so the six together
  // (3 lobe-k5 + 3 pocket) form an exact 60°-symmetric ring: any 60°
  // rotation about the origin maps the set onto itself with no snap.
  const POCKET_RING = D - R;
  const POCKET_GAPS = [0, 1, 2].map(i => Math.PI / 6 + i * TAU / 3);

  function decode(id) {
    const face = id < 33 ? 0 : 1;
    const local = id - face * 33;
    if (local < 30) {
      return {
        face,
        lobe: Math.floor(local / 10),
        k: local % 10,
        pocket: -1
      };
    }
    return { face, lobe: -1, k: -1, pocket: local - 30 };
  }

  function slotPosition(face, lobe, k, pocket = -1) {
    if (pocket >= 0) {
      const a = POCKET_GAPS[((pocket % 3) + 3) % 3];
      return new THREE.Vector3(
        POCKET_RING * Math.cos(a),
        POCKET_RING * Math.sin(a),
        face === 0 ? BEAN_Z : -BEAN_Z
      );
    }
    const angle = angles[lobe] + k * STEP;

    return new THREE.Vector3(
      centers[lobe].x + R * Math.cos(angle),
      centers[lobe].y + R * Math.sin(angle),
      face === 0 ? BEAN_Z : -BEAN_Z
    );
  }

  const slots = new Array(66);
  const solvedState = new Array(66).fill(null);

  for (let face = 0; face < 2; face++) {
    for (let lobe = 0; lobe < 3; lobe++) {
      for (let k = 0; k < 10; k++) {
        const id = slotID(face, lobe, k);
        const target = face * 3 + lobe;
        const position = slotPosition(face, lobe, k);

        slots[id] = {
          face, lobe, k, pocket: -1, target, position,
          canonical: position.clone()
        };

        const mesh = new THREE.Mesh(
          beanGeometry,
          beanMaterials[target]
        );

        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { kind: 'bean', slot: id };
        root.add(mesh);
        pickables.push(mesh);

        solvedState[id] = { mesh, color: target };
      }
    }
    // Central pocket slots: transit only, no colour target.
    for (let p = 0; p < 3; p++) {
      const id = pocketID(face, p);
      const position = slotPosition(face, -1, -1, p);
      slots[id] = {
        face, lobe: -1, k: -1, pocket: p, target: -1,
        position, canonical: position.clone()
      };
      solvedState[id] = null;
    }
  }


  let state=solvedState.slice();
  function snapBeans() {
    state.forEach((bean, id) => {
      if (!bean) return;
      bean.mesh.position.copy(slots[id].position);
      bean.mesh.userData.slot = id;
    });
  }

  // Inner beads travel with the rotor. k4/k6 are not on a 60° lattice
  // (they alternate ~52.6°/67.4°), so parking them on the fixed rim
  // slots after a 60° turn shoves them into the rotor plastic.
  // Rest each carried slot on the rigid image of the bead that now
  // occupies it. Even steps land back on the circular rims because
  // those steps are 120° symmetries of the trefoil.
  function carriedRings(face) {
    return [
      [
        slotID(face, 0, 6), slotID(face, 0, 4),
        slotID(face, 1, 6), slotID(face, 1, 4),
        slotID(face, 2, 6), slotID(face, 2, 4)
      ],
      [
        pocketID(face, 0), slotID(face, 0, 5),
        pocketID(face, 1), slotID(face, 1, 5),
        pocketID(face, 2), slotID(face, 2, 5)
      ]
    ];
  }

  const layoutAxis = new THREE.Vector3(0, 0, 1);
  const layoutQuat = new THREE.Quaternion();

  function layoutCarriedSlots() {
    const n = ((rotorRotation % 6) + 6) % 6;
    layoutQuat.setFromAxisAngle(layoutAxis, n * TAU / 6);

    for (let face = 0; face < 2; face++) {
      for (const ring of carriedRings(face)) {
        for (let i = 0; i < ring.length; i++) {
          const src = ring[(i - n + ring.length * 6) % ring.length];
          slots[ring[i]].position
            .copy(slots[src].canonical)
            .applyQuaternion(layoutQuat);
        }
      }
    }
  }

  function bigLoopOrder(face) {
    // One 30-cycle per face through every open slot in chamber state:
    // 27 lobe non-k5 (k5 walled off) + 3 pocket. CCW order (dir +1).
    // l0k4 -> gap150 -> l1k6 -> ...outer l1... -> l1k4 -> gap270 ->
    // l2k6 -> ...outer l2... -> l2k4 -> gap30 -> l0k6 -> ...outer l0...
    // -> l0k3 -> back to l0k4. All 30 beads move together, no blanks:
    // a fully packed bead necklace rotating as one — all marbles travel.
    const L = (lobe, k) => slotID(face, lobe, k);
    const P = p => pocketID(face, p);
    return [
      L(0, 4), P(1),
      L(1, 6), L(1, 7), L(1, 8), L(1, 9), L(1, 0),
      L(1, 1), L(1, 2), L(1, 3), L(1, 4), P(2),
      L(2, 6), L(2, 7), L(2, 8), L(2, 9), L(2, 0),
      L(2, 1), L(2, 2), L(2, 3), L(2, 4), P(0),
      L(0, 6), L(0, 7), L(0, 8), L(0, 9), L(0, 0),
      L(0, 1), L(0, 2), L(0, 3)
    ];
  }

  function movementDefinition(move) {
    const mappings = [];
    let pivot = new THREE.Vector3();
    let axis = new THREE.Vector3(0, 0, 1);
    // Centre: beads and plastic share one 60° rotation about the origin.
    // No sideways drift — k4/k6 would otherwise leave the rotor groove
    // and intersect the plastic. Vacancies ride along in the same rings.
    // Ring drags are state-dependent (checked at execution time):
    // even (separate) = rigid 10-cycle in one rim; odd (chamber) =
    // big 30-loop through all rims + pocket so ALL marbles travel.
    let angle;
    let partAngle;
    let part = null;
    let lerp = false;

    if (move.type === 'ring') {
      if (rotorIsChamber()) {
        // Chamber open: ignore lobe, circulate the whole face loop.
        // No plastic moves (rotor walls stay); beads lerp slot-to-slot
        // (a rigid rotation about one lobe would fling far beads off).
        const order = bigLoopOrder(move.face);
        for (let i = 0; i < order.length; i++) {
          mappings.push([
            order[i],
            order[(i + move.dir + order.length) % order.length]
          ]);
        }
        angle = 0;
        partAngle = 0;
        lerp = true;
      } else {
        pivot.copy(centers[move.lobe]);
        angle = move.dir * STEP;
        partAngle = angle;

        for (let k = 0; k < 10; k++) {
          mappings.push([
            slotID(move.face, move.lobe, k),
            slotID(move.face, move.lobe, k + move.dir)
          ]);
        }
      }
    }

    if (move.type === 'center') {
      angle = move.dir * TAU / 6; // 60° for beads AND plastic
      partAngle = angle;
      part = parts.rotor;

      for (let face = 0; face < 2; face++) {
        for (const ring of carriedRings(face)) {
          for (let i = 0; i < ring.length; i++) {
            mappings.push([
              ring[i],
              ring[(i + move.dir + ring.length) % ring.length]
            ]);
          }
        }
      }
    }

    if (move.type === 'flip') {
      pivot.copy(centers[move.lobe]);
      axis.copy(normals[move.lobe]);
      angle = move.dir * Math.PI;
      partAngle = angle;
      part = parts[`outer${move.lobe}`];

      for (let face = 0; face < 2; face++) {
        for (const k of OUTER_SLOTS) {
          mappings.push([
            slotID(face, move.lobe, k),
            slotID(1 - face, move.lobe, -k)
          ]);
        }
      }
    }

    return { mappings, pivot, axis, angle, partAngle, part, lerp };
  }


  // Color layout is deliberately mixed so a circular movement is visible.
  // Reuse the original six materials; no geometry or mechanical rule changes.
  const palettes=[[4,4,4,0,2,2,2,0,4,4],[3,3,3,0,0,0,1,1,3,3],[5,5,5,2,1,1,1,2,5,5]];
  for(let f=0;f<2;f++)for(let l=0;l<3;l++)for(let k=0;k<10;k++){
    const bean=state[slotID(f,l,k)];const color=(palettes[l][k]+f*3)%6;
    bean.mesh.material=beanMaterials[color];bean.color=color;
  }
  const beans=state.filter(Boolean),partList=Object.values(parts);
  const capture=()=>({positions:beans.map(b=>b.mesh.position.clone()),quaternions:partList.map(p=>p.group.quaternion.clone()),slots:state.map(b=>b?beans.indexOf(b):-1),rotor:rotorRotation});
  const restore=s=>{beans.forEach((b,i)=>b.mesh.position.copy(s.positions[i]));partList.forEach((p,i)=>p.group.quaternion.copy(s.quaternions[i]));};
  const actions=[];
  const add=(at,duration,type,lobe=0,dir=1,face=0)=>actions.push({at,duration,type,lobe,dir,face});
  // Five 36-degree increments show half a circuit, with distinct color travel.
  for(let l=0;l<3;l++)for(let k=0;k<5;k++)add(7+l*3+k*.51,.46,'ring',l);
  add(16.3,2.6,'center');
  // Ten linked steps visibly carry beads from one lobe into the next.
  for(let k=0;k<10;k++)add(20+k*.56,.52,'ring');
  add(26,.95,'center',0,-1);
  for(let l=0;l<3;l++)add(27.2+l*2.5,2.1,'flip',l);
  const q=new THREE.Quaternion();
  for(const a of actions){
    a.before=capture();a.definition=movementDefinition(a);
    const d=a.definition;
    a.moving=d.mappings.map(([from,to])=>({bean:state[from],from,to,start:slots[from].position.clone(),end:slots[to].position.clone()}));
    if(d.part)a.partStart=d.part.group.quaternion.clone();
    q.setFromAxisAngle(d.axis,d.angle||0);
    for(const m of a.moving){if(!m.bean)continue;m.bean.mesh.position.copy(m.start);if(d.lerp)m.bean.mesh.position.copy(m.end);else m.bean.mesh.position.sub(d.pivot).applyQuaternion(q).add(d.pivot);}
    if(d.part)d.part.group.quaternion.copy(a.partStart).multiply(q);
    for(const m of a.moving)state[m.to]=m.bean;
    if(a.type==='center'){
      rotorRotation=(rotorRotation+a.dir+6)%6;
      parts.rotor.group.quaternion.setFromAxisAngle(layoutAxis,rotorRotation*TAU/6);
      layoutCarriedSlots();
    }
    snapBeans();a.after=capture();
  }
  const initial=actions[0].before;
  const haloMaterial=new THREE.MeshBasicMaterial({color:'#ffc878',transparent:true,opacity:.8,depthTest:false});
  const halos=centers.map(c=>{const h=new THREE.Mesh(new THREE.TorusGeometry(1.54,.013,8,128),haloMaterial);h.position.set(c.x,c.y,.7);h.renderOrder=9;root.add(h);return h;});
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  camera.aspect=1188/674;
  const halfHeight=4.25;
  camera.position.set(0,root.position.y,halfHeight/Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
  camera.lookAt(0,root.position.y,0);camera.updateProjectionMatrix();
  renderer.setSize(1188,674,false);
  renderer.domElement.style.cssText='width:100%;height:100%;display:block';
  // Preserve front/rear lighting during the inspection turn; the original flat
  // shadow receiver would slice through the rotated model, so fade it first.
  function renderAt(time){
    const t=Math.max(0,Math.min(45,time));
    let current=null;
    for(const a of actions){if(a.at<=t)current=a;else break;}
    restore(current?current.before:initial);
    let u=0;
    if(current){
      u=Math.min(1,(t-current.at)/current.duration);
      if(u>=1)restore(current.after);
      else{
        const d=current.definition,e=smooth(u);
        q.setFromAxisAngle(d.axis,(d.angle||0)*e);
        for(const m of current.moving){
          if(!m.bean)continue;
          m.bean.mesh.position.copy(m.start);
          if(d.lerp)m.bean.mesh.position.lerp(m.end,e);
          else m.bean.mesh.position.sub(d.pivot).applyQuaternion(q).add(d.pivot);
        }
        if(d.part)d.part.group.quaternion.copy(current.partStart).multiply(q);
      }
    }
    const tilt=smooth((t-26.2)/.8)*(1-smooth((t-34.4)/.6));
    const turn=smooth((t-35)/6);
    root.rotation.set(.19*tilt+.14*Math.sin(turn*Math.PI),-.23*tilt+turn*TAU,0,'YXZ');
    floor.material.opacity=.18*(1-smooth((t-26)/.7));
    halos.forEach((h,i)=>h.visible=t>=7+i*3&&t<9.8+i*3);
    renderer.render(scene,camera);
    return {time:t,action:current?.type||'hold',progress:u,rotor:current?(u>=1?current.after.rotor:current.before.rotor):0,beadCount:beans.length,positions:beans.map(b=>b.mesh.position.toArray()),partQuaternions:partList.map(p=>p.group.quaternion.toArray()),rootQuaternion:root.quaternion.toArray()};
  }
  renderAt(0);
  return {renderAt,renderer,teaching:{THREE,scene,root,camera,parts,beans,halos,floor,centers,normals,traceShapes,bodyField,trackField,regionField},actions:actions.map(({at,duration,type,lobe,dir})=>({at,duration,type,lobe,dir})),getGeometryStats:()=>{let meshes=0,vertices=0;root.traverse(n=>{if(n.isMesh){meshes++;vertices+=n.geometry.attributes.position.count;}});return {meshes,vertices,beads:beans.length,parts:partList.length};}};

}
