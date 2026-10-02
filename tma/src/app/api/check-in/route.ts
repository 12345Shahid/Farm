import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { parseInitData } from '@/lib/telegram';
import { extractInitData } from '@/lib/request';

export async function POST(req: NextRequest) {
  try {
    const initData = await extractInitData(req);
    const { user: tgUser } = parseInitData(initData);
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createAdminClient();
    const userId = tgUser.id;
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const { data: existing } = await supabase
      .from('tma_check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('check_in_date', today)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 400 });
    }

    // Get last check-in for streak
    const { data: lastCheckIn } = await supabase
      .from('tma_check_ins')
      .select('check_in_date')
      .eq('user_id', userId)
      .order('check_in_date', { ascending: false })
      .limit(1)
      .single();

    let streak = 1;
    if (lastCheckIn) {
      const lastDate = new Date(lastCheckIn.check_in_date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastDate.toDateString() === yesterday.toDateString()) {
        const { data: user } = await supabase.from('tma_users').select('check_in_streak').eq('user_id', userId).single();
        streak = (user?.check_in_streak || 0) + 1;
      }
    }

    const reward = 5;

    // Insert check-in record
    await supabase.from('tma_check_ins').insert({
      user_id: userId,
      check_in_date: today,
      streak,
      reward,
    });

    // Update user streak and last_check_in
    await supabase.from('tma_users').update({
      check_in_streak: streak,
      last_check_in: today,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);

    // Direct balance update via RPC
    await supabase.rpc('tma_increment_balance', { p_user_id: userId, p_amount: reward });

    return NextResponse.json({ success: true, reward, streak });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}