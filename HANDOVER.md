# Ghost Farm — Project Handover Document

## Current State: Phase 1 (Days 1-3) Complete ✅

The Ghost Farm is an automated traffic-generation system using AI-driven web bots that simulate mobile game players. It consists of two independent deployments:

- **Game:** Next.js PWA ("Crypto Trader Tycoon") deployed on Vercel
- **Bot Farm:** Node.js Playwright-based orchestrator deployed on Railway

---

## Repository

**GitHub:** `https://github.com/12345Shahid/Farm`

### Directory Structure

```
farm/
├── bot/                          # Bot farm — Railway deployment
│   ├── src/
│   │   ├── orchestrator.js       # Master control — spawns bots, shift scheduling, warmup
│   │   ├── worker.js             # Single bot — browser launch, game browsing, ad pipeline
│   │   ├── proxyManager.js       # Dual-mode proxy (Webshare + Urban VPN)
│   │   ├── bezierMouse.js        # Human-like mouse movements (cubic Bezier curves)
│   │   ├── canvasNoise.js        # Unique Canvas/WebGL/Audio fingerprint per bot
│   │   ├── chaosEngine.js        # Behavioral randomization (weighted action selection)
│   │   ├── domSniper.js          # Layer 1 ad detection — scans DOM/iframes for keywords
│   │   ├── pixelEngine.js        # Layer 2 ad detection — screenshot + edge detection + OCR
│   │   └── identity.js           # 150 bot profiles (8 devices × 7 regions)
│   ├── config/
│   │   ├── proxies.json          # 50 Webshare proxy entries (10 unique IPs × 5 accounts)
│   │   └── proxies.json.example  # Template for proxy format
│   ├── extensions/
│   │   ├── urban-vpn/            # Unpacked Urban VPN extension (manifest v3)
│   │   └── hola-vpn/             # Unpacked Hola VPN extension
│   ├── test-proxyManager.js      # Automated test suite (5 modes)
│   ├── test-worker.js            # Worker end-to-end test (2 bots)
│   ├── test-bot.js               # Single bot integration test
│   ├── test-orchestrator.js      # Orchestrator sequential test
│   ├── Dockerfile                # Railway container build
│   ├── railway.json              # Railway config (Docker builder, 1GB RAM)
│   └── package.json              # Dependencies: playwright, sharp, tesseract.js
├── game/                         # Crypto Trader Tycoon (Next.js PWA)
│   ├── app/                      # Next.js app router
│   ├── components/               # Game UI + Ad components
│   └── test-game.js              # 58 Playwright tests (all pass)
├── REPORT.md                     # Build report & architecture analysis
├── context.md                    # Original mentor briefing document
└── .gitignore
```

---

## What Currently Works

### Phase 1 — Days 1-3 (Stealth Warmup) 🟢 LIVE

| Feature | Status |
|---|---|
| 5 bots per Railway account × 2 accounts = 10 bots/day | ✅ Running |
| Webshare datacenter proxies (10 unique IPs) | ✅ All 50 entries tested alive |
| Game loads through proxy | ✅ Verified |
| Zero ad interaction (browse only) | ✅ MAX_ADS=0 |
| Canvas fingerprint injection | ✅ Per bot |
| 150 unique identity profiles | ✅ Generated at startup |
| Shift scheduling (8-14 UTC) | ✅ Shift A active |
| Session cap (3 sessions/bot/day) | ✅ Cycles 1-3 complete, then stops |
| Orchestrator health monitoring | ✅ Logs sessions, ads, errors |
| Sleep between cycles (7-15 min) | ✅ Randomized |

### Proven by Production Logs

```
3 cycles × 5 bots = 15 sessions
0 ads served
0 errors
All bots loaded game through UK/US/ES proxies
```

---

## Environment Variables (Railway)

Copy these exactly into Railway dashboard:

```
ORCHESTRATOR_MODE=warmup
ORCHESTRATOR_DAY=1
PROXY_MODE=webshare
MAX_BOTS=5
MAX_ADS=0
GAME_URL=https://typocoin.vercel.app
```

**For second Railway account:** same values, just deploy from same repo with root directory set to `bot/`.

---

## Deployment Instructions

### Railway Setup (Phase 1 — Days 1-3)

1. Create Railway account
2. New Project → Deploy from GitHub → `12345Shahid/Farm`
3. In Railway settings, set **Root Directory** to `bot/`
4. Add all environment variables from above
5. Railway auto-detects Dockerfile and builds
6. No manual file upload — proxies.json is in the repo

### GCP Setup (Phase 2 — Days 4+)

When scaling to 50+ bots:
1. Create GCP VM (e2-standard-4, 16GB RAM)
2. Run `sudo apt update && sudo apt install -y xvfb`
3. Install Node.js 20+: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`
4. Clone repo and install deps
5. Start Xvfb: `Xvfb :99 -screen 0 1920x1080x24 & export DISPLAY=:99`
6. Run: `PROXY_MODE=urban ORCHESTRATOR_MODE=full node src/orchestrator.js`

---

## Architecture

### Bot Flow (worker.js)

```
Launch browser → Load game → Browse pages → [Ad cycle × N] → Close
                              ↓
              game pages: dashboard, trade, portfolio, settings
```

### Ad Cycle (for Phase 2 when MAX_ADS > 0)

```
Click "Claim Bonus" → Wait for video overlay → Wait 3s for skip button
→ Click skip → Wait for CTA overlay → Click CTA → Wait 5-10s on advertiser page
→ Close tab → Return to game
```

### Detection Layers

| Layer | Method | Cost |
|---|---|---|
| DOM Sniper | Scan DOM/iframes for button text | Zero CPU |
| Pixel Engine | Screenshot → Edge detection → OCR | ~50ms |

### Mouse Movement (bezierMouse.js)

- Cubic Bezier curves with randomized control points
- Hesitation before movement (300-1200ms)
- Hover delay before click (400-1100ms)

### Proxy System (proxyManager.js)

**Mode 1: Webshare** (Phase 1 — Days 1-3)
- Headless Playwright with `proxy` config
- 50 entries from 5 accounts (10 unique IPs)
- Round-robin assignment, health checks

**Mode 2: Urban VPN** (Phase 2 — Days 4+)
- Headed Playwright with extension loaded
- Extension already unpacked at `extensions/urban-vpn/`
- Navigate popup, select region, connect
- IP verification via api.ipify.org

---

## Test Commands

Run from `bot/` directory:

```bash
# Unit tests (no credentials needed)
node test-proxyManager.js --mode=unit

# IP verification test
node test-proxyManager.js --mode=ip

# Proxy health check
node test-proxyManager.js --mode=health --proxy-file=./config/proxies.json

# Worker end-to-end (2 bots, no ads)
node test-worker.js

# Orchestrator test
node test-orchestrator.js
```

---

## What's Built But Not Yet Used

| Component | File | Why Not Used Yet |
|---|---|---|
| Chaos Engine | `chaosEngine.js` | For Phase 2 when behavioral variety matters |
| DOM Sniper | `domSniper.js` | Not needed for Phase 1 (no ad interaction) |
| Pixel Engine | `pixelEngine.js` | Not needed until real ad networks serve dynamic ads |
| Urban VPN extension | `extensions/urban-vpn/` | Requires Xvfb + headed mode — Phase 2 |
| Real ad SDKs | N/A | Simulated ads in game — replace with Adsterra/Monetag codes |

---

## Known Limitations

1. **10 unique IPs only** — Webshare free pool. Fine for 5-10 bots Days 1-3. Need Urban VPN or paid proxies for 50-150 bots.
2. **Railway 1GB RAM** — Supports ~5-10 headless Chrome instances. GCP 16GB needed for scale.
3. **Simulated ads** — Game has mock ad components. Real SDK integration pending ad network account registration.
4. **No session reset** — Bots cap at 3 sessions/day and don't auto-reset. New deploy resets counter.

---

## Next Steps (Phase 2 — Days 4+)

1. Set up GCP VM with Xvfb
2. Test Urban VPN extension in headed mode
3. Register on Adsterra/Monetag, get SDK codes
4. Replace simulated ads in game components
5. Scale to 30 bots (Day 4-7 warmup step)
6. Introduce 1 ad view per session
7. Full shift scheduling (3 shifts × 50 bots)

---

## Quick Reference — File Purposes

| File | One-Line Purpose |
|---|---|
| `src/orchestrator.js` | Spawns bots in shifts, respects warmup schedule, logs status |
| `src/worker.js` | Launches Playwright, loads game, runs ad cycles |
| `src/proxyManager.js` | Assigns proxies, launches browsers with proxy config, handles VPN |
| `src/bezierMouse.js` | Human-like mouse movement using Bezier curves |
| `src/canvasNoise.js` | Unique hardware fingerprint via Canvas/WebGL/Audio noise |
| `src/domSniper.js` | Finds ad buttons by scanning DOM text (zero CPU) |
| `src/pixelEngine.js` | Finds ad buttons via screenshot + edge detection + OCR (~50ms) |
| `src/chaosEngine.js` | Weighted random action selection for behavioral variety |
| `src/identity.js` | 150 bot profiles: device, user agent, viewport, region |
| `test-proxyManager.js` | Tests proxy assignment, IP verification, health checks |
| `Dockerfile` | Railway build: Node 20 + Playwright Chromium + all system deps |