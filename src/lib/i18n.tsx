import React, { useState, useEffect, useCallback } from 'react';
import { I18nContext } from '@/contexts/I18nContext';
import type { Language } from '@/contexts/I18nContext';
import { translations } from './i18n';
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language') as Language;
    return savedLang || 'en';
  });
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };
  const t = useCallback((key: string, params?: { [key: string]: string | number }): string => {
    let translation = translations[language]?.[key] || translations['en']?.[key] || key;
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    return translation;
  }, [language]);
  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};