import {
  Box,
  Card,
  useColorModeValue,
  Container,
  Stack,
  Heading,
  Text,
  BoxProps,
  CardProps,
  ContainerProps,
  Button,
  ButtonProps,
} from '@chakra-ui/react';

// Common color mode values
export const useCommonColors = () => ({
  bgColor: useColorModeValue('white', 'gray.700'),
  borderColor: useColorModeValue('gray.200', 'gray.600'),
  textColor: useColorModeValue('gray.600', 'gray.300'),
  headingColor: useColorModeValue('blue.600', 'blue.200'),
});

// Common page container
export const PageContainer = (props: ContainerProps) => (
  <Container maxW="container.xl" py={8} {...props} />
);

// Common card component
export const CommonCard = (props: CardProps) => {
  const { bgColor } = useCommonColors();
  return <Card p={6} bg={bgColor} shadow="md" {...props} />;
};

// Common section header
export const SectionHeader = ({ title, description }: { title: string; description?: string }) => {
  const { textColor } = useCommonColors();
  return (
    <Box mb={4}>
      <Heading size="lg" mb={2}>{title}</Heading>
      {description && <Text color={textColor}>{description}</Text>}
    </Box>
  );
};

// Common action button
export const ActionButton = (props: ButtonProps) => (
  <Button colorScheme="blue" {...props} />
);

// Common form container
export const FormContainer = (props: BoxProps) => (
  <Box maxW="container.md" mx="auto" py={8} {...props} />
);

// Common stack layout
export const ContentStack = (props: any) => (
  <Stack spacing={6} {...props} />
); 