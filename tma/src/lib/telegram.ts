// Telegram initData validation & user helpers

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

/**
 * Parse and validate Telegram initData (server-side).
 * In production, validate the HMAC signature using your bot token.
 * Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function parseInitData(initData: string): { user?: TelegramUser; hash?: string; start_param?: string } {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    const hash = params.get('hash') || undefined;
    const start_param = params.get('start_param') || undefined;
    const user: TelegramUser | undefined = userStr ? JSON.parse(userStr) : undefined;
    return { user, hash, start_param };
  } catch {
    return {};
  }
}

/**
 * Validate initData HMAC signature.
 * @param initData - raw initData string
 * @param botToken - Telegram bot token
 * @returns boolean
 */
export function validateInitData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;

    // Remove hash from data before checking
    params.delete('hash');
    const sorted = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const crypto = require('crypto');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(sorted).digest('hex');

    return computedHash === hash;
  } catch {
    return false;
  }
}

/**
 * Generate a unique referral code from Telegram user ID
 */
export function generateReferralCode(userId: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const base = userId.toString(36).toUpperCase();
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[(userId * (i + 1) + i) % chars.length];
  }
  return code;
}

/**
 * Placeholder: check if user has joined required Telegram channels
 * In production, call Telegram Bot API: getChatMember
 */
export async function checkChannelMembership(userId: number): Promise<{ joined: boolean; channels: { title: string; joined: boolean }[] }> {
  const requiredChannels = [
    { id: '@channel1', title: 'Announcements' },
    { id: '@channel2', title: 'Community' },
  ];
  return {
    joined: true,
    channels: requiredChannels.map(c => ({ ...c, joined: true })),
  };
}