import { create } from 'zustand';

interface FilterState {
    searchQuery: string;
    selectedTags: string[];
    setSearchQuery: (query: string) => void;
    addTag: (tag: string) => void;
    removeTag: (tag: string) => void;
    clearTags: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
    searchQuery: '',
    selectedTags: [],

    setSearchQuery: (query) => set({ searchQuery: query }),

    addTag: (tag) => set((state) => ({
        // Add tag only if it's not already selected
        selectedTags: state.selectedTags.includes(tag)
            ? state.selectedTags
            : [...state.selectedTags, tag].sort(), // Keep tags sorted for consistency
    })),

    removeTag: (tag) => set((state) => ({
        selectedTags: state.selectedTags.filter((t) => t !== tag),
    })),

    clearTags: () => set({ selectedTags: [] }),
})); 