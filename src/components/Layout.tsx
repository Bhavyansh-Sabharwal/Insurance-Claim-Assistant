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
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../hooks/useLocalization';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { HamburgerIcon } from '@chakra-ui/icons';

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
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const NavLinks = () => (
    <>
      {!setupCompleted ? (
        <Link as={RouterLink} to="/setup">{t('header.setup')}</Link>
      ) : (
        <>
          <Link as={RouterLink} to="/">{t('header.home')}</Link>
          <Link as={RouterLink} to="/inventory">{t('header.inventory')}</Link>
          <Link as={RouterLink} to="/documents">{t('header.documents')}</Link>
          <Link as={RouterLink} to="/collaborate">{t('header.collaborate')}</Link>
        </>
      )}
    </>
  );

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
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" noOfLines={1}>
            Insurance Claim Assistant
          </Text>
        </Link>
        <Spacer />

        {/* Desktop Navigation */}
        <Flex gap={6} align="center" display={{ base: 'none', md: 'flex' }}>
          {currentUser ? (
            <>
              <NavLinks />
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
          ) : (
            <Button as={RouterLink} to="/auth">
              {t('button.signIn')}
            </Button>
          )}
        </Flex>

        {/* Mobile Navigation */}
        {currentUser && (
          <Box display={{ base: 'block', md: 'none' }}>
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon />}
              variant="ghost"
              onClick={onOpen}
            />
            <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
              <DrawerOverlay />
              <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>Menu</DrawerHeader>
                <DrawerBody>
                  <VStack spacing={4} align="stretch">
                    <NavLinks />
                    <Link as={RouterLink} to="/profile">{t('header.profile')}</Link>
                    <Button variant="ghost" onClick={handleLogout}>{t('header.signOut')}</Button>
                  </VStack>
                </DrawerBody>
              </DrawerContent>
            </Drawer>
          </Box>
        )}

        {/* Mobile Sign In Button */}
        {!currentUser && (
          <Box display={{ base: 'block', md: 'none' }}>
            <Button as={RouterLink} to="/auth" size="sm">
              {t('button.signIn')}
            </Button>
          </Box>
        )}
      </Flex>
      <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;