import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('tma_smm_tasks')
      .select('*')
      .eq('is_active', true);

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}