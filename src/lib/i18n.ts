import type { Language } from '@/types';

/**
 * Get localized field value with fallback
 * @param record - Object containing localized fields
 * @param baseKey - Base field name (e.g., 'name', 'title', 'desc')
 * @param language - Current language
 * @param fallback - Fallback language (default: 'en')
 * @returns Localized string value
 */
export function i18nField<T extends Record<string, any>>(
  record: T,
  baseKey: string,
  language: Language,
  fallback: Language = 'en'
): string {
  const primaryKey = `${baseKey}_${language}`;
  const fallbackKey = `${baseKey}_${fallback}`;
  
  // Try primary language first
  if (record[primaryKey] && typeof record[primaryKey] === 'string') {
    return record[primaryKey];
  }
  
  // Try fallback language
  if (record[fallbackKey] && typeof record[fallbackKey] === 'string') {
    return record[fallbackKey];
  }
  
  // Try any available language field
  const availableKeys = Object.keys(record).filter(key => 
    key.startsWith(`${baseKey}_`) && typeof record[key] === 'string'
  );
  
  if (availableKeys.length > 0) {
    return record[availableKeys[0]];
  }
  
  // Return empty string if nothing found
  return '';
}

/**
 * Get the appropriate language code for react-i18next
 * @param language - Language from our app
 * @returns Language code for i18next
 */
export function getI18nLanguage(language: Language): string {
  return language === 'zh' ? 'zh-TW' : language;
}