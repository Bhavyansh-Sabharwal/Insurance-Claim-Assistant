import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Card,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const RejectPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  
  const inviteId = searchParams.get('inviteId');
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const rejectInvitation = async () => {
      if (!inviteId) {
        setError('Invalid invitation link');
        setIsProcessing(false);
        return;
      }

      try {
        const db = getFirestore();
        await updateDoc(doc(db, 'invitations', inviteId), {
          status: 'rejected'
        });

        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (error: any) {
        setError(error.message || 'Failed to reject invitation');
      } finally {
        setIsProcessing(false);
      }
    };

    rejectInvitation();
  }, [inviteId, navigate]);

  return (
    <Container maxW="container.sm" py={8}>
      <Card p={8} bg={bgColor} borderColor={borderColor}>
        <VStack spacing={6} align="center">
          {isProcessing ? (
            <>
              <Spinner size="xl" />
              <Text>Processing your response...</Text>
            </>
          ) : error ? (
            <>
              <Heading size="lg" color="red.500">Error</Heading>
              <Text>{error}</Text>
            </>
          ) : (
            <>
              <Heading size="lg">Invitation Rejected</Heading>
              <Text>The invitation has been rejected successfully.</Text>
              <Text>Redirecting you to the home page...</Text>
            </>
          )}
        </VStack>
      </Card>
    </Container>
  );
};

export default RejectPage; 