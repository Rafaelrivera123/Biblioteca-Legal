// store/searchStore.ts
import { create } from "zustand";
// types/store.ts
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
  setQuery: (query) => set({ query }),
  setCategory: (category) => set({ category }),
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
