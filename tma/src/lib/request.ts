import { NextRequest } from 'next/server';

/**
 * Extract initData from a request — tries body first, then headers
 */
export async function extractInitData(req: NextRequest): Promise<string> {
  try {
    const body = await req.clone().json().catch(() => ({}));
    if (body.initData) return body.initData;
  } catch {}
  return req.headers.get('x-init-data') || '';
}