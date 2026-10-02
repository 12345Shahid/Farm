import { extractInitData } from '@/lib/request';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { parseInitData } from '@/lib/telegram';

const LEVEL_YIELDS: Record<number, number> = {};
for (let i = 1; i <= 30; i++) {
  LEVEL_YIELDS[i] = 50 + (i - 1) * 10;
}

const LEVEL_COSTS: Record<number, number> = {};
for (let i = 2; i <= 30; i++) {
  LEVEL_COSTS[i] = 500 + (i - 2) * 500;
}

export async function GET(req: NextRequest) {
  try {
    const initData = await extractInitData(req);
    const { user: tgUser } = parseInitData(initData);
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createAdminClient();
    const { data } = await supabase.from('tma_mining').select('*').eq('user_id', tgUser.id).single();

    if (!data) return NextResponse.json({ level: 1, is_mining: false });

    const canClaim = data.is_mining && data.session_start &&
      (Date.now() - new Date(data.session_start).getTime()) >= 24 * 60 * 60 * 1000;

    return NextResponse.json({ ...data, can_claim: !!canClaim });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const initData = await extractInitData(req);
    const { user: tgUser } = parseInitData(initData);
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action } = await req.json();
    const supabase = await createAdminClient();
    const userId = tgUser.id;

    switch (action) {
      case 'start': {
        const { data: mining } = await supabase.from('tma_mining').select('*').eq('user_id', userId).single();
        if (mining?.is_mining) {
          return NextResponse.json({ error: 'Already mining' }, { status: 400 });
        }
        await supabase.from('tma_mining').upsert({
          user_id: userId,
          level: mining?.level || 1,
          is_mining: true,
          session_start: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        return NextResponse.json({ success: true });
      }

      case 'claim': {
        const { data: mining } = await supabase.from('tma_mining').select('*').eq('user_id', userId).single();
        if (!mining?.is_mining || !mining?.session_start) {
          return NextResponse.json({ error: 'No active mining session' }, { status: 400 });
        }
        const elapsed = Date.now() - new Date(mining.session_start).getTime();
        if (elapsed < 24 * 60 * 60 * 1000) {
          return NextResponse.json({ error: 'Mining not complete yet' }, { status: 400 });
        }
        const level = mining.level || 1;
        const reward = LEVEL_YIELDS[level] || 50;

        await supabase.rpc('tma_increment_balance', { p_user_id: userId, p_amount: reward });
        await supabase.from('tma_mining').update({
          is_mining: false,
          last_claim_time: new Date().toISOString(),
          session_start: null,
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId);

        return NextResponse.json({ success: true, reward });
      }

      case 'upgrade': {
        const { data: mining } = await supabase.from('tma_mining').select('*').eq('user_id', userId).single();
        const currentLevel = mining?.level || 1;
        const nextLevel = currentLevel + 1;
        if (nextLevel > 30) {
          return NextResponse.json({ error: 'Max level reached' }, { status: 400 });
        }
        const cost = LEVEL_COSTS[nextLevel];
        const { data: user } = await supabase.from('tma_users').select('balance').eq('user_id', userId).single();
        if (!user || user.balance < cost) {
          return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
        }

        await supabase.rpc('tma_increment_balance', { p_user_id: userId, p_amount: -cost });
        await supabase.from('tma_mining').upsert({
          user_id: userId,
          level: nextLevel,
          updated_at: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, level: nextLevel });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}