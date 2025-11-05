import { createContext } from 'react';
export type Language = 'en' | 'mr' | 'hi';
export interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: { [key: string]: string | number }) => string;
}
export const I18nContext = createContext<I18nContextType | undefined>(undefined);