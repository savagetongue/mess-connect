import { useContext } from 'react';
import { I18nContext } from '@/lib/i18n';
import type { I18nContextType } from '@/lib/i18n';
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};