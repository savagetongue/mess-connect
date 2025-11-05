import { useContext } from 'react';
import { I18nContext } from '@/contexts/I18nContext';
import type { I18nContextType } from '@/contexts/I18nContext';
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    // Provide a safe no-op fallback so consumers don't crash if provider is missing.
    // Keep the shape compatible with I18nContextType via a type assertion.
    const defaultContext = {
      language: 'en',
      setLanguage: () => {
        /* no-op */
      },
      t: (key: string, vars?: Record<string, string | number>) => {
        if (!vars) return key;
        // Simple interpolation of {var} placeholders
        return key.replace(/\{([^}]+)\}/g, (_, k) => {
          const v = (vars as Record<string, any>)[k];
          return v === undefined || v === null ? `{${k}}` : String(v);
        });
      },
    } as I18nContextType;
    return defaultContext;
  }
  return context;
};