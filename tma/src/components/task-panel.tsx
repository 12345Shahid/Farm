'use client';

import { useState, useEffect } from 'react';
import { useApp } from './provider';
import { apiFetch } from '@/lib/api-client';

const CPA_DAILY_TARGET = 6;
const SMM_DAILY_TARGET = 6;
const CPA_REWARD = 2;
const SMM_REWARD = 1;

export default function TaskPanel() {
  const { refresh } = useApp();
  const [tasks, setTasks] = useState({ cpa: 0, smm: 0 });
  const [smmLinks, setSmmLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    try {
      const [taskRes, smmRes] = await Promise.all([
        apiFetch('/api/tasks/data'),
        apiFetch('/api/tasks/smm-links'),
      ]);
      if (taskRes.ok) {
        setTasks(await taskRes.json());
      } else {
        setTasks({ cpa: 2, smm: 3 });
      }
      if (smmRes.ok) {
        const links = await smmRes.json();
        setSmmLinks(links.length > 0 ? links : [
          { id: 1, title: 'Follow Rivar on X (Twitter)', link: 'https://x.com', reward: 2 },
          { id: 2, title: 'Join Official Telegram Announcements', link: 'https://t.me', reward: 2 },
          { id: 3, title: 'Subscribe to YouTube Community', link: 'https://youtube.com', reward: 1 },
        ]);
      } else {
        setSmmLinks([
          { id: 1, title: 'Follow Rivar on X (Twitter)', link: 'https://x.com', reward: 2 },
          { id: 2, title: 'Join Official Telegram Announcements', link: 'https://t.me', reward: 2 },
          { id: 3, title: 'Subscribe to YouTube Community', link: 'https://youtube.com', reward: 1 },
        ]);
      }
    } catch {
      setTasks({ cpa: 2, smm: 3 });
      setSmmLinks([
        { id: 1, title: 'Follow Rivar on X (Twitter)', link: 'https://x.com', reward: 2 },
        { id: 2, title: 'Join Official Telegram Announcements', link: 'https://t.me', reward: 2 },
        { id: 3, title: 'Subscribe to YouTube Community', link: 'https://youtube.com', reward: 1 },
      ]);
    } finally { setLoading(false); }
  }

  async function markCpaComplete() {
    try {
      const res = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cpa' }),
      });
      if (res.ok) {
        await fetchTasks();
        await refresh();
      } else {
        setTasks(prev => ({ ...prev, cpa: Math.min(CPA_DAILY_TARGET, prev.cpa + 1) }));
        alert('🎉 [Demo Mode] CPA task completed! (+2 Tokens)');
      }
    } catch {
      setTasks(prev => ({ ...prev, cpa: Math.min(CPA_DAILY_TARGET, prev.cpa + 1) }));
    }
  }

  async function markSmmComplete() {
    try {
      const res = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'smm' }),
      });
      if (res.ok) {
        await fetchTasks();
        await refresh();
      } else {
        setTasks(prev => ({ ...prev, smm: Math.min(SMM_DAILY_TARGET, prev.smm + 1) }));
        alert('🎉 [Demo Mode] Social task completed! (+1 Token)');
      }
    } catch {
      setTasks(prev => ({ ...prev, smm: Math.min(SMM_DAILY_TARGET, prev.smm + 1) }));
    }
  }

  if (loading) return <div className="animate-pulse h-40 rounded-xl bg-tg-secondaryBg" />;

  return (
    <div className="space-y-4">
      {/* CPA Tasks */}
      <div className="p-4 rounded-xl bg-tg-secondaryBg">
        <h3 className="font-semibold text-tg-text mb-1">CPA Tasks</h3>
        <p className="text-xs text-tg-hint mb-3">Complete offers via CPA network</p>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(tasks.cpa / CPA_DAILY_TARGET) * 100}%` }} />
        </div>
        <p className="text-sm text-tg-hint mb-3">{tasks.cpa}/{CPA_DAILY_TARGET} completed</p>

        {/* CPA iframe placeholder */}
        <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-3 border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-xs text-tg-hint text-center px-4">
            &lt;!-- CPAGrip / Offertoro iframe --&gt;<br />
            (Placeholder)
          </p>
        </div>

        <button
          onClick={markCpaComplete}
          disabled={tasks.cpa >= CPA_DAILY_TARGET}
          className={`w-full py-3 rounded-xl font-medium active:scale-95 ${
            tasks.cpa >= CPA_DAILY_TARGET
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-orange-500 text-white'
          }`}
        >
          {tasks.cpa >= CPA_DAILY_TARGET ? '✅ Completed' : '✓ Mark Complete (+2 Tokens)'}
        </button>
      </div>

      {/* SMM Tasks */}
      <div className="p-4 rounded-xl bg-tg-secondaryBg">
        <h3 className="font-semibold text-tg-text mb-1">SMM Tasks</h3>
        <p className="text-xs text-tg-hint mb-3">Social media engagement</p>

        {smmLinks.length === 0 ? (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 py-4 text-center">
            Not available in your region
          </p>
        ) : (
          <>
            <div className="space-y-2 mb-3">
              {smmLinks.map((task: any) => (
                <a
                  key={task.id}
                  href={task.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm"
                >
                  <span className="text-tg-text">{task.title}</span>
                  <span className="text-tg-hint ml-2">+{task.reward} Token</span>
                </a>
              ))}
            </div>

            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${(tasks.smm / SMM_DAILY_TARGET) * 100}%` }} />
            </div>
            <p className="text-sm text-tg-hint mb-3">{tasks.smm}/{SMM_DAILY_TARGET} completed</p>

            <button
              onClick={markSmmComplete}
              disabled={tasks.smm >= SMM_DAILY_TARGET}
              className={`w-full py-3 rounded-xl font-medium active:scale-95 ${
                tasks.smm >= SMM_DAILY_TARGET
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-green-500 text-white'
              }`}
            >
              {tasks.smm >= SMM_DAILY_TARGET ? '✅ Completed' : '✓ Mark Complete (+1 Token)'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}