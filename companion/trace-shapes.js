import * as THREE from '../assets/three.module.js';
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

  export function traceShapes(field) {
    const extent = 4.1;
    const count = Math.ceil(2 * extent / 0.04);
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

