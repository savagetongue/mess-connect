import { useContext } from 'react';
import { I18nContext } from '@/contexts/I18nContext';
import type { I18nContextType } from '@/contexts/I18nContext';
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};