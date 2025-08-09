export interface Region {
  id: string;
  code: string;
  slug: string;
  name_en: string;
  name_ja: string;
  name_zh: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface Prefecture {
  id: string;
  code: string;
  regionId: string;
  slug: string;
  name_en: string;
  name_ja: string;
  name_zh: string;
  bbox: [number, number, number, number];
}

export interface Municipality {
  id: string;
  prefectureId: string;
  slug: string;
  name_en: string;
  name_ja: string;
  name_zh: string;
  type: string;
  bbox: [number, number, number, number];
}

export interface Category {
  id: string;
  name_en: string;
  name_ja: string;
  name_zh: string;
  color: string;
  icon: string;
}

export interface Tag {
  id: string;
  name_en: string;
  name_ja: string;
  name_zh: string;
}

export interface Attraction {
  id: string;
  slug: string;
  title_en: string;
  title_ja: string;
  title_zh: string;
  desc_en: string;
  desc_ja: string;
  desc_zh: string;
  lat: number;
  lng: number;
  regionId: string;
  prefectureId: string;
  municipalityId: string;
  categoryId: string;
  tags: string[];
  images: string[];
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
}

export type Language = 'en' | 'ja' | 'zh';

export type DataSource = 'static' | 'firestore';

export interface MapViewState {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface FilterState {
  categories: string[];
  tags: string[];
  search: string;
}

export interface AppState {
  currentLanguage: Language;
  favorites: string[];
  mapViewState: MapViewState;
  filters: FilterState;
  selectedAttraction: string | null;
  isDrawerOpen: boolean;
}