import { NextRequest, NextResponse } from 'next/server';
import { parseInitData } from '@/lib/telegram';

const BOT_TOKEN = process.env.BOT_TOKEN!;

const REQUIRED_CHANNELS = [
  { id: '@ProjectRiver_channel1', title: 'Announcements' },
  { id: '@ProjectRiver_channel2', title: 'Community' },
];

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();
    const { user: tgUser } = parseInitData(initData || '');
    if (!tgUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await Promise.all(
      REQUIRED_CHANNELS.map(async (channel) => {
        try {
          const res = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${channel.id}&user_id=${tgUser.id}`,
            { signal: AbortSignal.timeout(5000) }
          );
          const data = await res.json();
          const joined = data.ok && ['member', 'administrator', 'creator'].includes(data.result?.status);
          return { ...channel, joined };
        } catch {
          return { ...channel, joined: false };
        }
      })
    );

    return NextResponse.json({
      joined: results.every(r => r.joined),
      channels: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}