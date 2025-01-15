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
} from '@chakra-ui/react';

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
    title: 'Household Details',
    description: 'Tell us about your property',
  },
  {
    title: 'Contact Information',
    description: 'How can we reach you?',
  },
];

const Setup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Preferred Language</FormLabel>
              <Select placeholder="Select language">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Preferred Currency</FormLabel>
              <Select placeholder="Select currency">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </Select>
            </FormControl>
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Property Type</FormLabel>
              <Select placeholder="Select property type">
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condominium</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Number of Rooms</FormLabel>
              <Input type="number" min={1} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Property Address</FormLabel>
              <Input placeholder="Enter your address" />
            </FormControl>
          </Stack>
        );
      case 2:
        return (
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email Address</FormLabel>
              <Input type="email" placeholder="Enter your email" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Phone Number</FormLabel>
              <Input type="tel" placeholder="Enter your phone number" />
            </FormControl>
            <FormControl>
              <FormLabel>Alternate Contact</FormLabel>
              <Input placeholder="Enter alternate contact information" />
            </FormControl>
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
              onClick={handleNext}
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