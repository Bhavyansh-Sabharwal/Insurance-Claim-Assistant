import {
  Box,
  Container,
  Flex,
  Link,
  Spacer,
  Text,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

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
        <Flex gap={6} align="center">
          {currentUser ? (
            <>
              <Link as={RouterLink} to="/setup">Setup</Link>
              <Link as={RouterLink} to="/inventory">Inventory</Link>
              <Link as={RouterLink} to="/documents">Documents</Link>
              <Link as={RouterLink} to="/collaborate">Collaborate</Link>
              <Menu>
                <MenuButton as={Button} variant="ghost">
                  {currentUser.email}
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <Button as={RouterLink} to="/auth">
              Sign In
            </Button>
          )}
        </Flex>
      </Flex>
      <Container maxW="container.xl" py={8}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout; 