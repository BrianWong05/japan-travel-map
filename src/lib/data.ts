import type { 
  Region, 
  Prefecture, 
  Municipality, 
  Category, 
  Tag, 
  Attraction, 
  DataSource 
} from '@/types';

// Get data source from environment
export const getDataSource = (): DataSource => {
  return (import.meta.env.VITE_DATA_SOURCE as DataSource) || 'static';
};

// Static data loaders
export const staticDataLoaders = {
  async getRegions(): Promise<Region[]> {
    const response = await fetch('/data/regions.json');
    if (!response.ok) throw new Error('Failed to load regions');
    return response.json();
  },

  async getPrefectures(): Promise<Prefecture[]> {
    const response = await fetch('/data/prefectures.json');
    if (!response.ok) throw new Error('Failed to load prefectures');
    return response.json();
  },

  async getMunicipalities(): Promise<Municipality[]> {
    const response = await fetch('/data/municipalities.json');
    if (!response.ok) throw new Error('Failed to load municipalities');
    return response.json();
  },

  async getCategories(): Promise<Category[]> {
    const response = await fetch('/data/categories.json');
    if (!response.ok) throw new Error('Failed to load categories');
    return response.json();
  },

  async getTags(): Promise<Tag[]> {
    const response = await fetch('/data/tags.json');
    if (!response.ok) throw new Error('Failed to load tags');
    return response.json();
  },

  async getAttractions(): Promise<Attraction[]> {
    const response = await fetch('/data/attractions.json');
    if (!response.ok) throw new Error('Failed to load attractions');
    const data = await response.json();
    // Filter only published attractions
    return data.filter((attraction: Attraction) => attraction.status === 'published');
  },

  async getRegionGeoJson(regionId: string): Promise<any> {
    const response = await fetch(`/geo/regions/${regionId}.geojson`);
    if (!response.ok) throw new Error(`Failed to load region GeoJSON: ${regionId}`);
    return response.json();
  },

  async getPrefectureGeoJson(prefectureId: string): Promise<any> {
    const response = await fetch(`/geo/prefectures/${prefectureId}.geojson`);
    if (!response.ok) throw new Error(`Failed to load prefecture GeoJSON: ${prefectureId}`);
    return response.json();
  },

  async getMunicipalityGeoJson(municipalityId: string): Promise<any> {
    const response = await fetch(`/geo/municipalities/${municipalityId}.geojson`);
    if (!response.ok) throw new Error(`Failed to load municipality GeoJSON: ${municipalityId}`);
    return response.json();
  }
};

// Firestore data loaders (optional)
export const firestoreDataLoaders = {
  async getRegions(): Promise<Region[]> {
    // TODO: Implement Firestore loader
    throw new Error('Firestore not implemented yet');
  },

  async getPrefectures(): Promise<Prefecture[]> {
    // TODO: Implement Firestore loader
    throw new Error('Firestore not implemented yet');
  },

  async getMunicipalities(): Promise<Municipality[]> {
    // TODO: Implement Firestore loader
    throw new Error('Firestore not implemented yet');
  },

  async getCategories(): Promise<Category[]> {
    // TODO: Implement Firestore loader
    throw new Error('Firestore not implemented yet');
  },

  async getTags(): Promise<Tag[]> {
    // TODO: Implement Firestore loader
    throw new Error('Firestore not implemented yet');
  },

  async getAttractions(): Promise<Attraction[]> {
    // TODO: Implement Firestore loader
    throw new Error('Firestore not implemented yet');
  },

  async getRegionGeoJson(regionId: string): Promise<any> {
    // GeoJSON is always served statically
    return staticDataLoaders.getRegionGeoJson(regionId);
  },

  async getPrefectureGeoJson(prefectureId: string): Promise<any> {
    // GeoJSON is always served statically
    return staticDataLoaders.getPrefectureGeoJson(prefectureId);
  },

  async getMunicipalityGeoJson(municipalityId: string): Promise<any> {
    // GeoJSON is always served statically
    return staticDataLoaders.getMunicipalityGeoJson(municipalityId);
  }
};

// Main data loader that switches between static and Firestore
export const dataLoaders = getDataSource() === 'firestore' ? firestoreDataLoaders : staticDataLoaders;