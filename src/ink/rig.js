// The silhouette. Poses come from the Animator + skeleton; this file only draws them,
// plus the passive cloth (headband, sash, tunic skirts) that gives the body its weight.
import { solve, BONES, lerp } from './skeleton.js';
import { Animator } from './animator.js';

const WIND = -14;
const TWO_PI = Math.PI * 2;

class Chain {
  constructor(count, length) {
    this.length = length;
    this.pts = Array.from({ length: count }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
    this.ready = false;
  }
  reset(x, y) {
    this.pts.forEach((p, i) => { p.x = p.px = x; p.y = p.py = y + i * this.length; });
    this.ready = true;
  }
  /** Carry the whole chain with a frozen body (hit-stop, a teleport between rounds). */
  follow(ax, ay) {
    if (!this.ready) return;
    const dx = ax - this.pts[0].x, dy = ay - this.pts[0].y;
    for (const p of this.pts) { p.x += dx; p.y += dy; p.px += dx; p.py += dy; }
  }
  /** Anchor moves with the body; the rest trails under gravity, drag and a faint wind. */
  step(ax, ay, dt, gravity = 900, drag = 0.965) {
    if (!this.ready || Math.hypot(ax - this.pts[0].x, ay - this.pts[0].y) > 260) this.reset(ax, ay);
    const h = 1 / 120, n = Math.min(6, Math.ceil(dt / h));
    for (let s = 0; s < Math.max(1, n); s++) {
      const [root, ...rest] = this.pts;
      root.x = ax; root.y = ay; root.px = ax; root.py = ay;
      for (const p of rest) {
        const vx = (p.x - p.px) * drag, vy = (p.y - p.py) * drag;
        p.px = p.x; p.py = p.y;
        p.x += vx + WIND * h * h; p.y += vy + gravity * h * h;
      }
      for (let it = 0; it < 3; it++) {
        for (let i = 1; i < this.pts.length; i++) {
          const a = this.pts[i - 1], b = this.pts[i];
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001, k = (d - this.length) / d;
          if (i === 1) { b.x -= dx * k; b.y -= dy * k; }
          else { a.x += dx * k * 0.5; a.y += dy * k * 0.5; b.x -= dx * k * 0.5; b.y -= dy * k * 0.5; }
        }
      }
    }
  }
}

function tube(c, pts, widths) {
  const n = pts.length, left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d, ny = dx / d;
    left.push([pts[i][0] + nx * widths[i], pts[i][1] + ny * widths[i]]);
    right.push([pts[i][0] - nx * widths[i], pts[i][1] - ny * widths[i]]);
  }
  c.beginPath();
  c.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) c.lineTo(left[i][0], left[i][1]);
  for (let i = n - 1; i >= 0; i--) c.lineTo(right[i][0], right[i][1]);
  c.closePath();
  c.fill();
  c.beginPath(); c.arc(pts[0][0], pts[0][1], widths[0], 0, TWO_PI); c.fill();
  c.beginPath(); c.arc(pts[n - 1][0], pts[n - 1][1], widths[n - 1], 0, TWO_PI); c.fill();
}
const along = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

function foot(c, ankle, angle, long) {
  const dx = Math.cos(angle), dy = Math.sin(angle), nx = -dy, ny = dx;
  const P = (u, v) => [ankle[0] + dx * u + nx * v, ankle[1] + dy * u + ny * v];
  const pts = [P(-5, 3.5), P(2, 5), P(long - 5, 4.2), P(long, 1.2), P(long - 3, -1.6), P(5, -2.4), P(-1, -6), P(-6, -3)];
  c.beginPath(); c.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) c.lineTo(...pts[i]);
  c.closePath(); c.fill();
}

export class InkRig {
  constructor() {
    this.animator = new Animator();
    this.current = solve(this.animator.out);
    this.face = null;
    this.turn = 1; this.turnClock = 1;
    this.band = [new Chain(7, 8), new Chain(6, 8.5)];
    this.sash = [new Chain(5, 8), new Chain(4, 7)];
    this.trails = { frontHand: [], backHand: [], frontToe: [], backToe: [] };
    this.ink = 0;
  }

  /** Deterministic pose for a fighter at an instant; no springs, no history. Used by tests and the lab. */
  sample(f, time = 0) {
    const probe = new Animator();
    probe.cat = null;
    return solve(probe.step(f, time, 0));
  }

  onEvent(kind, power) { this.animator.kick(kind, power); }

  /** A new round: forget springs, crossfades, cloth and trails. */
  reset() {
    this.animator = new Animator();
    this.current = solve(this.animator.out);
    for (const chain of [...this.band, ...this.sash]) chain.ready = false;
    for (const key in this.trails) this.trails[key].length = 0;
    this.turnClock = 1; this.face = null;
  }

  advance(f, time, dt, wx) {
    const ch = this.animator.step(f, time, dt, wx);
    this.current = solve(ch);
    return this.current;
  }

  draw(c, f, x, y, scale, time, dt, ghost = false, frozen = false) {
    const wx = x / scale, wy = y / scale;
    if (!ghost) this.advance(f, time, frozen ? 0 : dt, wx);
    const p = this.current;
    if (!ghost) {
      if (f.facing !== this.face) { if (this.face !== null) this.turnClock = 0; this.face = f.facing; }
      if (!frozen) this.turnClock = Math.min(1, this.turnClock + dt / 0.14);
    }
    const squeeze = ghost ? 1 : 1 - 0.3 * Math.sin(Math.PI * this.turnClock);
    c.save();
    c.translate(x, y);
    c.scale(scale * f.facing * squeeze, scale);
    this.paint(c, p, f, wx, wy, dt, time, ghost, frozen);
    c.restore();
    if (!ghost) this.paintTrails(c, scale, f, frozen ? 0 : dt);
  }

  paint(c, p, f, wx, wy, dt, time, ghost, frozen) {
    const side = f.facing;
    const ink = ghost ? '#342d29' : f.hitFlash > 0 ? '#776454' : '#151615';
    const rear = ghost ? ink : f.hitFlash > 0 ? '#80705e' : '#262826';
    const edge = f.id ? '#bca27b' : '#d2bca0';
    const toWorld = pt => [wx + side * pt[0], wy + pt[1]];
    const toLocal = pt => [(pt.x - wx) * side, pt.y - wy];
    const stepDt = frozen || ghost ? 0 : Math.min(dt, 1 / 20);

    // Cloth chains are simulated in world space so they trail the body's real motion.
    const knotBand = [p.head[0] - Math.cos(p.headAngle) * 10 + Math.sin(p.headAngle) * 3, p.head[1] - Math.sin(p.headAngle) * 10 - Math.cos(p.headAngle) * 3];
    const beltBack = [p.hip[0] - Math.cos(p.spine[0]) * 9, p.hip[1] - Math.sin(p.spine[0]) * 2 - 12];
    if (!ghost && stepDt === 0) {
      this.band[0].follow(...toWorld(knotBand)); this.band[1].follow(...toWorld(knotBand));
      this.sash[0].follow(...toWorld(beltBack)); this.sash[1].follow(...toWorld([beltBack[0] - 2, beltBack[1] + 2]));
    }
    if (!ghost && (stepDt > 0 || !this.band[0].ready)) {
      this.band[0].step(...toWorld(knotBand), stepDt || 1 / 60, 1250, 0.93);
      this.band[1].step(...toWorld(knotBand), stepDt || 1 / 60, 1100, 0.925);
      this.sash[0].step(...toWorld(beltBack), stepDt || 1 / 60, 1300, 0.94);
      this.sash[1].step(...toWorld([beltBack[0] - 2, beltBack[1] + 2]), stepDt || 1 / 60, 1200, 0.935);
    }
    const ribbon = (chain, w0, w1) => {
      const pts = chain.pts.map(toLocal);
      c.strokeStyle = ink; c.lineCap = 'round'; c.lineJoin = 'round';
      for (let i = 1; i < pts.length; i++) {
        c.lineWidth = lerp(w0, w1, i / pts.length);
        c.beginPath(); c.moveTo(...pts[i - 1]); c.lineTo(...pts[i]); c.stroke();
      }
    };
    if (!ghost) { ribbon(this.band[0], 4.6, 1.8); ribbon(this.band[1], 4, 1.6); }

    // Rear arm and leg sit behind the torso.
    c.fillStyle = rear;
    this.arm(c, p.backShoulder, p.backElbow, p.backHand, 7.2, 5.6);
    this.leg(c, p, 'back');
    // Tunic skirts hang off the waist and lag the legs.
    c.fillStyle = ink;
    this.torso(c, p);
    this.skirt(c, p);
    this.leg(c, p, 'front');
    if (!ghost) { ribbon(this.sash[0], 4.4, 2); ribbon(this.sash[1], 3.6, 1.6); }
    this.headShape(c, p, ink, edge, ghost);
    c.fillStyle = ink;
    this.arm(c, p.frontShoulder, p.frontElbow, p.frontHand, 7.8, 5.9);
    if (!ghost) this.trim(c, p, edge);
    if (!ghost) this.recordTrails(p, f, wx, wy, side);
  }

  arm(c, shoulder, elbow, hand, w1, w2) {
    tube(c, [shoulder, elbow], [w1, (w1 + w2) / 2 + 0.2]);
    tube(c, [elbow, along(elbow, hand, 0.55), hand], [(w1 + w2) / 2 + 0.2, w2 + 0.9, w2 - 0.6]);
    c.beginPath(); c.arc(hand[0], hand[1], w2 + 1, 0, TWO_PI); c.fill();
  }

  leg(c, p, which) {
    const hip = p.hip, knee = p[which + 'Knee'], ankle = p[which + 'Foot'], a = p[which + 'FootAngle'];
    tube(c, [hip, along(hip, knee, 0.45), knee], [13.4, 12.6, 9.4]);
    tube(c, [knee, along(knee, ankle, 0.34), ankle], [9.4, 10.4, 5.6]);
    foot(c, ankle, a, BONES.foot + 2);
  }

  torso(c, p) {
    const [a1, a2] = p.spine;
    const nrm = a => [Math.cos(a), Math.sin(a)];
    const n1 = nrm(a1), n2 = nrm(a2);
    const mid = [lerp(p.waist[0], p.neck[0], 0.45), lerp(p.waist[1], p.neck[1], 0.45)];
    const nm = nrm((a1 + a2) / 2);
    // Back edge then front edge; the chest takes a deeper curve than the waist.
    const back = [
      [p.hip[0] - n1[0] * 11, p.hip[1] - n1[1] * 11],
      [p.waist[0] - n1[0] * 9.5, p.waist[1] - n1[1] * 9.5],
      [mid[0] - nm[0] * 14.5, mid[1] - nm[1] * 14.5],
      [p.neck[0] - n2[0] * 8, p.neck[1] - n2[1] * 8]
    ];
    const front = [
      [p.neck[0] + n2[0] * 8, p.neck[1] + n2[1] * 8],
      [mid[0] + nm[0] * 13.5, mid[1] + nm[1] * 13.5],
      [p.waist[0] + n1[0] * 10, p.waist[1] + n1[1] * 10],
      [p.hip[0] + n1[0] * 12, p.hip[1] + n1[1] * 12]
    ];
    c.beginPath();
    c.moveTo(...back[0]);
    c.quadraticCurveTo(...back[1], ...midpoint(back[1], back[2]));
    c.quadraticCurveTo(...back[2], ...midpoint(back[2], back[3]));
    c.lineTo(...back[3]);
    c.lineTo(...front[0]);
    c.quadraticCurveTo(...front[1], ...midpoint(front[1], front[2]));
    c.quadraticCurveTo(...front[2], ...midpoint(front[2], front[3]));
    c.lineTo(...front[3]);
    c.closePath();
    c.fill();
    // Neck.
    tube(c, [p.neck, along(p.neck, p.head, 0.6)], [6.6, 6]);
  }

  skirt(c, p) {
    const [a1] = p.spine;
    const n = [Math.cos(a1), Math.sin(a1)];
    const bf = p.frontKnee, bb = p.backKnee;
    const top = [p.hip[0] + n[0] * 12, p.hip[1] + n[1] * 12 - 6];
    const bot = [p.hip[0] - n[0] * 11, p.hip[1] - n[1] * 11 - 6];
    c.beginPath();
    c.moveTo(...top);
    c.quadraticCurveTo(lerp(top[0], bf[0], 0.6) + 3, lerp(top[1], bf[1], 0.6) - 4, lerp(p.hip[0], bf[0], 0.62) + 5, lerp(p.hip[1], bf[1], 0.62) + 1);
    c.lineTo(lerp(p.hip[0], bb[0], 0.5) - 4, lerp(p.hip[1], bb[1], 0.5) + 6);
    c.quadraticCurveTo(lerp(bot[0], bb[0], 0.6) - 5, lerp(bot[1], bb[1], 0.6) - 2, ...bot);
    c.closePath();
    c.fill();
  }

  headShape(c, p, ink, edge, ghost) {
    c.save();
    c.translate(p.head[0], p.head[1]);
    c.rotate(p.headAngle);
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(-10.5, -4);
    c.bezierCurveTo(-11.5, -13, -3, -17, 5, -14.5);
    c.bezierCurveTo(10.5, -13, 12, -8, 11.5, -3);
    c.lineTo(11.6, 0.6);
    c.lineTo(16, 4);          // nose
    c.lineTo(11.4, 6);
    c.bezierCurveTo(11, 11, 6, 14.5, -1, 14);
    c.bezierCurveTo(-8, 13, -11.5, 6, -10.5, -4);
    c.closePath();
    c.fill();
    c.beginPath(); c.ellipse(-10, -12, 7.5, 6.5, -0.5, 0, TWO_PI); c.fill();     // topknot
    if (!ghost) {
      c.strokeStyle = edge; c.globalAlpha = 0.7; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-10.5, -5); c.lineTo(11.6, -4.2); c.stroke();
      c.globalAlpha = 1;
    }
    c.restore();
  }

  trim(c, p, edge) {
    // Wrist wraps, belt and a faint rim light along the chest keep the shape readable.
    c.strokeStyle = edge; c.lineCap = 'round';
    c.globalAlpha = 0.5; c.lineWidth = 1.8;
    for (const [elbow, hand] of [[p.frontElbow, p.frontHand], [p.backElbow, p.backHand]]) {
      for (let i = 0; i < 3; i++) {
        const k = 0.7 + i * 0.09, wx = lerp(elbow[0], hand[0], k), wy = lerp(elbow[1], hand[1], k);
        const dx = hand[0] - elbow[0], dy = hand[1] - elbow[1], d = Math.hypot(dx, dy) || 1;
        c.beginPath(); c.moveTo(wx - dy / d * 4.4, wy + dx / d * 4.4); c.lineTo(wx + dy / d * 4.4, wy - dx / d * 4.4); c.stroke();
      }
    }
    c.globalAlpha = 0.7; c.lineWidth = 5;
    const [a1] = p.spine, n = [Math.cos(a1), Math.sin(a1)];
    c.beginPath(); c.moveTo(p.waist[0] - n[0] * 10, p.waist[1] - n[1] * 10 + 3); c.lineTo(p.waist[0] + n[0] * 11, p.waist[1] + n[1] * 11 + 3); c.stroke();
    c.globalAlpha = 0.14; c.strokeStyle = '#fff2d2'; c.lineWidth = 1.2;
    const [, a2] = p.spine, n2 = [Math.cos(a2), Math.sin(a2)];
    c.beginPath(); c.moveTo(p.neck[0] + n2[0] * 8, p.neck[1] + n2[1] * 8); c.lineTo(p.waist[0] + n[0] * 10, p.waist[1] + n[1] * 10); c.stroke();
    c.globalAlpha = 1;
  }

  recordTrails(p, f, wx, wy, side) {
    const t = this.trails, now = performance.now ? performance.now() : 0;
    const add = (key, pt) => {
      const arr = t[key];
      arr.push([wx + side * pt[0], wy + pt[1], now]);
      while (arr.length > 1 && now - arr[0][2] > 120) arr.shift();
      if (arr.length > 12) arr.shift();
    };
    add('frontHand', p.frontHand); add('backHand', p.backHand); add('frontToe', p.frontToe); add('backToe', p.backToe);
  }

  /** Brush-streak behind the limb that is actually moving fast, drawn in world space. */
  paintTrails(c, scale, f, dt) {
    if (!f.attack && f.state !== 'dodge') { return; }
    for (const key of Object.keys(this.trails)) {
      const arr = this.trails[key];
      if (arr.length < 3) continue;
      const a = arr[0], b = arr[arr.length - 1], span = Math.max(1, b[2] - a[2]);
      const speed = Math.hypot(b[0] - a[0], b[1] - a[1]) / span * 1000;
      if (speed < 520) continue;
      const alpha = Math.min(0.5, (speed - 520) / 1600);
      c.save();
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = f.attack?.m.cost ? '#fff1bf' : '#eadcc2';
      for (let i = 1; i < arr.length; i++) {
        const u = i / arr.length;
        c.globalAlpha = alpha * u;
        c.lineWidth = (1 + u * 7) * scale;
        c.beginPath();
        c.moveTo(arr[i - 1][0] * scale, arr[i - 1][1] * scale);
        c.lineTo(arr[i][0] * scale, arr[i][1] * scale);
        c.stroke();
      }
      c.restore();
    }
  }
}

function midpoint(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
