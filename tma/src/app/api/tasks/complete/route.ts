import { extractInitData } from '@/lib/request';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { parseInitData } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const initData = await extractInitData(req);
    const { user: tgUser } = parseInitData(initData);
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type } = await req.json();
    if (!['cpa', 'smm'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const userId = tgUser.id;
    const today = new Date().toISOString().split('T')[0];
    const reward = type === 'cpa' ? 2 : 1;
    const maxPerDay = 6;

    // Get or create tasks row
    const { data: tasks } = await supabase.from('tma_tasks').select('*').eq('user_id', userId).single();

    if (!tasks) {
      await supabase.from('tma_tasks').insert({ user_id: userId });
    }

    const currentTasks = tasks || { cpa_completed_today: 0, smm_completed_today: 0, last_reset_date: '' };
    const isNewDay = currentTasks.last_reset_date !== today;
    const cpaCount = isNewDay ? 0 : (currentTasks.cpa_completed_today || 0);
    const smmCount = isNewDay ? 0 : (currentTasks.smm_completed_today || 0);

    if (type === 'cpa' && cpaCount >= maxPerDay) {
      return NextResponse.json({ error: 'Daily CPA cap reached' }, { status: 400 });
    }
    if (type === 'smm' && smmCount >= maxPerDay) {
      return NextResponse.json({ error: 'Daily SMM cap reached' }, { status: 400 });
    }

    await supabase.from('tma_tasks').upsert({
      user_id: userId,
      cpa_completed_today: type === 'cpa' ? cpaCount + 1 : cpaCount,
      smm_completed_today: type === 'smm' ? smmCount + 1 : smmCount,
      last_reset_date: today,
      updated_at: new Date().toISOString(),
    });

    await supabase.rpc('tma_increment_balance', { p_user_id: userId, p_amount: reward });

    return NextResponse.json({ success: true, reward });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}