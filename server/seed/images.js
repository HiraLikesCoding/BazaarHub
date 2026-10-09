/**
 * Downloads the demo photos used by the seed data into
 * client/public/images/products so the site serves them locally.
 *
 * Retries a few times and falls back to a generated SVG placeholder when
 * the network is unavailable - seeding never fails because of images.
 */
const path = require('path');
const fs = require('fs');

const IMAGE_DIR = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'products');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

const unsplash = (id, w = 900) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${w}&fit=crop&q=75&fm=jpg`;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Circuit breaker: when the image host is rate limiting us we stop retrying
// for this run instead of spending minutes on timeouts.
const MAX_CONSECUTIVE_FAILURES = 4;
let consecutiveFailures = 0;

/** Call this to allow image downloads again after a run gave up early. */
function resetImageFailures() {
  consecutiveFailures = 0;
}

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * Makes sure <fileBase>.jpg exists locally. Returns the public path.
 * @returns {Promise<string>} e.g. "/images/products/aura-sound-headphones-1.jpg"
 */
async function ensureImage(fileBase, photoId, label, { retries = 3, timeout = 15000 } = {}) {
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const jpgPath = path.join(IMAGE_DIR, `${fileBase}.jpg`);
  const publicJpg = `/images/products/${fileBase}.jpg`;
  const publicSvg = `/images/products/${fileBase}.svg`;

  if (fs.existsSync(jpgPath)) return publicJpg;

  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    return writePlaceholder(svgPathFor(publicSvg), label, fileBase, publicSvg);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(unsplash(photoId), {
        headers: HEADERS,
        signal: AbortSignal.timeout(timeout),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 5000) throw new Error('file too small');
      fs.writeFileSync(jpgPath, buffer);
      consecutiveFailures = 0;
      const staleSvg = svgPathFor(publicSvg);
      if (fs.existsSync(staleSvg)) fs.unlinkSync(staleSvg); // drop the old placeholder
      await delay(350);
      return publicJpg;
    } catch (err) {
      consecutiveFailures++;
      if (attempt < retries) {
        await delay(1500 * attempt);
      } else {
        console.warn(`  ! image fallback for "${label}" (${err.message})`);
      }
    }
  }

  return writePlaceholder(svgPathFor(publicSvg), label, fileBase, publicSvg);
}

function svgPathFor(publicSvg) {
  return path.join(IMAGE_DIR, publicSvg.replace('/images/products/', ''));
}

function writePlaceholder(svgPath, label, fileBase, publicSvg) {
  if (!fs.existsSync(svgPath)) fs.writeFileSync(svgPath, placeholderSvg(label, fileBase));
  return publicSvg;
}

function placeholderSvg(label, seed) {
  const palettes = [
    ['#312e81', '#4f46e5'],
    ['#0f766e', '#14b8a6'],
    ['#7c2d12', '#ea580c'],
    ['#1e3a8a', '#3b82f6'],
    ['#701a75', '#c026d3'],
    ['#134e4a', '#2dd4bf'],
  ];
  const [c1, c2] = palettes[Math.abs(hash(seed)) % palettes.length];
  const words = String(label).split(' ').slice(0, 3);
  const lines = words
    .map(
      (w, i) =>
        `<text x="400" y="${470 + i * 44}" font-size="32" fill="#fff" text-anchor="middle" font-family="Arial, sans-serif">${escapeXml(w)}</text>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="800" fill="url(#g)"/><circle cx="400" cy="330" r="120" fill="rgba(255,255,255,0.14)"/><text x="400" y="355" font-size="96" text-anchor="middle">🛍️</text>${lines}</svg>`;
}

function escapeXml(s) {
  return String(s).replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c])
  );
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}

module.exports = { ensureImage, resetImageFailures, IMAGE_DIR, slugify };
