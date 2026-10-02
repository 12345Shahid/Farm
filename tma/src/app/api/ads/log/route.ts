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
    const { data } = await supabase
      .from('tma_ads_log')
      .select('*')
      .eq('user_id', tgUser.id);

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const initData = await extractInitData(req);
    const { user: tgUser } = parseInitData(initData);
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { network } = await req.json();
    if (!['popads', 'adcash', 'adsterra', 'popcash'].includes(network)) {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const userId = tgUser.id;
    const today = new Date().toISOString().split('T')[0];

    const { data: log } = await supabase
      .from('tma_ads_log')
      .select('*')
      .eq('user_id', userId)
      .eq('network', network)
      .single();

    let adsWatched = 0;
    if (log) {
      if (log.last_reset_date !== today) {
        adsWatched = 1;
        await supabase.from('tma_ads_log').update({
          ads_watched_today: 1,
          last_reset_date: today,
          updated_at: new Date().toISOString(),
        }).eq('id', log.id);
      } else if (log.ads_watched_today >= 25) {
        return NextResponse.json({ error: 'Daily cap reached' }, { status: 400 });
      } else {
        adsWatched = log.ads_watched_today + 1;
        await supabase.from('tma_ads_log').update({
          ads_watched_today: adsWatched,
          updated_at: new Date().toISOString(),
        }).eq('id', log.id);
      }
    } else {
      await supabase.from('tma_ads_log').insert({
        user_id: userId,
        network,
        ads_watched_today: 1,
        last_reset_date: today,
      });
      adsWatched = 1;
    }

    await supabase.rpc('tma_increment_balance', { p_user_id: userId, p_amount: 2 });

    return NextResponse.json({ success: true, ads_watched_today: adsWatched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}