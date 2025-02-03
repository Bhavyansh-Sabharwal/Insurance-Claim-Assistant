import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Heading,
  Text,
  useColorModeValue,
  Progress,
  Card,
  useToast,
  Checkbox,
  VStack,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences, Language, Currency } from '../contexts/PreferencesContext';
import { useLocalization } from '../hooks/useLocalization';
import { updateUserProfile } from '../services/database';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

type TranslationKey = keyof typeof import('../i18n/translations').translations[Language];

type Step = {
  title: TranslationKey;
  description: string;
};

const steps: Step[] = [
  {
    title: 'setup.basicInfo',
    description: 'Set your language and currency preferences',
  },
  {
    title: 'setup.roomSetup',
    description: 'Tell us about the rooms in your property',
  },
];

const suggestedRooms: TranslationKey[] = [
  'common.livingRoom',
  'common.masterBedroom',
  'common.kitchen',
  'common.bathroom',
  'common.diningRoom',
  'common.office',
  'common.guestBedroom',
  'common.garage',
];

interface FormData {
  language: Language;
  currency: Currency;
  propertyType: string;
  address: string;
  rooms: { name: TranslationKey; selected: boolean }[];
  customRooms: string[];
}

const Setup = () => {
  const { currentUser } = useAuth();
  const { updatePreferences, setPreferencesImmediately } = usePreferences();
  const { t } = useLocalization();
  const [currentStep, setCurrentStep] = useState(0);
  const toast = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    language: 'en',
    currency: 'USD',
    propertyType: '',
    address: '',
    rooms: suggestedRooms.map(room => ({ name: room, selected: false })),
    customRooms: [],
  });

  const [newCustomRoom, setNewCustomRoom] = useState('');

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Immediately update language and currency preferences
    if (field === 'language' || field === 'currency') {
      setPreferencesImmediately({ [field]: value });
    }
  };

  const handleRoomToggle = (index: number) => {
    const updatedRooms = [...formData.rooms];
    updatedRooms[index].selected = !updatedRooms[index].selected;
    handleInputChange('rooms', updatedRooms);
  };

  const handleAddCustomRoom = () => {
    if (!newCustomRoom.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      customRooms: [...prev.customRooms, newCustomRoom.trim()]
    }));
    setNewCustomRoom('');
  };

  const handleRemoveCustomRoom = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customRooms: prev.customRooms.filter((_, i) => i !== index)
    }));
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    if (!currentUser) return;

    try {
      // Save user preferences
      await updateUserProfile(currentUser.uid, {
        preferences: {
          language: formData.language,
          currency: formData.currency
        },
        propertyDetails: {
          type: formData.propertyType,
          address: formData.address,
          rooms: formData.rooms.filter(room => room.selected).length + formData.customRooms.length
        },
        setupCompleted: true
      });

      // Create rooms in Firestore
      const selectedRooms = formData.rooms
        .filter(room => room.selected)
        .map(room => room.name);
      
      const customRoomsWithPrefix = formData.customRooms.map(room => `custom.${room}`);
      const allRooms = [...selectedRooms, ...customRoomsWithPrefix];
      
      // Use Promise.all to wait for all room creations to complete
      await Promise.all(allRooms.map(async (roomName, i) => {
        const roomRef = doc(collection(db, 'rooms'));
        await setDoc(roomRef, {
          id: roomRef.id,
          name: roomName,
          items: [],
          userId: currentUser.uid,
          orderIndex: i,
        });
      }));
      
      window.location.href = '/inventory';
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: 'Error',
        description: t('error.setupFailed'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={4}>
            <FormControl isRequired>
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
            <FormControl isRequired>
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
            <FormControl isRequired>
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
            <FormControl isRequired>
              <FormLabel>{t('setup.address')}</FormLabel>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t('placeholder.enterAddress')}
              />
            </FormControl>
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={6}>
            <Box>
              <Text mb={4} fontWeight="medium">{t('text.suggestedRooms')}</Text>
              <VStack align="stretch" spacing={2}>
                {formData.rooms.map((room, index) => (
                  <Checkbox
                    key={room.name}
                    isChecked={room.selected}
                    onChange={() => handleRoomToggle(index)}
                  >
                    {t(room.name)}
                  </Checkbox>
                ))}
              </VStack>
            </Box>

            <Box>
              <Text mb={4} fontWeight="medium">{t('text.customRooms')}</Text>
              <HStack mb={4}>
                <Input
                  value={newCustomRoom}
                  onChange={(e) => setNewCustomRoom(e.target.value)}
                  placeholder={t('placeholder.enterRoomName')}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCustomRoom();
                    }
                  }}
                />
                <IconButton
                  aria-label={t('button.addRoom')}
                  icon={<AddIcon />}
                  onClick={handleAddCustomRoom}
                />
              </HStack>
              <VStack align="stretch" spacing={2}>
                {formData.customRooms.map((room, index) => (
                  <HStack key={index} justify="space-between">
                    <Text>{room}</Text>
                    <IconButton
                      aria-label={t('button.removeRoom')}
                      icon={<DeleteIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleRemoveCustomRoom(index)}
                    />
                  </HStack>
                ))}
              </VStack>
            </Box>
          </Stack>
        );
      default:
        return null;
    }
  };

  return (
    <Box maxW="container.md" mx="auto" py={8}>
      <Progress value={progress} mb={8} colorScheme="blue" />
      
      <Card p={6} bg={useColorModeValue('white', 'gray.700')} shadow="md">
        <Stack spacing={6}>
          <Box>
            <Heading size="lg">{t(steps[currentStep].title)}</Heading>
            <Text color={useColorModeValue('gray.600', 'gray.300')} mt={2}>
              {steps[currentStep].description}
            </Text>
          </Box>

          <Box>{renderStepContent(currentStep)}</Box>

          <Stack direction="row" spacing={4} justify="flex-end">
            {currentStep > 0 && (
              <Button onClick={handlePrevious} variant="outline">
                {t('setup.previous')}
              </Button>
            )}
            <Button
              onClick={currentStep === steps.length - 1 ? handleComplete : handleNext}
              colorScheme="blue"
            >
              {currentStep === steps.length - 1 ? t('setup.complete') : t('setup.next')}
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
};

export default Setup;