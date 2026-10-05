/**
 * Generates the PWA icon set for AegisWatch.
 *
 *   node scripts/generate-pwa-icons.mjs
 *
 * Why this exists: the repository only shipped `logo.png`, which is actually a
 * JPEG renamed to .png, so there were no valid PNG icons for the web app
 * manifest. This script draws the radar mark with plain maths and encodes
 * real PNGs using Node's built-in zlib — no image libraries required.
 *
 * Outputs (into public/icons/):
 *   icon-192.png, icon-512.png  – standard "any" icons
 *   maskable-512.png            – safety-padded for Android adaptive shapes
 *   apple-touch-icon.png        – iOS home-screen icon
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'frontend', 'public', 'icons');

// Brand tokens (mirrored from tailwind.config.js).
const BG = [0x0a, 0x0e, 0x16];
const PRIMARY = [0x4c, 0xd7, 0xf6];
const AMBER = [0xff, 0xb9, 0x5f];
const ALERT = [0xff, 0xb4, 0xab];

// ---------------------------------------------------------------------------
// PNG encoding
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** Encodes an RGBA byte array as a PNG buffer. */
function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: truecolour + alpha
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // Raw scanlines, each prefixed with filter byte 0.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1
    );
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Linear coverage ramp: 1 inside `inner`, 0 beyond `outer`. */
const ramp = (d, inner, outer) => clamp01((outer - d) / (outer - inner));

function normalizeAngle(a) {
  const t = a % (Math.PI * 2);
  return t < 0 ? t + Math.PI * 2 : t;
}

/**
 * Renders the radar mark at `size` px. `contentScale` shrinks the artwork so
 * maskable icons stay inside Android's circular safe zone.
 * Supersamples then box-downsamples for anti-aliasing.
 */
function renderIcon(size, contentScale = 1) {
  const ss = size <= 256 ? 4 : 2;
  const n = size * ss;
  const acc = new Float64Array(size * size * 4);

  const cx = n / 2;
  const cy = n / 2;
  const R = (n / 2) * contentScale; // radius available to the artwork
  const ringWidth = R * 0.035; // half-thickness of each ring
  const rings = [
    { r: R * 0.82, alpha: 0.55 },
    { r: R * 0.56, alpha: 0.8 },
    { r: R * 0.3, alpha: 0.95 },
  ];
  const sweepStart = -Math.PI / 2 - Math.PI * 0.12; // just left of 12 o'clock
  const sweepSpan = Math.PI * 0.34;
  const blips = [
    { dist: rings[0].r, angle: -Math.PI * 0.3, color: AMBER, size: R * 0.045 },
    { dist: rings[1].r, angle: Math.PI * 0.62, color: ALERT, size: R * 0.038 },
  ];

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // Background: subtle vertical gradient from surface-lowest to surface.
      const t = y / n;
      let r = BG[0] + t * 0x05;
      let g = BG[1] + t * 0x05;
      let b = BG[2] + t * 0x06;
      let a = 1;

      const over = (color, alpha) => {
        if (alpha <= 0) return;
        r = color[0] * alpha + r * (1 - alpha);
        g = color[1] * alpha + g * (1 - alpha);
        b = color[2] * alpha + b * (1 - alpha);
        a = alpha + a * (1 - alpha);
      };

      // Radar sweep wedge (drawn first so rings sit on top).
      if (dist < R * 0.95) {
        const delta = normalizeAngle(angle - sweepStart);
        if (delta <= sweepSpan) {
          const radialFade = 1 - dist / (R * 0.95);
          const edgeFade = 1 - delta / sweepSpan;
          over(PRIMARY, 0.3 * radialFade * (0.35 + 0.65 * edgeFade));
        }
      }

      // Concentric range rings.
      for (const ring of rings) {
        const cov = ramp(Math.abs(dist - ring.r), 0, ringWidth);
        if (cov > 0) over(PRIMARY, cov * ring.alpha);
      }

      // Centre blip.
      const centreCov = ramp(dist, 0, R * 0.055);
      if (centreCov > 0) over(PRIMARY, centreCov);

      // Tracked contacts.
      for (const blip of blips) {
        const bx = cx + Math.cos(blip.angle) * blip.dist;
        const by = cy + Math.sin(blip.angle) * blip.dist;
        const cov = ramp(Math.hypot(x + 0.5 - bx, y + 0.5 - by), 0, blip.size);
        if (cov > 0) over(blip.color, cov);
      }

      // Downsample into the accumulator.
      const ox = Math.floor(x / ss);
      const oy = Math.floor(y / ss);
      const idx = (oy * size + ox) * 4;
      acc[idx] += r;
      acc[idx + 1] += g;
      acc[idx + 2] += b;
      acc[idx + 3] += a;
    }
  }

  const samples = ss * ss;
  const out = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < out.length; i++) out[i] = Math.round(acc[i] / samples);
  return out;
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  { file: 'maskable-512.png', size: 512, scale: 0.72 },
  { file: 'apple-touch-icon.png', size: 180, scale: 0.88 },
];

for (const { file, size, scale } of targets) {
  const png = encodePng(size, size, renderIcon(size, scale));
  writeFileSync(join(OUT_DIR, file), png);
  console.log(`${file.padEnd(22)} ${size}x${size}  ${(png.length / 1024).toFixed(1)}KB`);
}
