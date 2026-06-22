import { useCallback, useState } from 'react';
import { listSessions } from '@lib/storage.js';
import type { SessionMenuItem } from '@types';

function formatRelativeTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\n/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1) + '…';
}

function buildMenuItems(metas: import('@types').SessionMeta[]): SessionMenuItem[] {
  return metas.map((meta) => {
    const label = meta.firstPrompt ? truncate(meta.firstPrompt, 50) : '(empty conversation)';
    const time = formatRelativeTime(meta.updatedAt || meta.createdAt);
    const detail = `${time} · ${meta.messageCount} msgs · ${meta.modelConfig?.name ?? 'unknown'}`;
    return { sessionId: meta.sessionId, label, detail, meta };
  });
}

export function useResumeMenu() {
  const [showResumeMenu, setShowResumeMenu] = useState(false);
  const [sessionItems, setSessionItems] = useState<SessionMenuItem[]>([]);
  const [resumeSelectionIndex, setResumeSelectionIndex] = useState(0);

  const open = useCallback(async () => {
    const metas = await listSessions();
    const items = buildMenuItems(metas);
    setSessionItems(items);
    setResumeSelectionIndex(0);
    setShowResumeMenu(true);
  }, []);

  const close = useCallback(() => {
    setShowResumeMenu(false);
    setSessionItems([]);
    setResumeSelectionIndex(0);
  }, []);

  return {
    showResumeMenu,
    sessionItems,
    resumeSelectionIndex,
    setResumeSelectionIndex,
    open,
    close,
  };
}