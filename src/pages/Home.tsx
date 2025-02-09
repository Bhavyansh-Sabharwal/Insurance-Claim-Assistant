import { Box, Button, Container, Heading, SimpleGrid, Text, VStack, Icon, useColorModeValue } from '@chakra-ui/react';
import { FaClipboardList, FaUpload, FaUsers, FaGlobe, FaHome } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useLocalization } from '../hooks/useLocalization';

const Feature = ({ icon, title, text }: { icon: any; title: string; text: string }) => {
  return (
    <VStack
      align="start"
      p={6}
      bg={useColorModeValue('white', 'gray.700')}
      rounded="lg"
      shadow="md"
      height="100%"
    >
      <Icon as={icon} w={10} h={10} color="blue.500" />
      <Heading size="md">{title}</Heading>
      <Text color={useColorModeValue('gray.600', 'gray.300')}>{text}</Text>
    </VStack>
  );
};

const Home = () => {
  const { t } = useLocalization();
  
  return (
    <Box>
      {/* Hero Section */}
      <Box
        bg={useColorModeValue('blue.50', 'blue.900')}
        py={20}
        px={4}
        mb={16}
        textAlign="center"
      >
        <Container maxW="container.lg">
          <Heading
            as="h1"
            size="2xl"
            mb={6}
            color={useColorModeValue('blue.600', 'blue.200')}
          >
            Recover What Matters Most
          </Heading>
          <Text fontSize="xl" mb={8} color={useColorModeValue('gray.600', 'gray.300')}>
            Whether you've experienced a natural disaster, theft, or any unexpected loss, we're here to help you document, organize, and process your insurance claim with ease. Get back to what matters most - rebuilding your life.
          </Text>
          <Button
            as={RouterLink}
            to="/setup"
            size="lg"
            colorScheme="blue"
            px={8}
          >
            Start Your Recovery Journey
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={8}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
          <Feature
            icon={FaHome}
            title="Complete Home Inventory"
            text="Easily document and organize all your belongings, room by room, with our smart inventory system. Perfect for any type of property loss."
          />
          <Feature
            icon={FaUpload}
            title="Smart Documentation"
            text="Upload and manage all your important documents, from receipts to warranties. Our AI helps identify and categorize your items automatically."
          />
          <Feature
            icon={FaUsers}
            title="Expert Collaboration"
            text="Work seamlessly with insurance adjusters, restoration experts, and other professionals to expedite your claim process."
          />
          <Feature
            icon={FaGlobe}
            title="Accessible for Everyone"
            text="Available in multiple languages with an intuitive interface designed to help anyone navigate the insurance claim process with confidence."
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Home; 