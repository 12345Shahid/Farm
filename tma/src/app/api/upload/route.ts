import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { parseInitData } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const initData = req.headers.get('x-init-data') || '';
    const { user: tgUser } = parseInitData(initData);
    if (!tgUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('video') as File;
    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const fileName = `verification-${tgUser.id}-${Date.now()}.mp4`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('verification-videos')
      .upload(fileName, buffer, {
        contentType: file.type || 'video/mp4',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Update user verification status to pending (triggers admin review)
    await supabase
      .from('tma_users')
      .update({ verification_status: 'pending', updated_at: new Date().toISOString() })
      .eq('user_id', tgUser.id);

    return NextResponse.json({ success: true, fileName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}