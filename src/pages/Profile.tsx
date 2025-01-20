import { useState, useEffect } from 'react';
import {
  Box,
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
import { updateUserProfile } from '../services/database';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ProfileData {
  language: string;
  currency: string;
  propertyType: string;
  address: string;
  rooms: number;
}

const Profile = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ProfileData>({
    language: '',
    currency: '',
    propertyType: '',
    address: '',
    rooms: 0,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData({
            language: data.preferences?.language || '',
            currency: data.preferences?.currency || '',
            propertyType: data.propertyDetails?.type || '',
            address: data.propertyDetails?.address || '',
            rooms: data.propertyDetails?.rooms || 0,
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, toast]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
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
          <Heading size="lg">Profile Settings</Heading>

          <Stack spacing={4}>
            <FormControl>
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

            <FormControl>
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

            <FormControl>
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

            <FormControl>
              <FormLabel>Property Address</FormLabel>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your address"
              />
            </FormControl>

            <Button
              colorScheme="blue"
              onClick={handleSave}
              isLoading={saving}
              alignSelf="flex-end"
            >
              Save Changes
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Container>
  );
};

export default Profile; 