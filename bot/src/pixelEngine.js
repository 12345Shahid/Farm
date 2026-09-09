// Layer 2: Pixel Engine — find ad buttons using screenshots + OCR when DOM fails
// Uses sharp for image processing and tesseract.js for OCR

const sharp = require('sharp');
const Tesseract = require('tesseract.js');

/**
 * Find button-sized rectangular regions in an image buffer
 * @param {Buffer} imageBuffer - PNG screenshot buffer
 * @param {number} width - image width
 * @param {number} height - image height
 * @returns {Array<{x: number, y: number, w: number, h: number}>}
 */
async function findButtonShapes(imageBuffer, width, height) {
  // Convert to grayscale and threshold
  const { data, info } = await sharp(imageBuffer)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const stride = info.width;

  // Edge detection: simple gradient magnitude
  const edges = new Float32Array(pixels.length);
  for (let y = 1; y < info.height - 1; y++) {
    for (let x = 1; x < info.width - 1; x++) {
      const idx = y * stride + x;
      const gx = pixels[idx + 1] - pixels[idx - 1];
      const gy = pixels[(y + 1) * stride + x] - pixels[(y - 1) * stride + x];
      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // Find connected regions of high edge density
  const threshold = 80;
  const visited = new Uint8Array(pixels.length);
  const regions = [];

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = y * stride + x;
      if (visited[idx] || edges[idx] < threshold) continue;

      // Flood fill
      const stack = [{ x, y }];
      visited[idx] = 1;
      let minX = x, maxX = x, minY = y, maxY = y;
      let count = 0;

      while (stack.length > 0) {
        const p = stack.pop();
        const pi = p.y * stride + p.x;
        if (edges[pi] < threshold) continue;
        count++;
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);

        const neighbors = [
          { x: p.x - 1, y: p.y }, { x: p.x + 1, y: p.y },
          { x: p.x, y: p.y - 1 }, { x: p.x, y: p.y + 1 },
        ];
        for (const n of neighbors) {
          if (n.x >= 0 && n.x < info.width && n.y >= 0 && n.y < info.height) {
            const ni = n.y * stride + n.x;
            if (!visited[ni]) {
              visited[ni] = 1;
              stack.push(n);
            }
          }
        }
      }

      if (count < 20) continue; // noise

      const w = maxX - minX;
      const h = maxY - minY;

      // Filter for button-sized rectangles (50x50 to 200x200)
      if (w < 30 || h < 20 || w > 400 || h > 300) continue;
      // Aspect ratio check — buttons are roughly 1:1 to 5:1
      const ratio = w / h;
      if (ratio < 0.5 || ratio > 6) continue;

      regions.push({ x: minX, y: minY, w, h });
    }
  }

  return regions;
}

/**
 * Run OCR on screenshot and return text with coordinates
 * @param {Buffer} imageBuffer
 * @returns {Array<{text: string, x: number, y: number, w: number, h: number}>}
 */
async function runOcr(imageBuffer) {
  const result = await Tesseract.recognize(imageBuffer, 'eng', {
    logger: () => {}, // silence logger
  });

  const words = [];
  for (const word of result.data.words) {
    if (word.text.trim().length < 1) continue;
    const bbox = word.bbox;
    words.push({
      text: word.text.trim(),
      x: bbox.x0,
      y: bbox.y0,
      w: bbox.x1 - bbox.x0,
      h: bbox.y1 - bbox.y0,
    });
  }
  return words;
}

/**
 * Check if a word matches any skip or CTA keyword
 */
function matchesKeyword(word) {
  const lower = word.text.toLowerCase();
  const skipWords = ['skip', 'close', 'dismiss', 'x'];
  const ctaWords = ['install', 'download', 'get', 'play', 'trade', 'claim', 'learn', 'open', 'start', 'bonus'];
  
  for (const kw of skipWords) {
    if (lower.includes(kw) || lower === kw) return 'skip';
  }
  for (const kw of ctaWords) {
    if (lower.includes(kw) || lower === kw) return 'cta';
  }
  return null;
}

/**
 * Full Pixel Engine detection
 * Takes screenshot → finds shapes → runs OCR → matches
 * @param {import('playwright').Page} page
 * @returns {{ skip: {x: number, y: number} | null, cta: {x: number, y: number} | null }}
 */
async function detectAds(page) {
  const result = { skip: null, cta: null };

  // Take screenshot
  const screenshot = await page.screenshot({ type: 'png', fullPage: false });
  const metadata = await sharp(screenshot).metadata();
  const width = metadata.width;
  const height = metadata.height;

  // Run shape detection and OCR in parallel
  const [shapes, words] = await Promise.all([
    findButtonShapes(screenshot, width, height),
    runOcr(screenshot),
  ]);

  // Match words to shapes
  for (const word of words) {
    const type = matchesKeyword(word);
    if (!type) continue;

    const wordCenterX = word.x + word.w / 2;
    const wordCenterY = word.y + word.h / 2;
    const wordArea = word.w * word.h;

    // Find the shape that contains this word
    for (const shape of shapes) {
      if (
        wordCenterX >= shape.x && wordCenterX <= shape.x + shape.w &&
        wordCenterY >= shape.y && wordCenterY <= shape.y + shape.h
      ) {
        const btnCenter = { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 };
        if (type === 'skip' && !result.skip) result.skip = btnCenter;
        if (type === 'cta' && !result.cta) result.cta = btnCenter;
      }
    }

    // If no shape match, use word's own center (better than nothing)
    if (type === 'skip' && !result.skip) {
      result.skip = { x: wordCenterX, y: wordCenterY };
    }
    if (type === 'cta' && !result.cta) {
      result.cta = { x: wordCenterX, y: wordCenterY };
    }
  }

  return result;
}

module.exports = { detectAds, findButtonShapes, runOcr };