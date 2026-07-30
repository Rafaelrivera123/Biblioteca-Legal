import { create } from "zustand";

interface GlobalSearchState {
  isOpen: boolean;
  initialQuery: string;
  open: () => void;
  openWithQuery: (query: string) => void;
  close: () => void;
  toggle: () => void;
  clearInitialQuery: () => void;
}

/**
 * Controla el command palette de búsqueda global (src/components/shared/global-search.tsx).
 * Se abre desde el navbar (icono + Ctrl/Cmd+K) y desde el buscador del home
 * (ResearchTools), que le pasa el texto ya escrito con openWithQuery.
 */
export const useGlobalSearchStore = create<GlobalSearchState>((set) => ({
  isOpen: false,
  initialQuery: "",
  open: () => set({ isOpen: true }),
  openWithQuery: (query) => set({ isOpen: true, initialQuery: query }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  clearInitialQuery: () => set({ initialQuery: "" }),
}));
