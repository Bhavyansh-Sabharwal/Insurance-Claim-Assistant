import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Stack,
  Input,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Card,
  FormControl,
  FormLabel,
  Select,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import { DeleteIcon, EmailIcon } from '@chakra-ui/icons';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

type Collaboration = {
  id: string;
  inviteeEmail: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  dateInvited: string;
  senderId: string;
};

const roles = [
  'Editor',
  'Viewer',
  'Admin',
];

const Collaborate = () => {
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState(roles[0]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fetch existing invitations
  const fetchInvitations = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return;

    const db = getFirestore();
    const q = query(
      collection(db, 'invitations'),
      where('senderId', '==', auth.currentUser.uid)
    );

    try {
      const querySnapshot = await getDocs(q);
      const invitations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Collaboration));
      setCollaborations(invitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleInvite = async () => {
    if (!newEmail) return;
    
    const auth = getAuth();
    if (!auth.currentUser) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to send invitations',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const db = getFirestore();
      
      // Create the invitation document first
      const invitationRef = await addDoc(collection(db, 'invitations'), {
        inviteeEmail: newEmail,
        role: newRole,
        status: 'pending',
        dateInvited: new Date().toISOString(),
        senderId: auth.currentUser.uid
      });

      // Send the email
      await addDoc(collection(db, 'mail'), {
        to: newEmail,
        from: auth.currentUser.email,
        message: {
          subject: 'Invitation to Join Household Insurance Claims',
          text: `You have been invited to join a household for insurance claims management. 
Accept: ${window.location.origin}/join?email=${encodeURIComponent(newEmail)}&inviteId=${invitationRef.id}&from=${encodeURIComponent(auth.currentUser.email || '')}
Reject: ${window.location.origin}/join/reject?inviteId=${invitationRef.id}`,
          html: `
            <h2>You've Been Invited!</h2>
            <p>You have been invited by ${auth.currentUser.email} to join their household for insurance claims management.</p>
            <div style="margin: 24px 0;">
              <a href="${window.location.origin}/join?email=${encodeURIComponent(newEmail)}&inviteId=${invitationRef.id}&from=${encodeURIComponent(auth.currentUser.email || '')}" style="
                background-color: #3182CE;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                margin-right: 12px;
              ">Accept Invitation</a>
              
              <a href="${window.location.origin}/join/reject?inviteId=${invitationRef.id}" style="
                background-color: #E53E3E;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
              ">Reject Invitation</a>
            </div>
            <p>If you didn't expect this invitation, you can safely ignore this email or click reject.</p>
          `,
        }
      });

      // Add to local state
      const newInvitation: Collaboration = {
        id: invitationRef.id,
        inviteeEmail: newEmail,
        role: newRole,
        status: 'pending',
        dateInvited: new Date().toISOString(),
        senderId: auth.currentUser.uid
      };

      setCollaborations(prev => [...prev, newInvitation]);
      setNewEmail('');
      
      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${newEmail}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: 'Error sending invite',
        description: error.message || 'Failed to send invitation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'invitations', id));
      
      setCollaborations(prev => prev.filter(collab => collab.id !== id));
      
      toast({
        title: 'Invitation deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting invitation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleResend = async (collaboration: Collaboration) => {
    const auth = getAuth();
    if (!auth.currentUser) return;

    try {
      const db = getFirestore();
      
      // Resend the email
      await addDoc(collection(db, 'mail'), {
        to: collaboration.inviteeEmail,
        from: auth.currentUser.email,
        message: {
          subject: 'Invitation to Join Household Insurance Claims (Resent)',
          text: `You have been invited to join a household for insurance claims management. 
Accept: ${window.location.origin}/join?email=${encodeURIComponent(collaboration.inviteeEmail)}&inviteId=${collaboration.id}&from=${encodeURIComponent(auth.currentUser.email || '')}
Reject: ${window.location.origin}/join/reject?inviteId=${collaboration.id}`,
          html: `
            <h2>You've Been Invited!</h2>
            <p>You have been invited by ${auth.currentUser.email} to join their household for insurance claims management.</p>
            <div style="margin: 24px 0;">
              <a href="${window.location.origin}/join?email=${encodeURIComponent(collaboration.inviteeEmail)}&inviteId=${collaboration.id}&from=${encodeURIComponent(auth.currentUser.email || '')}" style="
                background-color: #3182CE;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                margin-right: 12px;
              ">Accept Invitation</a>
              
              <a href="${window.location.origin}/join/reject?inviteId=${collaboration.id}" style="
                background-color: #E53E3E;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
              ">Reject Invitation</a>
            </div>
            <p>If you didn't expect this invitation, you can safely ignore this email or click reject.</p>
          `,
        }
      });

      // Update the invitation's date
      await updateDoc(doc(db, 'invitations', collaboration.id), {
        dateInvited: new Date().toISOString()
      });

      // Update local state
      setCollaborations(prev =>
        prev.map(collab =>
          collab.id === collaboration.id
            ? { ...collab, dateInvited: new Date().toISOString() }
            : collab
        )
      );

      toast({
        title: 'Invitation resent',
        description: `Invitation resent to ${collaboration.inviteeEmail}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error resending invitation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box>
          <Heading size="lg" mb={4}>Collaborate</Heading>
          <Text color={useColorModeValue('gray.600', 'gray.300')}>
            Invite others to collaborate on your account
          </Text>
        </Box>

        <Card p={6} bg={bgColor} borderColor={borderColor}>
          <Stack spacing={6}>
            <Heading size="md">Invite Collaborator</Heading>
            
            <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                  size="md"
                  maxH="40px"
                />
              </FormControl>

              <FormControl maxW={{ base: '100%', md: '200px' }}>
                <FormLabel>Role</FormLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Button
                colorScheme="blue"
                onClick={handleInvite}
                leftIcon={<EmailIcon />}
                isLoading={isLoading}
                alignSelf={{ base: 'stretch', md: 'flex-end' }}
                mt={{ base: 0, md: 8 }}
                minW="140px"
                h="40px"
              >
                Send Invite
              </Button>
            </Flex>
          </Stack>
        </Card>

        {collaborations.length > 0 && (
          <Card p={6} bg={bgColor} borderColor={borderColor}>
            <Stack spacing={6}>
              <Heading size="md">Sent Invitations</Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Date Invited</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {collaborations.map(collaboration => (
                    <Tr key={collaboration.id}>
                      <Td>{collaboration.inviteeEmail}</Td>
                      <Td>{collaboration.role}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            collaboration.status === 'accepted'
                              ? 'green'
                              : collaboration.status === 'rejected'
                              ? 'red'
                              : 'yellow'
                          }
                        >
                          {collaboration.status}
                        </Badge>
                      </Td>
                      <Td>{new Date(collaboration.dateInvited).toLocaleDateString()}</Td>
                      <Td>
                        <IconButton
                          aria-label="Delete invitation"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDelete(collaboration.id)}
                        />
                        <IconButton
                          aria-label="Resend invitation"
                          icon={<EmailIcon />}
                          size="sm"
                          ml={2}
                          onClick={() => handleResend(collaboration)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
};

export default Collaborate; 