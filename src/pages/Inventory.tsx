import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
  IconButton,
  Flex,
  Card,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  useDisclosure,
  Select,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';

type Item = {
  id: string;
  name: string;
  description: string;
  estimatedValue: number;
  room: string;
  category: string;
};

type Room = {
  id: string;
  name: string;
  items: Item[];
};

const defaultRooms: Room[] = [
  { id: '1', name: 'Living Room', items: [] },
  { id: '2', name: 'Kitchen', items: [] },
  { id: '3', name: 'Bedroom', items: [] },
  { id: '4', name: 'Bathroom', items: [] },
];

const categories = [
  'Furniture',
  'Electronics',
  'Appliances',
  'Clothing',
  'Decor',
  'Other',
];

const Inventory = () => {
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newItem, setNewItem] = useState<Partial<Item>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleAddItem = () => {
    if (!selectedRoom || !newItem.name) return;

    const item: Item = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description || '',
      estimatedValue: Number(newItem.estimatedValue) || 0,
      room: selectedRoom.id,
      category: newItem.category || 'Other',
    };

    setRooms(rooms.map(room => 
      room.id === selectedRoom.id
        ? { ...room, items: [...room.items, item] }
        : room
    ));

    setNewItem({});
    onClose();
  };

  const handleDeleteItem = (roomId: string, itemId: string) => {
    setRooms(rooms.map(room =>
      room.id === roomId
        ? { ...room, items: room.items.filter(item => item.id !== itemId) }
        : room
    ));
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Grid templateColumns={{ base: '1fr', md: '250px 1fr' }} gap={8}>
        {/* Rooms Sidebar */}
        <Stack spacing={4}>
          <Heading size="md">Rooms</Heading>
          {rooms.map(room => (
            <Button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              variant={selectedRoom?.id === room.id ? 'solid' : 'outline'}
              colorScheme={selectedRoom?.id === room.id ? 'blue' : 'gray'}
              justifyContent="space-between"
            >
              {room.name}
              <Badge>{room.items.length}</Badge>
            </Button>
          ))}
        </Stack>

        {/* Items List */}
        <Box>
          {selectedRoom ? (
            <Stack spacing={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md">{selectedRoom.name} Items</Heading>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={() => {
                    setNewItem({});
                    onOpen();
                  }}
                >
                  Add Item
                </Button>
              </Flex>

              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                {selectedRoom.items.map(item => (
                  <Card key={item.id} p={4} bg={bgColor} borderColor={borderColor}>
                    <Stack spacing={2}>
                      <Flex justify="space-between" align="center">
                        <Heading size="sm">{item.name}</Heading>
                        <IconButton
                          aria-label="Delete item"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteItem(selectedRoom.id, item.id)}
                        />
                      </Flex>
                      <Text color="gray.500">{item.description}</Text>
                      <Flex justify="space-between" align="center">
                        <Badge colorScheme="blue">{item.category}</Badge>
                        <Text fontWeight="bold">
                          ${item.estimatedValue.toLocaleString()}
                        </Text>
                      </Flex>
                    </Stack>
                  </Card>
                ))}
              </Grid>
            </Stack>
          ) : (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">Select a room to view and manage items</Text>
            </Box>
          )}
        </Box>
      </Grid>

      {/* Add Item Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Item</ModalHeader>
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Item Name</FormLabel>
                <Input
                  value={newItem.name || ''}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input
                  value={newItem.description || ''}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  value={newItem.category || ''}
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Estimated Value ($)</FormLabel>
                <Input
                  type="number"
                  value={newItem.estimatedValue || ''}
                  onChange={e => setNewItem({ ...newItem, estimatedValue: Number(e.target.value) })}
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleAddItem}>
              Add Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Inventory; 