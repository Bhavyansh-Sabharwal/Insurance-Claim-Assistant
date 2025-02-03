import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../contexts/AuthContext';
import { FormContainer, CommonCard } from '../components/shared/UIComponents';
import { useForm, useErrorHandler, useLoading } from '../hooks/useCommon';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const handleError = useErrorHandler();
  const { loading, withLoading } = useLoading();
  const { values, handleChange } = useForm({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    withLoading(async () => {
      try {
        const authFn = isLogin ? loginWithEmail : signupWithEmail;
        await authFn(values.email, values.password);
        navigate('/setup');
      } catch (error) {
        handleError(error);
      }
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      navigate('/setup');
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <FormContainer>
      <CommonCard>
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
                  value={values.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={values.password}
                  onChange={(e) => handleChange('password', e.target.value)}
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
      </CommonCard>
    </FormContainer>
  );
};

export default Auth; 