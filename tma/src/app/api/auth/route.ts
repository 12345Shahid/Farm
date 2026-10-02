import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { parseInitData, generateReferralCode } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const initData = body.initData || req.headers.get('x-init-data') || '';
    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    const { user: tgUser, start_param } = parseInitData(initData);
    if (!tgUser) {
      return NextResponse.json({ error: 'Invalid initData' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const userId = tgUser.id;

    // Upsert user
    const { data: existing } = await supabase
      .from('tma_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update login info
      const { data: updated } = await supabase
        .from('tma_users')
        .update({
          first_name: tgUser.first_name,
          last_name: tgUser.last_name || existing.last_name,
          username: tgUser.username || existing.username,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      return NextResponse.json({ user: updated || existing });
    }

    // Check if referred — check body.refCode, start_param (Telegram Mini App standard), or URL queries
    const url = new URL(req.url);
    const candidateRefCode =
      (body.refCode || '').trim() ||
      (start_param || '').trim() ||
      (url.searchParams.get('ref') || '').trim() ||
      (url.searchParams.get('tgWebAppStartParam') || '').trim() ||
      (url.searchParams.get('startapp') || '').trim() ||
      null;

    let referredBy: number | null = null;
    if (candidateRefCode) {
      const { data: referrer } = await supabase
        .from('tma_users')
        .select('user_id')
        .eq('referral_code', candidateRefCode)
        .single();

      // Ensure referrer exists and is NOT referring themselves
      if (referrer && Number(referrer.user_id) !== Number(userId)) {
        referredBy = referrer.user_id;
        // Award referrer 80 tokens using correct RPC function
        try {
          await supabase.rpc('tma_increment_balance', { p_user_id: referrer.user_id, p_amount: 80 });
        } catch (rpcErr) {
          console.error('[Auth] Failed to award referral bonus:', rpcErr);
        }
      }
    }

    const newUser = {
      user_id: userId,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name,
      username: tgUser.username,
      balance: 0,
      referral_code: generateReferralCode(userId),
      referred_by: referredBy,
      check_in_streak: 0,
      verification_status: 'pending',
      booster_status: 'inactive',
    };

    const { data, error } = await supabase
      .from('tma_users')
      .insert(newUser)
      .select()
      .single();

    if (error) throw error;

    // Initialize mining, ads_log, tasks rows safely (ignoring conflict if existing)
    await supabase.from('tma_mining').upsert({ user_id: userId, level: 1, is_mining: false }, { onConflict: 'user_id' });
    await supabase.from('tma_ads_log').upsert([
      { user_id: userId, network: 'popads' },
      { user_id: userId, network: 'popcash' },
    ], { onConflict: 'user_id,network' });
    await supabase.from('tma_tasks').upsert({ user_id: userId }, { onConflict: 'user_id' });

    return NextResponse.json({ user: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}