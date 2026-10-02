import { extractInitData } from '@/lib/request';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { parseInitData } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const initData = await extractInitData(req);
    const { user: tgUser } = parseInitData(initData);
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const amount = Number(body.amount);
    const minWithdraw = 2000;

    if (!amount || amount < minWithdraw) {
      return NextResponse.json({ error: `Minimum withdrawal is ${minWithdraw} tokens` }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const userId = tgUser.id;

    // Verify user
    const { data: user } = await supabase
      .from('tma_users')
      .select('balance, verification_status')
      .eq('user_id', userId)
      .single();

    if (!user || user.verification_status !== 'verified') {
      return NextResponse.json({ error: 'Account not verified' }, { status: 400 });
    }

    if (user.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct balance
    await supabase.rpc('tma_increment_balance', { p_user_id: userId, p_amount: -amount });

    // Create withdrawal record
    await supabase.from('tma_withdrawals').insert({
      user_id: userId,
      amount,
      status: 'pending',
    });

    return NextResponse.json({ success: true, amount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}