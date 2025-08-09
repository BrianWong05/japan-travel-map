import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './en/common.json';
import jaCommon from './ja/common.json';
import zhCommon from './zh-TW/common.json';

const resources = {
  en: {
    common: enCommon
  },
  ja: {
    common: jaCommon
  },
  'zh-TW': {
    common: zhCommon
  }
};

// Detect browser language
const getBrowserLanguage = (): string => {
  const browserLang = navigator.language || navigator.languages[0];
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('zh')) return 'zh-TW';
  return 'en';
};

// Get stored language or browser default
const getInitialLanguage = (): string => {
  const stored = localStorage.getItem('japan-travel-map-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.state?.currentLanguage || getBrowserLanguage();
    } catch {
      return getBrowserLanguage();
    }
  }
  return getBrowserLanguage();
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    ns: ['common'],
    defaultNS: 'common'
  });

export default i18n;