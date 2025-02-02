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
import { useLocalization } from '../hooks/useLocalization';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { currentUser, logout } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [setupCompleted, setSetupCompleted] = useState(false);

  useEffect(() => {
    const checkSetupStatus = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        setSetupCompleted(userDoc.exists() ? userDoc.data()?.setupCompleted ?? false : false);
      } catch (error) {
        console.error('Error checking setup status:', error);
      }
    };

    checkSetupStatus();
  }, [currentUser]);

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
              {!setupCompleted ? (
                <Link as={RouterLink} to="/setup">{t('header.setup')}</Link>
              ) : (
                <>
                  <Link as={RouterLink} to="/">{t('header.home')}</Link>
                  <Link as={RouterLink} to="/inventory">{t('header.inventory')}</Link>
                  <Link as={RouterLink} to="/documents">{t('header.documents')}</Link>
                  <Link as={RouterLink} to="/collaborate">{t('header.collaborate')}</Link>
                  <Menu>
                    <MenuButton as={Button} variant="ghost">
                      {currentUser.email}
                    </MenuButton>
                    <MenuList>
                      <MenuItem as={RouterLink} to="/profile">
                        {t('header.profile')}
                      </MenuItem>
                      <MenuItem onClick={handleLogout}>{t('header.signOut')}</MenuItem>
                    </MenuList>
                  </Menu>
                </>
              )}
            </>
          ) : (
            <Button as={RouterLink} to="/auth">
              {t('button.signIn')}
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