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
import { useLocalization } from '../hooks/useLocalization';

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
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState(roles[0]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const { t } = useLocalization();

  const handleInvite = () => {
    if (!newEmail) return;

    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      email: newEmail,
      role: newRole,
      status: 'pending',
      dateInvited: new Date().toLocaleDateString(),
    };

    setCollaborators([...collaborators, newCollaborator]);
    setNewEmail('');
    
    toast({
      title: t('collaborate.inviteSent'),
      description: `Invitation sent to ${newEmail}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDelete = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
    toast({
      title: t('collaborate.inviteDeleted'),
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleResend = (email: string) => {
    toast({
      title: t('collaborate.inviteResent'),
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
          <Heading size="lg" mb={4}>{t('collaborate.title')}</Heading>
          <Text color={useColorModeValue('gray.600', 'gray.300')}>
            {t('collaborate.description')}
          </Text>
        </Box>

        <Card p={6} bg={bgColor} borderColor={borderColor}>
          <Stack spacing={6}>
            <Heading size="md">{t('collaborate.invite')}</Heading>
            
            <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
              <FormControl>
                <FormLabel>{t('collaborate.email')}</FormLabel>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('placeholder.enterEmail')}
                />
              </FormControl>

              <FormControl maxW={{ base: '100%', md: '200px' }}>
                <FormLabel>{t('collaborate.role')}</FormLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {t(`collaborate.roles.${role.toLowerCase()}`)}
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
                {t('collaborate.sendInvite')}
              </Button>
            </Flex>
          </Stack>
        </Card>

        {collaborators.length > 0 ? (
          <Card p={6} bg={bgColor} borderColor={borderColor}>
            <Stack spacing={6}>
              <Heading size="md">{t('collaborate.pendingInvites')}</Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>{t('collaborate.email')}</Th>
                    <Th>{t('collaborate.role')}</Th>
                    <Th>{t('collaborate.status')}</Th>
                    <Th>{t('collaborate.dateInvited')}</Th>
                    <Th>{t('collaborate.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {collaborators.map(collaborator => (
                    <Tr key={collaborator.id}>
                      <Td>{collaborator.email}</Td>
                      <Td>{t(`collaborate.roles.${collaborator.role.toLowerCase()}`)}</Td>
                      <Td>
                        <Badge colorScheme={collaborator.status === 'active' ? 'green' : 'yellow'}>
                          {t(`collaborate.status.${collaborator.status}`)}
                        </Badge>
                      </Td>
                      <Td>{collaborator.dateInvited}</Td>
                      <Td>
                        <Flex gap={2}>
                          <IconButton
                            aria-label={t('button.resend')}
                            icon={<EmailIcon />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResend(collaborator.email)}
                          />
                          <IconButton
                            aria-label={t('button.delete')}
                            icon={<DeleteIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDelete(collaborator.id)}
                          />
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Stack>
          </Card>
        ) : (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">{t('collaborate.noInvites')}</Text>
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default Collaborate; 