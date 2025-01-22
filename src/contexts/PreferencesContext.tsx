import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { updateUserProfile } from '../services/database';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'hi';
export type Currency = 'USD' | 'EUR' | 'GBP';

interface Preferences {
  language: Language;
  currency: Currency;
}

interface PreferencesContextType {
  preferences: Preferences;
  loading: boolean;
  updatePreferences: (newPreferences: Partial<Preferences>) => Promise<void>;
  setPreferencesImmediately: (newPreferences: Partial<Preferences>) => void;
}

const defaultPreferences: Preferences = {
  language: 'en',
  currency: 'USD',
};

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser) {
        setPreferences(defaultPreferences);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPreferences({
            language: (data.preferences?.language || defaultPreferences.language) as Language,
            currency: (data.preferences?.currency || defaultPreferences.currency) as Currency,
          });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [currentUser]);

  const setPreferencesImmediately = (newPreferences: Partial<Preferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences,
    }));
  };

  const updatePreferences = async (newPreferences: Partial<Preferences>) => {
    if (!currentUser) return;

    const updatedPreferences = {
      ...preferences,
      ...newPreferences,
    };

    try {
      await updateUserProfile(currentUser.uid, {
        preferences: updatedPreferences,
      });
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  return (
    <PreferencesContext.Provider value={{ preferences, loading, updatePreferences, setPreferencesImmediately }}>
      {!loading && children}
    </PreferencesContext.Provider>
  );
}; 