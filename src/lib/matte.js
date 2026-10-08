// Mask refinement for cut-outs. Everything here works on the alpha channel (plus a colour fix on the soft edge)
// and runs in the visitor's browser. The model gives a rough mask at low resolution; these steps pull it back
// onto the real edges of the photo, remove stray pieces and clear the bright halo that backlit photos leave.

// Fast box average (running sums), edge-clamped. src and dst are w*h Float32Arrays.
function boxBlur(src, dst, w, h, r, tmp) {
  const t = tmp || new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      t[row + x] = sum / (2 * r + 1);
      sum += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += t[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = sum / (2 * r + 1);
      sum += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x];
    }
  }
  return dst;
}

// Edge-aware upsampling: makes the mask follow the brightness edges of the real photo (hair strands, fingers).
// This is the guided filter (He et al.) with the photo's brightness as the guide.
function guidedFilter(guide, p, w, h, r, eps) {
  const n = w * h;
  const tmp = new Float32Array(n);
  const mI = boxBlur(guide, new Float32Array(n), w, h, r, tmp);
  const mp = boxBlur(p, new Float32Array(n), w, h, r, tmp);
  const ip = new Float32Array(n), ii = new Float32Array(n);
  for (let i = 0; i < n; i++) { ip[i] = guide[i] * p[i]; ii[i] = guide[i] * guide[i]; }
  const mIp = boxBlur(ip, new Float32Array(n), w, h, r, tmp);
  const mII = boxBlur(ii, new Float32Array(n), w, h, r, tmp);
  const a = new Float32Array(n), b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const cov = mIp[i] - mI[i] * mp[i];
    const v = mII[i] - mI[i] * mI[i];
    a[i] = cov / (v + eps);
    b[i] = mp[i] - a[i] * mI[i];
  }
  const ma = boxBlur(a, new Float32Array(n), w, h, r, tmp);
  const mb = boxBlur(b, new Float32Array(n), w, h, r, tmp);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.min(1, Math.max(0, ma[i] * guide[i] + mb[i]));
  return out;
}

// Keeps the main subject: drops pieces smaller than 4% of the biggest one (and soft pixels far from it),
// and fills small holes inside the subject.
function keepSubject(a, w, h) {
  const n = w * h;
  const solid = new Uint8Array(n);
  for (let i = 0; i < n; i++) solid[i] = a[i] > 0.5 ? 1 : 0;
  const label = new Int32Array(n);
  const areas = [0], kinds = [0], border = [false];
  const stack = new Int32Array(n);
  let next = 1;
  for (let s = 0; s < n; s++) {
    if (label[s]) continue;
    const kind = solid[s];
    let top = 0, area = 0, edge = false;
    stack[top++] = s; label[s] = next;
    while (top) {
      const p = stack[--top];
      area++;
      const x = p % w, y = (p - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
      if (x > 0 && !label[p - 1] && solid[p - 1] === kind) { label[p - 1] = next; stack[top++] = p - 1; }
      if (x < w - 1 && !label[p + 1] && solid[p + 1] === kind) { label[p + 1] = next; stack[top++] = p + 1; }
      if (y > 0 && !label[p - w] && solid[p - w] === kind) { label[p - w] = next; stack[top++] = p - w; }
      if (y < h - 1 && !label[p + w] && solid[p + w] === kind) { label[p + w] = next; stack[top++] = p + w; }
    }
    areas.push(area); kinds.push(kind); border.push(edge);
    next++;
  }
  let biggest = 0;
  for (let l = 1; l < next; l++) if (kinds[l] === 1 && areas[l] > biggest) biggest = areas[l];
  const keep = new Float32Array(n);
  for (let i = 0; i < n; i++) { const l = label[i]; if (kinds[l] === 1 && areas[l] >= biggest * 0.04) keep[i] = 1; }
  const reach = Math.max(3, Math.round(Math.max(w, h) / 170));
  const near = boxBlur(keep, new Float32Array(n), w, h, reach);
  const fillBelow = n * 0.004;
  for (let i = 0; i < n; i++) {
    const l = label[i];
    if (near[i] <= 0) a[i] = 0;
    else if (kinds[l] === 0 && !border[l] && areas[l] < fillBelow) a[i] = 1;
  }
  return a;
}

// Replaces the colour of soft-edge pixels with the colour of the solid subject next to them, so the old
// background (bright sky behind dark hair) does not show as a white fringe on the cut-out. Pixels with no solid
// neighbour within the first radius are tried again with a wider one.
function decontaminate(data, a, w, h, r1, r2) {
  const n = w * h;
  const tmp = new Float32Array(n);
  const wt = new Float32Array(n);
  for (let i = 0; i < n; i++) wt[i] = a[i] > 0.97 ? 1 : 0;
  const done = new Uint8Array(n);
  const ch = new Float32Array(n), blurred = new Float32Array(n);
  const fixed = new Float32Array(n * 3);
  for (const r of [r1, r2]) {
    const den = boxBlur(wt, new Float32Array(n), w, h, r, tmp);
    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < n; i++) ch[i] = data[i * 4 + c] * wt[i];
      boxBlur(ch, blurred, w, h, r, tmp);
      for (let i = 0; i < n; i++) if (!done[i] && a[i] < 0.97 && a[i] > 0 && den[i] > 0.02) fixed[i * 3 + c] = Math.min(255, blurred[i] / den[i]);
    }
    for (let i = 0; i < n; i++) if (!done[i] && a[i] < 0.97 && a[i] > 0 && den[i] > 0.02) done[i] = 1;
  }
  for (let i = 0; i < n; i++) if (done[i]) { data[i * 4] = fixed[i * 3]; data[i * 4 + 1] = fixed[i * 3 + 1]; data[i * 4 + 2] = fixed[i * 3 + 2]; }
}

// Backlit photos: the mask often keeps a patch of bright sky between hair strands. Near the edge, a pixel that is
// much brighter than the dark subject beside it is treated as background and faded out.
function suppressBrightHalo(data, a, w, h, scale) {
  const n = w * h;
  const tmp = new Float32Array(n);
  const lum = new Float32Array(n), solid = new Float32Array(n);
  for (let i = 0; i < n; i++) { lum[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255; solid[i] = a[i] > 0.97 ? 1 : 0; }
  const eroded = boxBlur(solid, new Float32Array(n), w, h, Math.max(2, Math.round(8 * scale)), tmp);
  const core = new Float32Array(n), lc = new Float32Array(n);
  for (let i = 0; i < n; i++) { core[i] = eroded[i] > 0.999 ? 1 : 0; lc[i] = lum[i] * core[i]; }
  const rm = Math.max(6, Math.round(25 * scale));
  const den = boxBlur(core, new Float32Array(n), w, h, rm, tmp);
  const mean = boxBlur(lc, new Float32Array(n), w, h, rm, tmp);
  for (let i = 0; i < n; i++) {
    if (core[i] || den[i] <= 0.01 || lum[i] <= 0.45) continue;
    const m = mean[i] / den[i];
    if (m >= 0.4) continue;
    const k = Math.min(1, Math.max(0, 1 - (lum[i] - m - 0.25) / 0.2));
    a[i] *= k;
  }
}

// Turns a rough mask (Float32Array 0..1 at full photo size) into a finished cut-out. Returns the same ImageData.
export function finishMatte(imageData, mask) {
  const { width: w, height: h, data } = imageData;
  const n = w * h;
  const scale = Math.max(w, h) / 1040;
  const guide = new Float32Array(n);
  for (let i = 0; i < n; i++) guide[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
  const radius = Math.max(2, Math.round(6 * scale));
  const a = guidedFilter(guide, mask, w, h, radius, 2e-3);
  for (let i = 0; i < n; i++) {
    const t = Math.min(1, Math.max(0, (a[i] - 0.15) / 0.77));
    a[i] = t * t * (3 - 2 * t);
  }
  keepSubject(a, w, h);
  suppressBrightHalo(data, a, w, h, scale);
  keepSubject(a, w, h);
  decontaminate(data, a, w, h, Math.max(3, Math.round(7 * scale)), Math.max(6, Math.round(21 * scale)));
  for (let i = 0; i < n; i++) data[i * 4 + 3] = Math.round(a[i] * 255);
  return imageData;
}

// General objects and animals: sharpen the soft fringe, remove stray specks and tiny holes, feather one pixel.
// Cleans up a cut-out mask: sharpens the soft fringe, removes stray specks and tiny holes, then feathers the edge by one pixel.
// Works on the alpha channel only, so the colors of the photo are never changed.
export function cleanAlpha(imageData) {
  const { width: w, height: h, data } = imageData;
  const n = w * h;
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = data[i * 4 + 3] / 255;
    // smoothstep between 0.18 and 0.82: weak, noisy alpha goes to 0 and strong alpha to 1.
    const t = Math.min(1, Math.max(0, (v - 0.18) / 0.64));
    a[i] = t * t * (3 - 2 * t);
  }
  const solid = new Uint8Array(n);
  for (let i = 0; i < n; i++) solid[i] = a[i] > 0.5 ? 1 : 0;

  // Label connected regions of the same kind (4-neighbour) with a flood fill.
  const label = new Int32Array(n);
  const areas = [0];
  const kinds = [0];
  const touchesBorder = [false];
  const stack = new Int32Array(n);
  let next = 1;
  for (let s = 0; s < n; s++) {
    if (label[s]) continue;
    const kind = solid[s];
    let top = 0, area = 0, border = false;
    stack[top++] = s; label[s] = next;
    while (top) {
      const p = stack[--top];
      area++;
      const x = p % w, y = (p - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border = true;
      if (x > 0 && !label[p - 1] && solid[p - 1] === kind) { label[p - 1] = next; stack[top++] = p - 1; }
      if (x < w - 1 && !label[p + 1] && solid[p + 1] === kind) { label[p + 1] = next; stack[top++] = p + 1; }
      if (y > 0 && !label[p - w] && solid[p - w] === kind) { label[p - w] = next; stack[top++] = p - w; }
      if (y < h - 1 && !label[p + w] && solid[p + w] === kind) { label[p + w] = next; stack[top++] = p + w; }
    }
    areas.push(area); kinds.push(kind); touchesBorder.push(border);
    next++;
  }
  let biggest = 0;
  for (let l = 1; l < next; l++) if (kinds[l] === 1 && areas[l] > biggest) biggest = areas[l];
  const dropSolid = biggest * 0.02;      // specks smaller than 2% of the subject
  const fillHole = n * 0.004;            // enclosed holes smaller than 0.4% of the picture
  for (let i = 0; i < n; i++) {
    const l = label[i];
    if (kinds[l] === 1 && areas[l] < dropSolid) a[i] = 0;
    else if (kinds[l] === 0 && !touchesBorder[l] && areas[l] < fillHole) a[i] = 1;
  }

  // One pixel feather: average with the 4 neighbours, only near the edge.
  const out = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const c = a[i];
      const l = x > 0 ? a[i - 1] : c, r = x < w - 1 ? a[i + 1] : c, u = y > 0 ? a[i - w] : c, d = y < h - 1 ? a[i + w] : c;
      out[i] = c === l && c === r && c === u && c === d ? c : (c * 2 + l + r + u + d) / 6;
    }
  }
  for (let i = 0; i < n; i++) data[i * 4 + 3] = Math.round(out[i] * 255);
  return imageData;
}
