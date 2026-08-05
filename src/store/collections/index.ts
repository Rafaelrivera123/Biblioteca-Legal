import { create } from "zustand";

export interface SearchState {
  query: string;
  category: string;
  page: number;
  setPage: (page: number) => void;
  setQuery: (query: string) => void;
  setCategory: (category: string) => void;
}

const useCollectionSearchStore = create<SearchState>((set) => ({
  query: "",
  category: "all",
  page: 1,
  setPage: (page) => set({ page }),
  // Reset pagination whenever filters change so results aren't requested
  // from a stale page (e.g. page 2 of a previous browse) that often has
  // zero hits for the new query/category.
  setQuery: (query) => set({ query, page: 1 }),
  setCategory: (category) => set({ category, page: 1 }),
}));

export default useCollectionSearchStore;

export interface ArticleSearchState {
  query: string;
  setQuery: (query: string) => void;
}

export const useArticleSearchStore = create<ArticleSearchState>((set) => ({
  query: "",
  setQuery: (query) => set({ query }),
}));

export interface ActiveChapterState {
  activeChapterId: string | null;
  setActiveChapterId: (id: string | null) => void;
}

export const useActiveChapterStore = create<ActiveChapterState>((set) => ({
  activeChapterId: null,
  setActiveChapterId: (id) => set({ activeChapterId: id }),
}));
