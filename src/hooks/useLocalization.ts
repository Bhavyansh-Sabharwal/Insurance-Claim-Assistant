import { usePreferences } from '../contexts/PreferencesContext';
import { translations } from '../i18n/translations';
import { useMemo } from 'react';

export const useLocalization = () => {
  const { preferences } = usePreferences();

  const t = useMemo(() => {
    return (key: keyof typeof translations[typeof preferences.language]) => {
      return translations[preferences.language][key];
    };
  }, [preferences.language]);

  const formatCurrency = useMemo(() => {
    return (amount: number) => {
      return new Intl.NumberFormat(preferences.language, {
        style: 'currency',
        currency: preferences.currency,
      }).format(amount);
    };
  }, [preferences.language, preferences.currency]);

  return { t, formatCurrency };
}; 