// Canvas/WebGL noise injection for unique hardware fingerprint
// Injected into each browser instance via addInitScript

const CANVAS_NOISE_SOURCE = `
(() => {
  const randomSeed = 'SEED_PLACEHOLDER';

  // Seed-based pseudo-random
  function seededRandom(s) {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return () => {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      return hash / 0x7fffffff;
    };
  }
  const rng = seededRandom(randomSeed);

  // --- Canvas noise ---
  const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    const noise = rng() * 0.5 - 0.25;
    return origToDataURL.apply(this, args);
  };

  const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function(...args) {
    const imageData = origGetImageData.apply(this, args);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] + Math.floor(rng() * 3 - 1)));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + Math.floor(rng() * 3 - 1)));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + Math.floor(rng() * 3 - 1)));
    }
    return imageData;
  };

  // --- WebGL noise ---
  const origGetParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(param) {
    if (param === 37445) return 'Intel Inc.';
    if (param === 37446) return 'Intel Iris Plus Graphics ' + Math.floor(rng() * 10 + 640);
    return origGetParameter.apply(this, arguments);
  };

  // --- Navigator overrides ---
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => Math.floor(rng() * 4 + 2) });
  Object.defineProperty(navigator, 'deviceMemory', { get: () => Math.floor(rng() * 4 + 4) });

  // --- Audio noise ---
  const origGetChannelData = AudioBuffer.prototype.getChannelData;
  AudioBuffer.prototype.getChannelData = function(channel) {
    const data = origGetChannelData.call(this, channel);
    for (let i = 0; i < data.length; i++) {
      data[i] += (rng() - 0.5) * 0.00001;
    }
    return data;
  };
})();
`;

function getCanvasNoiseScript(botId) {
  return CANVAS_NOISE_SOURCE.replace('SEED_PLACEHOLDER', `bot-${botId}-${Date.now()}`);
}

module.exports = { getCanvasNoiseScript };