import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../contexts/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationChecks, setVerificationChecks] = useState(0);
  
  const { loginWithEmail, signupWithEmail, loginWithGoogle, checkEmailVerified, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
        navigate('/setup');
      } else {
        await signupWithEmail(email, password);
        setShowVerification(true);
        toast({
          title: 'Verification Email Sent',
          description: 'Please check your email to verify your account',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      toast({
        title: 'Verification Email Sent',
        description: 'A new verification email has been sent to your address',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send verification email',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const checkVerification = async () => {
    try {
      const isVerified = await checkEmailVerified();
      if (isVerified) {
        toast({
          title: 'Email Verified',
          description: 'Your email has been verified successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate('/setup');
      } else {
        setVerificationChecks(prev => prev + 1);
        toast({
          title: 'Not Verified',
          description: 'Please check your email and click the verification link',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to check verification status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      navigate('/setup');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (showVerification) {
    return (
      <Box maxW="md" mx="auto" py={12}>
        <Card p={8}>
          <VStack spacing={6}>
            <Heading size="lg">Verify Your Email</Heading>
            
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Verification Required</AlertTitle>
                <AlertDescription>
                  We've sent a verification link to {email}. Please check your email and click the link to verify your account.
                </AlertDescription>
              </Box>
            </Alert>

            <Stack spacing={4} width="100%">
              <Button
                colorScheme="blue"
                onClick={checkVerification}
                isLoading={loading}
              >
                I've Verified My Email
              </Button>

              {verificationChecks > 0 && (
                <Button
                  variant="outline"
                  onClick={handleResendVerification}
                  isDisabled={loading}
                >
                  Resend Verification Email
                </Button>
              )}
            </Stack>
          </VStack>
        </Card>
      </Box>
    );
  }

  return (
    <Box maxW="md" mx="auto" py={12}>
      <Card p={8}>
        <VStack spacing={6}>
          <Heading size="lg">{isLogin ? 'Sign In' : 'Create Account'}</Heading>
          
          <Button
            w="full"
            leftIcon={<FcGoogle />}
            onClick={handleGoogleSignIn}
            variant="outline"
          >
            Continue with Google
          </Button>

          <Divider />

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                w="full"
              >
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </Stack>
          </form>

          <Text>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Button
              variant="link"
              colorScheme="blue"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Button>
          </Text>
        </VStack>
      </Card>
    </Box>
  );
};

export default Auth; 