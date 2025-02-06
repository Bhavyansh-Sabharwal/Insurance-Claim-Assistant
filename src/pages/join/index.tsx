import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  useToast,
  VStack,
  Card,
  useColorModeValue,
} from '@chakra-ui/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, updateDoc, setDoc, getDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

const JoinPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inviteId = searchParams.get('inviteId');
  const fromEmail = searchParams.get('from');

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !inviteId) return;

    setIsLoading(true);
    try {
      const auth = getAuth();
      const db = getFirestore();

      console.log('Starting signup process...');

      // Get the invitation details first
      console.log('Fetching invitation:', inviteId);
      const invitationDoc = await getDoc(doc(db, 'invitations', inviteId));
      if (!invitationDoc.exists()) {
        throw new Error('Invitation not found');
      }
      console.log('Invitation found:', invitationDoc.data());
      
      const invitationData = invitationDoc.data();
      const senderId = invitationData.senderId;

      // Create the user account
      console.log('Creating user account...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created:', user.uid);

      // Create the user document first
      console.log('Creating user document...');
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        setupCompleted: true, // Mark setup as completed
        createdAt: new Date().toISOString(),
        primaryHousehold: senderId
      });
      console.log('User document created');

      // Update the invitation status next
      console.log('Updating invitation status...');
      await updateDoc(doc(db, 'invitations', inviteId), {
        status: 'accepted',
        acceptedUserId: user.uid
      });
      console.log('Invitation updated');

      // Then handle household operations
      console.log('Checking household:', senderId);
      const householdRef = doc(db, 'households', senderId);
      const householdDoc = await getDoc(householdRef);

      if (!householdDoc.exists()) {
        console.log('Creating new household...');
        await setDoc(householdRef, {
          ownerId: senderId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('Household created');
      }

      // Add the user as a member
      console.log('Adding user to household...');
      await setDoc(doc(db, 'households', senderId, 'members', user.uid), {
        email: user.email,
        role: invitationData.role || 'editor',
        addedAt: new Date().toISOString(),
        addedBy: senderId
      });
      console.log('User added to household');

      // Merge documents and inventory
      console.log('Merging user data...');
      
      // Get all documents from the invitee
      const docsQuery = query(collection(db, 'documents'), where('userId', '==', user.uid));
      const docsSnapshot = await getDocs(docsQuery);
      
      // Update document ownership to sender
      const batch = writeBatch(db);
      docsSnapshot.forEach((docSnapshot) => {
        const docRef = doc(db, 'documents', docSnapshot.id);
        batch.update(docRef, { userId: senderId });
      });
      
      // Get all rooms/inventory from the invitee
      const roomsQuery = query(collection(db, 'rooms'), where('userId', '==', user.uid));
      const roomsSnapshot = await getDocs(roomsQuery);
      
      // Update room ownership to sender
      roomsSnapshot.forEach((roomSnapshot) => {
        const roomRef = doc(db, 'rooms', roomSnapshot.id);
        batch.update(roomRef, { userId: senderId });
      });
      
      // Commit all updates
      await batch.commit();
      console.log('Data merged successfully');

      toast({
        title: 'Account created',
        description: 'You have successfully joined the household',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Navigate to inventory page instead of setup
      navigate('/inventory');
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.code) console.error('Error code:', error.code);
      if (error.details) console.error('Error details:', error.details);
      
      toast({
        title: 'Error creating account',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={8}>
      <Card p={8} bg={bgColor} borderColor={borderColor}>
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" mb={2}>Join Household</Heading>
            {fromEmail && (
              <Text color="gray.600">
                You've been invited by {fromEmail}
              </Text>
            )}
          </Box>

          <form onSubmit={handleSignUp}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  isReadOnly
                  bg="gray.50"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="100%"
                isLoading={isLoading}
                loadingText="Creating account..."
              >
                Create Account & Join
              </Button>
            </VStack>
          </form>
        </VStack>
      </Card>
    </Container>
  );
};

export default JoinPage;