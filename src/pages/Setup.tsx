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
import { updateUserProfile } from '../services/database';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

type Step = {
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    title: 'Basic Information',
    description: 'Set your language and currency preferences',
  },
  {
    title: 'Room Setup',
    description: 'Tell us about the rooms in your property',
  },
];

const suggestedRooms = [
  'Living Room',
  'Master Bedroom',
  'Kitchen',
  'Bathroom',
  'Dining Room',
  'Office',
  'Guest Bedroom',
  'Garage',
];

interface FormData {
  language: string;
  currency: string;
  propertyType: string;
  address: string;
  rooms: { name: string; selected: boolean }[];
  customRooms: string[];
}

const Setup = () => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const toast = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    language: '',
    currency: '',
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
      
      const allRooms = [...selectedRooms, ...formData.customRooms];
      
      for (let i = 0; i < allRooms.length; i++) {
        const roomRef = doc(collection(db, 'rooms'));
        await setDoc(roomRef, {
          id: roomRef.id,
          name: allRooms[i],
          items: [],
          userId: currentUser.uid,
          orderIndex: i,
        });
      }
      
      navigate('/inventory');
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
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
              <FormLabel>Preferred Language</FormLabel>
              <Select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                placeholder="Select language"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Preferred Currency</FormLabel>
              <Select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                placeholder="Select currency"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Property Type</FormLabel>
              <Select
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                placeholder="Select property type"
              >
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condominium</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Property Address</FormLabel>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your address"
              />
            </FormControl>
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={6}>
            <Box>
              <Text mb={4} fontWeight="medium">Select from suggested rooms:</Text>
              <VStack align="stretch" spacing={2}>
                {formData.rooms.map((room, index) => (
                  <Checkbox
                    key={room.name}
                    isChecked={room.selected}
                    onChange={() => handleRoomToggle(index)}
                  >
                    {room.name}
                  </Checkbox>
                ))}
              </VStack>
            </Box>

            <Box>
              <Text mb={4} fontWeight="medium">Add custom rooms:</Text>
              <HStack mb={4}>
                <Input
                  value={newCustomRoom}
                  onChange={(e) => setNewCustomRoom(e.target.value)}
                  placeholder="Enter room name"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCustomRoom();
                    }
                  }}
                />
                <IconButton
                  aria-label="Add room"
                  icon={<AddIcon />}
                  onClick={handleAddCustomRoom}
                />
              </HStack>
              <VStack align="stretch" spacing={2}>
                {formData.customRooms.map((room, index) => (
                  <HStack key={index} justify="space-between">
                    <Text>{room}</Text>
                    <IconButton
                      aria-label="Remove room"
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
            <Heading size="lg">{steps[currentStep].title}</Heading>
            <Text color={useColorModeValue('gray.600', 'gray.300')} mt={2}>
              {steps[currentStep].description}
            </Text>
          </Box>

          <Box>{renderStepContent(currentStep)}</Box>

          <Stack direction="row" spacing={4} justify="flex-end">
            {currentStep > 0 && (
              <Button onClick={handlePrevious} variant="outline">
                Previous
              </Button>
            )}
            <Button
              onClick={currentStep === steps.length - 1 ? handleComplete : handleNext}
              colorScheme="blue"
            >
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
};

export default Setup; 