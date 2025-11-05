import { createContext } from 'react';
import type { I18nContextType } from '@/lib/i18n';
export const I18nContext = createContext<I18nContextType | undefined>(undefined);