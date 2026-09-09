# Ghost Farm Bot — Railway Deployment
# Uses Playwright headless Chromium

FROM node:20-slim

# Install Playwright dependencies (Chromium)
RUN apt-get update && apt-get install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 libxdamage1 \
  libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
  libatspi2.0-0 libwayland-client0 \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --omit=dev

# Install Chromium for Playwright
RUN npx playwright install chromium

# Copy source
COPY src/ ./src/
COPY config/ ./config/

ENV NODE_ENV=production
ENV ORCHESTRATOR_MODE=full
ENV GAME_URL=https://gifterly.vercel.app

CMD ["node", "src/orchestrator.js"]