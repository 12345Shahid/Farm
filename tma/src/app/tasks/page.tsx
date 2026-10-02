'use client';

import TaskPanel from '@/components/task-panel';

export default function TasksPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-tg-text mb-4">📋 Tasks</h1>
      <TaskPanel />
    </div>
  );
}