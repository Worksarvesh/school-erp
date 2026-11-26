// MOCK: notices live in memory until the notices API is wired; a reload restores the design's one.
import { create } from 'zustand';
import { NOTICE_LIST_MOCK } from '@/mock/notice';
import type { NoticeForm } from './schemas';

export type Notice = NoticeForm & { id: string };

interface NoticeState {
  notices: readonly Notice[];
  /** Changes the notice with this id, or adds a new one on top when there is no id. */
  save: (notice: NoticeForm, id?: string) => void;
  remove: (id: string) => void;
}

let nextId = 1;

export const useNotices = create<NoticeState>((set) => ({
  notices: NOTICE_LIST_MOCK,
  save: (notice, id) =>
    set((s) => ({
      notices: s.notices.some((n) => n.id === id)
        ? s.notices.map((n) => (n.id === id ? { ...notice, id: n.id } : n))
        : [{ ...notice, id: `new-${nextId++}` }, ...s.notices],
    })),
  remove: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),
}));
