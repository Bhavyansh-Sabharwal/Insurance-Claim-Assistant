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

type Collaborator = {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'active';
  dateInvited: string;
};

const roles = [
  'Editor',
  'Viewer',
  'Admin',
];

const Collaborate = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Editor');
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleInvite = () => {
    if (!newEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      email: newEmail,
      role: newRole,
      status: 'pending',
      dateInvited: new Date().toLocaleDateString(),
    };

    setCollaborators(prev => [...prev, newCollaborator]);
    setNewEmail('');

    toast({
      title: 'Invitation Sent',
      description: `Invitation sent to ${newEmail}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleRemove = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
    toast({
      title: 'Collaborator Removed',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleResend = (email: string) => {
    toast({
      title: 'Invitation Resent',
      description: `Invitation resent to ${email}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box>
          <Heading size="lg" mb={4}>Collaboration</Heading>
          <Text color={useColorModeValue('gray.600', 'gray.300')}>
            Invite others to help with your insurance claim documentation.
          </Text>
        </Box>

        <Card p={6} bg={bgColor} borderColor={borderColor}>
          <Stack spacing={6}>
            <Heading size="md">Invite Collaborators</Heading>
            
            <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
              <FormControl>
                <FormLabel>Email Address</FormLabel>
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
                alignSelf={{ base: 'stretch', md: 'flex-end' }}
                mt={{ base: 0, md: 8 }}
              >
                Send Invitation
              </Button>
            </Flex>
          </Stack>
        </Card>

        <Card p={6} bg={bgColor} borderColor={borderColor}>
          <Stack spacing={6}>
            <Heading size="md">Current Collaborators</Heading>
            
            <Box overflowX="auto">
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
                  {collaborators.map(collaborator => (
                    <Tr key={collaborator.id}>
                      <Td>{collaborator.email}</Td>
                      <Td>{collaborator.role}</Td>
                      <Td>
                        <Badge
                          colorScheme={collaborator.status === 'active' ? 'green' : 'yellow'}
                        >
                          {collaborator.status}
                        </Badge>
                      </Td>
                      <Td>{collaborator.dateInvited}</Td>
                      <Td>
                        <Stack direction="row" spacing={2}>
                          {collaborator.status === 'pending' && (
                            <Button
                              size="sm"
                              leftIcon={<EmailIcon />}
                              onClick={() => handleResend(collaborator.email)}
                            >
                              Resend
                            </Button>
                          )}
                          <IconButton
                            aria-label="Remove collaborator"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleRemove(collaborator.id)}
                          />
                        </Stack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {collaborators.length === 0 && (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">
                    No collaborators added yet
                  </Text>
                </Box>
              )}
            </Box>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};

export default Collaborate; 