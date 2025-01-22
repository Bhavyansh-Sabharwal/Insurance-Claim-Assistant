import { useState } from 'react';
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

type Collaboration = {
  id: string;
  inviteeEmail: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  dateInvited: string;
};

const roles = [
  'Editor',
  'Viewer',
  'Admin',
];

const Collaborate = () => {
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState(roles[0]);
  const [collaborations, setCollaborations] = useState<{
    sent: Collaboration[];
    received: Collaboration[];
  }>({ sent: [], received: [] });
  const [isLoading, setIsLoading] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleInvite = async () => {
    if (!newEmail) return;
    
    setIsLoading(true);
    try {
      // Placeholder for backend functionality
      const mockCollaboration: Collaboration = {
        id: Date.now().toString(),
        inviteeEmail: newEmail,
        role: newRole,
        status: 'pending',
        dateInvited: new Date().toISOString(),
      };

      setCollaborations(prev => ({
        ...prev,
        sent: [...prev.sent, mockCollaboration]
      }));

      setNewEmail('');
      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${newEmail}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error sending invite',
        description: 'Failed to send invitation',
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
      setCollaborations(prev => ({
        ...prev,
        sent: prev.sent.filter(collab => collab.id !== id)
      }));
      
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

  const handleResend = async (email: string) => {
    try {
      toast({
        title: 'Invitation resent',
        description: `Invitation resent to ${email}`,
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
              >
                Send Invite
              </Button>
            </Flex>
          </Stack>
        </Card>

        {collaborations.sent.length > 0 && (
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
                  {collaborations.sent.map(collaboration => (
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
                          onClick={() => handleResend(collaboration.inviteeEmail)}
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