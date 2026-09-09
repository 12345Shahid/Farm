// Human-like mouse movements using Bezier curves

/**
 * Generate a cubic Bezier curve path between two points
 * @param {number} x1 - start x
 * @param {number} y1 - start y
 * @param {number} x2 - end x
 * @param {number} y2 - end y
 * @param {number} steps - number of points (randomized)
 * @returns {Array<{x: number, y: number}>}
 */
function bezierPath(x1, y1, x2, y2, steps = null) {
  if (steps === null) steps = 15 + Math.floor(Math.random() * 20);
  
  // Control points — offset randomly to create curve
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const offset = dist * (0.2 + Math.random() * 0.4);
  const angle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * Math.PI * 0.6;
  
  const cp1x = x1 + offset * Math.cos(angle) * 0.5 + (Math.random() - 0.5) * offset * 0.3;
  const cp1y = y1 + offset * Math.sin(angle) * 0.5 + (Math.random() - 0.5) * offset * 0.3;
  const cp2x = x2 - offset * Math.cos(angle) * 0.5 + (Math.random() - 0.5) * offset * 0.3;
  const cp2y = y2 - offset * Math.sin(angle) * 0.5 + (Math.random() - 0.5) * offset * 0.3;

  const points = [];
  for (let t = 0; t <= 1; t += 1 / steps) {
    const mt = 1 - t;
    const x = mt*mt*mt*x1 + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*x2;
    const y = mt*mt*mt*y1 + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*y2;
    points.push({ x: Math.round(x), y: Math.round(y) });
  }
  // Ensure last point is exact target
  points[points.length - 1] = { x: Math.round(x2), y: Math.round(y2) };
  return points;
}

/**
 * Move mouse along a human-like Bezier curve
 * @param {import('playwright').Page} page
 * @param {number} x - target x
 * @param {number} y - target y
 */
async function humanMouseMove(page, x, y) {
  // 1. Hesitation before movement (human reaction time)
  await page.waitForTimeout(300 + Math.random() * 1200);
  
  // Get current mouse position
  const currentPos = await page.evaluate(() => ({ x: window.mouseX || 0, y: window.mouseY || 0 }));
  
  // Track mouse position
  await page.evaluate(() => {
    document.addEventListener('mousemove', e => { window.mouseX = e.screenX; window.mouseY = e.screenY; }, { passive: true });
  });

  const path = bezierPath(currentPos.x, currentPos.y, x, y);
  
  for (const point of path) {
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(5 + Math.random() * 15); // variable speed
  }

  // 2. Hover delay before click (as if reading the button)
  await page.waitForTimeout(400 + Math.random() * 1100);
}

/**
 * Human-like click at coordinates (tap for mobile, click for desktop)
 */
async function humanClick(page, x, y) {
  await humanMouseMove(page, x, y);
  // Use JavaScript click event (works on both mobile and desktop)
  await page.evaluate(([cx, cy]) => {
    const el = document.elementFromPoint(cx, cy);
    if (el) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }
  }, [x, y]);
}

/**
 * Click element identified by selector with human behavior
 */
async function humanClickSelector(page, selector) {
  const el = await page.locator(selector);
  const box = await el.boundingBox();
  if (!box) throw new Error(`Element ${selector} not visible`);
  // Click slightly off-center (human imperfection)
  const offsetX = (Math.random() - 0.5) * box.width * 0.3;
  const offsetY = (Math.random() - 0.5) * box.height * 0.3;
  await humanClick(page, box.x + box.width / 2 + offsetX, box.y + box.height / 2 + offsetY);
}

/**
 * Type text with randomized delays
 */
async function humanType(page, selector, text) {
  await page.locator(selector).click();
  await page.waitForTimeout(100 + Math.random() * 200);
  for (const char of text) {
    await page.keyboard.type(char, { delay: 30 + Math.random() * 120 });
  }
}

module.exports = { bezierPath, humanMouseMove, humanClick, humanClickSelector, humanType };