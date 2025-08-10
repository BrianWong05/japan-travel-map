# Japan Travel Map

A production-ready, read-only web application for exploring Japanese attractions using **Vite + React + TypeScript + Tailwind CSS + shadcn/ui**.

## 🚀 Features

- **Interactive Map**: Full MapLibre GL JS integration with Japan prefecture boundaries
- **Smart Navigation**: Hierarchical navigation with map zoom synchronization
- **Multilingual Support**: English, Japanese, Traditional Chinese with i18next
- **Complete Data**: All 47 Japanese prefectures organized by regions
- **Zoom Integration**: Click-to-zoom and back button zoom-out functionality
- **State Management**: Zustand for UI state and favorites with persistence
- **Data Fetching**: TanStack Query with static JSON support
- **Responsive Design**: Tailwind CSS with shadcn/ui components
- **SEO Ready**: React Helmet Async integration
- **GitHub Pages Deployment**: Ready-to-deploy configuration

## 🛠️ Tech Stack

- **Frontend**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + Lucide React icons
- **Routing**: React Router v6
- **State**: Zustand with localStorage persistence
- **Data**: TanStack Query + static JSON files
- **i18n**: react-i18next (EN/JA/ZH-TW)
- **Map**: MapLibre GL JS (placeholder)
- **Build**: ESLint + TypeScript + Vite

## 📦 Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## 🌍 Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
VITE_DATA_SOURCE=static   # static | firestore
VITE_MAP_PROVIDER=maplibre
# Optional Firebase config for read-only mode
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
# ... other Firebase config
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── map/            # Map-related components
│   └── ...
├── pages/              # Route components
├── store/              # Zustand store
├── lib/                # Utilities and data loaders
├── i18n/               # Translation files
└── types/              # TypeScript definitions

public/
├── data/               # Static JSON datasets
│   ├── regions.json
│   ├── prefectures.json
│   ├── municipalities.json
│   ├── categories.json
│   ├── tags.json
│   └── attractions.json
└── geo/                # GeoJSON files (to be added)
```

## ✅ Current Status

### Implemented
- ✅ Project setup with all dependencies
- ✅ TypeScript types and interfaces
- ✅ Zustand store with persistence
- ✅ i18n configuration (EN/JA/ZH-TW)
- ✅ Complete prefecture data (all 47 prefectures)
- ✅ Static data structure and loaders
- ✅ React Router setup
- ✅ Complete MapLibre GL JS integration
- ✅ Japan prefecture boundaries with hover effects
- ✅ Interactive map with click-to-zoom functionality
- ✅ Smart navigation with back button zoom-out
- ✅ Home page with region listing
- ✅ Region page with prefecture listing
- ✅ Prefecture page with municipality framework
- ✅ Header with language switcher
- ✅ Search functionality framework
- ✅ Sample data for Tokyo region
- ✅ Build and deployment configuration

### To Be Implemented
- 🚧 Municipality page with attraction listing
- 🚧 Attraction page with full details
- 🚧 Attraction drawer with complete information
- 🚧 Map markers and clustering for attractions
- 🚧 Filter system implementation
- 🚧 Breadcrumb navigation
- 🚧 SEO meta tags
- 🚧 Municipality data and sample images
- 🚧 Firebase Firestore integration (optional)

## 🎯 Next Development Steps

1. **Complete municipality data and page implementation**
2. **Add attraction markers with clustering on the map**
3. **Implement attraction page with full details**
4. **Create filter and search functionality**
5. **Add sample images and municipality boundaries**
6. **Implement SEO optimization and breadcrumbs**
7. **Add comprehensive testing**

## 📝 Data Structure

The application uses a hierarchical data structure:
- **9 Regions** (Hokkaido, Tohoku, Kanto, etc.)
- **Prefectures** within regions
- **Municipalities** within prefectures  
- **Attractions** within municipalities

All content supports multilingual fields with graceful fallbacks.

## 🚀 Deployment

The app is configured for GitHub Pages deployment:

```bash
npm run deploy
```

This builds the app and deploys to the `gh-pages` branch.

## 📄 License

This project follows the specifications from the Japan Travel Map guidelines.
