import { create } from 'zustand';

interface DraftState { dirtyDrafts: number; setDraft: (key: string, dirty: boolean) => void; }
const drafts = new Set<string>();
export const useDraftStore = create<DraftState>(() => ({
  dirtyDrafts: 0,
  setDraft: (key, dirty) => {
    if (dirty) drafts.add(key); else drafts.delete(key);
    useDraftStore.setState({ dirtyDrafts: drafts.size });
  },
}));
