# Ghost Farm Bot — Railway Deployment
# Uses Playwright headless Chromium

FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

# Install Chromium and ALL system dependencies automatically
RUN npx playwright install chromium && npx playwright install-deps chromium

COPY src/ ./src/
COPY config/ ./config/

ENV NODE_ENV=production
ENV ORCHESTRATOR_MODE=full
ENV GAME_URL=https://gifterly.vercel.app

CMD ["node", "src/orchestrator.js"]