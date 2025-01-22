import { Box, Button, Container, Heading, SimpleGrid, Text, VStack, Icon, useColorModeValue } from '@chakra-ui/react';
import { FaClipboardList, FaUpload, FaUsers, FaGlobe } from 'react-icons/fa';
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
            {t('home.heroTitle')}
          </Heading>
          <Text fontSize="xl" mb={8} color={useColorModeValue('gray.600', 'gray.300')}>
            {t('home.heroSubtitle')}
          </Text>
          <Button
            as={RouterLink}
            to="/setup"
            size="lg"
            colorScheme="blue"
            px={8}
          >
            {t('home.getStarted')}
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={8}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
          <Feature
            icon={FaClipboardList}
            title={t('home.features.inventory')}
            text={t('home.features.inventoryDesc')}
          />
          <Feature
            icon={FaUpload}
            title={t('home.features.documents')}
            text={t('home.features.documentsDesc')}
          />
          <Feature
            icon={FaUsers}
            title={t('home.features.collaborate')}
            text={t('home.features.collaborateDesc')}
          />
          <Feature
            icon={FaGlobe}
            title={t('home.features.accessibility')}
            text={t('home.features.accessibilityDesc')}
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Home; 