// Layer 1: DOM Sniper — find ad buttons by text with zero computation

const SKIP_KEYWORDS = ['Skip', 'Skip Ad', 'Close', 'Dismiss', 'X', '×'];
const CTA_KEYWORDS = ['Install', 'Download', 'Get', 'Play Now', 'Trade Now', 'Claim', 'Learn More', 'Open'];
const ALL_KEYWORDS = [...SKIP_KEYWORDS, ...CTA_KEYWORDS];

/**
 * Search DOM for visible ad buttons
 * @param {import('playwright').Page} page
 * @returns {{ skip: {x: number, y: number} | null, cta: {x: number, y: number} | null }}
 */
async function scanDom(page) {
  const result = { skip: null, cta: null };

  // Check all iframes too
  const frames = page.frames();
  
  for (const frame of frames) {
    try {
      // Look for buttons and divs that act as buttons
      for (const keyword of ALL_KEYWORDS) {
        const els = await frame.locator(`button:has-text("${keyword}"), [role="button"]:has-text("${keyword}"), div:has-text("${keyword}")`).all();
        
        for (const el of els) {
          const visible = await el.isVisible().catch(() => false);
          if (!visible) continue;
          
          const box = await el.boundingBox().catch(() => null);
          if (!box) continue;

          // Check size — should be button-sized
          if (box.width < 20 || box.height < 15 || box.width > 500 || box.height > 200) continue;

          const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
          
          if (SKIP_KEYWORDS.some(k => keyword.includes(k) || keyword === k)) {
            result.skip = center;
          } else if (CTA_KEYWORDS.some(k => keyword.includes(k) || keyword === k)) {
            result.cta = center;
          }
        }
      }
    } catch (e) {
      // Cross-origin iframe — skip, Pixel Engine handles this
    }
  }

  return result;
}

/**
 * Check if a rewarded ad overlay is visible on the page
 */
async function isAdOverlayVisible(page) {
  try {
    return await page.locator('#video-ad-overlay, #cta-overlay').first().isVisible({ timeout: 200 }).catch(() => false);
  } catch { return false; }
}

module.exports = { scanDom, isAdOverlayVisible, SKIP_KEYWORDS, CTA_KEYWORDS };