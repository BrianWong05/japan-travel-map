import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, Language, MapViewState, FilterState } from '@/types';

interface AppStore extends AppState {
  // Language actions
  setLanguage: (language: Language) => void;
  
  // Favorites actions
  toggleFavorite: (attractionId: string) => void;
  
  // Map actions
  setMapViewState: (viewState: MapViewState) => void;
  
  // Filter actions
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  
  // Attraction drawer actions
  setSelectedAttraction: (attractionId: string | null) => void;
  setDrawerOpen: (isOpen: boolean) => void;
}

const defaultMapViewState: MapViewState = {
  latitude: 36.2048,
  longitude: 138.2529,
  zoom: 5
};

const defaultFilters: FilterState = {
  categories: [],
  tags: [],
  search: ''
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentLanguage: 'en',
      favorites: [],
      mapViewState: defaultMapViewState,
      filters: defaultFilters,
      selectedAttraction: null,
      isDrawerOpen: false,

      // Language actions
      setLanguage: (language: Language) => {
        set({ currentLanguage: language });
      },

      // Favorites actions
      toggleFavorite: (attractionId: string) => {
        const { favorites } = get();
        const newFavorites = favorites.includes(attractionId)
          ? favorites.filter(id => id !== attractionId)
          : [...favorites, attractionId];
        set({ favorites: newFavorites });
      },

      // Map actions
      setMapViewState: (viewState: MapViewState) => {
        set({ mapViewState: viewState });
      },

      // Filter actions
      setFilters: (newFilters: Partial<FilterState>) => {
        const { filters } = get();
        set({ filters: { ...filters, ...newFilters } });
      },

      resetFilters: () => {
        set({ filters: defaultFilters });
      },

      // Attraction drawer actions
      setSelectedAttraction: (attractionId: string | null) => {
        set({ 
          selectedAttraction: attractionId,
          isDrawerOpen: attractionId !== null
        });
      },

      setDrawerOpen: (isOpen: boolean) => {
        set({ 
          isDrawerOpen: isOpen,
          selectedAttraction: isOpen ? get().selectedAttraction : null
        });
      }
    }),
    {
      name: 'japan-travel-map-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentLanguage: state.currentLanguage,
        favorites: state.favorites,
        mapViewState: state.mapViewState
      })
    }
  )
);