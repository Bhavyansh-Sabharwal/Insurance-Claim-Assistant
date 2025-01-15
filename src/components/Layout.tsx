import { Box, Container, Flex, Link, Spacer, Text, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box minH="100vh">
      <Flex
        as="nav"
        align="center"
        padding="1.5rem"
        bg={bgColor}
        borderBottom="1px"
        borderColor={borderColor}
        position="sticky"
        top="0"
        zIndex="sticky"
      >
        <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
          <Text fontSize="xl" fontWeight="bold">
            Insurance Claim Assistant
          </Text>
        </Link>
        <Spacer />
        <Flex gap={6}>
          <Link as={RouterLink} to="/setup">Setup</Link>
          <Link as={RouterLink} to="/inventory">Inventory</Link>
          <Link as={RouterLink} to="/documents">Documents</Link>
          <Link as={RouterLink} to="/collaborate">Collaborate</Link>
        </Flex>
      </Flex>
      <Container maxW="container.xl" py={8}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout; 