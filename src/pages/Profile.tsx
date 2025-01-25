import { useState, useEffect } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Heading,
  Card,
  useToast,
  Container,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences, Language, Currency } from '../contexts/PreferencesContext';
import { useLocalization } from '../hooks/useLocalization';
import { updateUserProfile } from '../services/database';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ProfileData {
  language: Language;
  currency: Currency;
  propertyType: string;
  address: string;
  rooms: number;
}

const Profile = () => {
  const { currentUser } = useAuth();
  const { preferences, updatePreferences, setPreferencesImmediately } = usePreferences();
  const { t } = useLocalization();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ProfileData>({
    language: preferences.language,
    currency: preferences.currency,
    propertyType: '',
    address: '',
    rooms: 0,
  });

  // Add effect to sync with preferences
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      language: preferences.language,
      currency: preferences.currency,
    }));
  }, [preferences]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData(prev => ({
            ...prev,
            language: preferences.language,
            currency: preferences.currency,
            propertyType: data.propertyDetails?.type || '',
            address: data.propertyDetails?.address || '',
            rooms: data.propertyDetails?.rooms || 0,
          }));
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: t('error.profileLoadFailed'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, preferences, toast, t]);

  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Immediately update language and currency preferences
    if (field === 'language' || field === 'currency') {
      setPreferencesImmediately({ [field]: value });
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, {
        preferences: {
          language: formData.language,
          currency: formData.currency
        },
        propertyDetails: {
          type: formData.propertyType,
          address: formData.address,
          rooms: formData.rooms
        }
      });
      
      toast({
        title: 'Success',
        description: t('success.profileUpdated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: t('error.profileUpdateFailed'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <Container maxW="container.md" py={8}>
      <Card p={6} bg={useColorModeValue('white', 'gray.700')} shadow="md">
        <Stack spacing={6}>
          <Heading size="lg">{t('profile.title')}</Heading>

          <Stack spacing={4}>
            <FormControl>
              <FormLabel>{t('setup.language')}</FormLabel>
              <Select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value as Language)}
                placeholder={t('placeholder.selectLanguage')}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="hi">हिन्दी</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{t('setup.currency')}</FormLabel>
              <Select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value as Currency)}
                placeholder={t('placeholder.selectCurrency')}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{t('setup.propertyType')}</FormLabel>
              <Select
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                placeholder={t('placeholder.selectPropertyType')}
              >
                <option value="house">{t('common.house')}</option>
                <option value="apartment">{t('common.apartment')}</option>
                <option value="condo">{t('common.condo')}</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{t('setup.address')}</FormLabel>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t('placeholder.enterAddress')}
              />
            </FormControl>

            <Button
              colorScheme="blue"
              onClick={handleSave}
              isLoading={saving}
            >
              {t('profile.save')}
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Container>
  );
};

export default Profile; 