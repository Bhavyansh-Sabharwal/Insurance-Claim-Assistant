import { Box, Button, Container, Heading, SimpleGrid, Text, VStack, Icon, useColorModeValue } from '@chakra-ui/react';
import { FaClipboardList, FaUpload, FaUsers, FaGlobe } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

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
            Simplify Your Insurance Claims Process
          </Heading>
          <Text fontSize="xl" mb={8} color={useColorModeValue('gray.600', 'gray.300')}>
            A user-friendly platform designed to help wildfire survivors document and manage their insurance claims efficiently.
          </Text>
          <Button
            as={RouterLink}
            to="/setup"
            size="lg"
            colorScheme="blue"
            px={8}
          >
            Get Started
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={8}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
          <Feature
            icon={FaClipboardList}
            title="Guided Inventory"
            text="Create comprehensive inventories with our intuitive checklist system and memory aids."
          />
          <Feature
            icon={FaUpload}
            title="Easy Documentation"
            text="Upload and organize receipts, photos, and other documentation seamlessly."
          />
          <Feature
            icon={FaUsers}
            title="Collaboration"
            text="Work together with family members or trusted friends on your claim."
          />
          <Feature
            icon={FaGlobe}
            title="Accessibility"
            text="Multiple language support and currency conversion for everyone's needs."
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Home; 