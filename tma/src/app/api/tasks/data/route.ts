import { extractInitData } from '@/lib/request';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { parseInitData } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  try {
    const initData = await extractInitData(req);
    const { user: tgUser } = parseInitData(initData);
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createAdminClient();
    const [tasksRes, userRes] = await Promise.all([
      supabase.from('tma_tasks').select('*').eq('user_id', tgUser.id).single(),
      supabase.from('tma_users').select('balance').eq('user_id', tgUser.id).single(),
    ]);

    const today = new Date().toISOString().split('T')[0];
    let cpa = 0, smm = 0;

    if (tasksRes.data) {
      if (tasksRes.data.last_reset_date !== today) {
        cpa = 0; smm = 0;
      } else {
        cpa = tasksRes.data.cpa_completed_today;
        smm = tasksRes.data.smm_completed_today;
      }
    }

    return NextResponse.json({ cpa, smm });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}