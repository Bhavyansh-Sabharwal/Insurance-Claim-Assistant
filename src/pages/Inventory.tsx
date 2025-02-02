import { useState, useEffect } from 'react';
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
  useToast,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../components/SortableItem';
import SortableHandle from '../components/SortableHandle';
import type { DragEndEvent } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { DraggableAttributes } from '@dnd-kit/core';

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
  userId: string;
  orderIndex: number;
};

const createDefaultRooms = (userId: string): Room[] => [
  { id: '1', name: 'Living Room', items: [], userId, orderIndex: 0 },
  { id: '2', name: 'Kitchen', items: [], userId, orderIndex: 1 },
  { id: '3', name: 'Bedroom', items: [], userId, orderIndex: 2 },
  { id: '4', name: 'Bathroom', items: [], userId, orderIndex: 3 },
];

const categories = [
  'Furniture',
  'Electronics',
  'Appliances',
  'Clothing',
  'Decor',
  'Other',
];

// Combine common sensor configuration
const createSensors = () => useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }
  }),
  useSensor(KeyboardSensor)
);

// Extract common toast configuration
const showToast = (toast: any, title: string, status: 'success' | 'error') => {
  toast({
    title,
    status,
    duration: status === 'success' ? 2000 : 5000,
    isClosable: true,
  });
};

// Extract common room update logic
const updateRoomInFirestore = async (roomId: string, data: Partial<Room>) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, data);
};

// Extract common room state update logic
const updateRoomState = (rooms: Room[], roomId: string, updater: (room: Room) => Room) => {
  return rooms.map(room => room.id === roomId ? updater(room) : room);
};

const ItemsList = ({ 
  selectedRoom, 
  onItemsChange,
  onEditItem,
  onDeleteItem,
  editingItem,
  editItemData,
  setEditingItem,
  setEditItemData 
}: { 
  selectedRoom: Room;
  onItemsChange: (items: Item[]) => void;
  onEditItem: (roomId: string, itemId: string) => void;
  onDeleteItem: (roomId: string, itemId: string) => void;
  editingItem: string | null;
  editItemData: Partial<Item>;
  setEditingItem: (id: string | null) => void;
  setEditItemData: (data: Partial<Item>) => void;
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const sensors = createSensors();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedRoom.items.findIndex(item => item.id === active.id);
    const newIndex = selectedRoom.items.findIndex(item => item.id === over.id);
    onItemsChange(arrayMove(selectedRoom.items, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={selectedRoom.items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
          {selectedRoom.items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {(provided) => (
                <Card
                  p={4}
                  bg={bgColor}
                  borderColor={borderColor}
                  boxShadow="none"
                >
                  <Stack spacing={2}>
                    {editingItem === item.id ? (
                      <Stack spacing={2} width="100%">
                        <Input
                          value={editItemData.name || item.name}
                          onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
                          placeholder="Item name"
                        />
                        <Input
                          value={editItemData.description || item.description}
                          onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
                          placeholder="Description"
                        />
                        <Select
                          value={editItemData.category || item.category}
                          onChange={(e) => setEditItemData({ ...editItemData, category: e.target.value })}
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Select>
                        <Input
                          type="number"
                          value={editItemData.estimatedValue || item.estimatedValue}
                          onChange={(e) => setEditItemData({ ...editItemData, estimatedValue: Number(e.target.value) })}
                          placeholder="Estimated value"
                        />
                        <Flex gap={2} justify="flex-end">
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingItem(null);
                              setEditItemData({});
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => onEditItem(selectedRoom.id, item.id)}
                          >
                            Save
                          </Button>
                        </Flex>
                      </Stack>
                    ) : (
                      <>
                        <Flex justify="space-between" align="center">
                          <SortableHandle {...provided.listeners} {...provided.attributes} />
                          <Heading size="sm" flex={1} ml={2}>{item.name}</Heading>
                          <Flex gap={2}>
                            <IconButton
                              aria-label="Edit item"
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => {
                                setEditingItem(item.id);
                                setEditItemData(item);
                              }}
                            />
                            <IconButton
                              aria-label="Delete item"
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => onDeleteItem(selectedRoom.id, item.id)}
                            />
                          </Flex>
                        </Flex>
                        <Text color="gray.500">{item.description}</Text>
                        <Flex justify="space-between" align="center">
                          <Badge colorScheme="blue">{item.category}</Badge>
                          <Text fontWeight="bold">
                            ${item.estimatedValue.toLocaleString()}
                          </Text>
                        </Flex>
                      </>
                    )}
                  </Stack>
                </Card>
              )}
            </SortableItem>
          ))}
        </Grid>
      </SortableContext>
    </DndContext>
  );
};

const Inventory = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newItem, setNewItem] = useState<Partial<Item>>({ category: categories[0] });
  const [isEditingRoom, setIsEditingRoom] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<Partial<Item>>({});

  const sensors = createSensors();

  useEffect(() => {
    const fetchInventory = async () => {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, 'rooms'),
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          const defaultRooms = createDefaultRooms(currentUser.uid);
          const createdRooms: Room[] = [];

          for (const room of defaultRooms) {
            const roomRef = doc(collection(db, 'rooms'));
            const roomWithId = { ...room, id: roomRef.id };
            await setDoc(roomRef, roomWithId);
            createdRooms.push(roomWithId);
          }
          
          setRooms(createdRooms);
        } else {
          const fetchedRooms = querySnapshot.docs
            .map(doc => ({
              ...doc.data(),
              id: doc.id,
            })) as Room[];
          setRooms(fetchedRooms.sort((a, b) => a.orderIndex - b.orderIndex));
        }
      } catch (error) {
        console.error('Fetch error:', error);
        showToast(toast, 'Error fetching inventory', 'error');
      }
    };

    fetchInventory();
  }, [currentUser]);

  const handleAddItem = async () => {
    if (!selectedRoom || !newItem.name || !currentUser) return;

    try {
      const item: Item = {
        id: Date.now().toString(),
        name: newItem.name,
        description: newItem.description || '',
        estimatedValue: Number(newItem.estimatedValue) || 0,
        room: selectedRoom.id,
        category: newItem.category || categories[0],
      };

      const updatedItems = [...selectedRoom.items, item];
      await updateRoomInFirestore(selectedRoom.id, { items: updatedItems });

      const updatedRooms = updateRoomState(rooms, selectedRoom.id, room => ({
        ...room,
        items: updatedItems
      }));
      
      setRooms(updatedRooms);
      setSelectedRoom(updatedRooms.find(room => room.id === selectedRoom.id) || null);
      setNewItem({ category: categories[0] });
      onClose();
      showToast(toast, 'Item added', 'success');
    } catch (error) {
      showToast(toast, 'Error adding item', 'error');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = rooms.findIndex(room => room.id === active.id);
      const newIndex = rooms.findIndex(room => room.id === over?.id);
      const newRooms = arrayMove(rooms, oldIndex, newIndex);

      // Update orderIndex
      const updatedRooms = newRooms.map((room, index) => ({
        ...room,
        orderIndex: index
      }));

      setRooms(updatedRooms);

      // Update Firestore
      try {
        const batch = writeBatch(db);
        updatedRooms.forEach(room => {
          const roomRef = doc(db, 'rooms', room.id);
          batch.update(roomRef, { orderIndex: room.orderIndex });
        });
        await batch.commit();
      } catch (error) {
        console.error('Error updating room order:', error);
        showToast(toast, 'Error updating room order', 'error');
      }
    }
  };

  const handleAddRoom = async () => {
    if (!currentUser) return;

    try {
      const roomRef = doc(collection(db, 'rooms'));
      const newRoom: Room = {
        id: roomRef.id,
        name: `New Room ${rooms.length + 1}`,
        items: [],
        userId: currentUser.uid,
        orderIndex: rooms.length,
      };

      await setDoc(roomRef, newRoom);
      setRooms([...rooms, newRoom]);

      showToast(toast, 'Room added', 'success');
    } catch (error) {
      console.error('Error adding room:', error);
      showToast(toast, 'Error adding room', 'error');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    if (room.items.length > 0) {
      if (!window.confirm('Are you sure you want to delete this room and all its items?')) {
        return;
      }
    }

    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      
      const updatedRooms = rooms.filter(room => room.id !== roomId)
        .map((room, index) => ({
          ...room,
          orderIndex: index
        }));
      
      setRooms(updatedRooms);
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
      }

      // Update orderIndex for remaining rooms
      await Promise.all(
        updatedRooms.map(room =>
          updateDoc(doc(db, 'rooms', room.id), {
            orderIndex: room.orderIndex
          })
        )
      );

      showToast(toast, 'Room deleted', 'success');
    } catch (error) {
      console.error('Error deleting room:', error);
      showToast(toast, 'Error deleting room', 'error');
    }
  };

  const handleRoomNameEdit = async (roomId: string) => {
    if (!editRoomName.trim()) return;

    try {
      await updateRoomInFirestore(roomId, {
        name: editRoomName
      });

      setRooms(rooms.map(room =>
        room.id === roomId
          ? { ...room, name: editRoomName }
          : room
      ));

      setIsEditingRoom(null);
      setEditRoomName('');

      showToast(toast, 'Room updated', 'success');
    } catch (error) {
      showToast(toast, 'Error updating room', 'error');
    }
  };

  const handleDeleteItem = async (roomId: string, itemId: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      const updatedItems = room.items.filter(item => item.id !== itemId);
      await updateRoomInFirestore(roomId, { items: updatedItems });

      const updatedRooms = rooms.map(r =>
        r.id === roomId ? { ...r, items: updatedItems } : r
      );
      
      setRooms(updatedRooms);
      setSelectedRoom(updatedRooms.find(r => r.id === roomId) || null);
      
      showToast(toast, 'Item deleted', 'success');
    } catch (error) {
      showToast(toast, 'Error deleting item', 'error');
    }
  };

  const handleEditItem = async (roomId: string, itemId: string) => {
    if (!editItemData.name) return;

    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      const updatedItems = room.items.map(item =>
        item.id === itemId
          ? { ...item, ...editItemData }
          : item
      );

      await updateRoomInFirestore(roomId, {
        items: updatedItems
      });

      const updatedRooms = rooms.map(r =>
        r.id === roomId
          ? { ...r, items: updatedItems }
          : r
      );
      
      setRooms(updatedRooms);
      setSelectedRoom(updatedRooms.find(r => r.id === roomId) || null);
      setEditingItem(null);
      setEditItemData({});

      showToast(toast, 'Item updated', 'success');
    } catch (error) {
      showToast(toast, 'Error updating item', 'error');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Container maxW="container.xl" py={8}>
        <Grid templateColumns={{ base: '1fr', md: '250px 1fr' }} gap={8}>
          {/* Rooms Sidebar */}
          <Stack spacing={4}>
            <Flex justify="space-between" align="center">
              <Heading size="md">Rooms</Heading>
              <IconButton
                aria-label="Add room"
                icon={<AddIcon />}
                size="sm"
                colorScheme="blue"
                onClick={handleAddRoom}
              />
            </Flex>
            <SortableContext
              items={rooms.map(room => room.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={2}>
                {rooms.map((room) => (
                  <SortableItem key={room.id} id={room.id}>
                    {(provided: { listeners?: SyntheticListenerMap; attributes: DraggableAttributes }) => (
                      <Box
                        bg={bgColor}
                        p={2}
                        borderRadius="md"
                        border="1px solid"
                        borderColor={borderColor}
                      >
                        <Flex align="center" gap={2}>
                          <SortableHandle {...provided.listeners} {...provided.attributes} />
                          {isEditingRoom === room.id ? (
                            <Input
                              value={editRoomName}
                              onChange={(e) => setEditRoomName(e.target.value)}
                              onBlur={() => handleRoomNameEdit(room.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRoomNameEdit(room.id);
                                } else if (e.key === 'Escape') {
                                  setIsEditingRoom(null);
                                  setEditRoomName('');
                                }
                              }}
                              autoFocus
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <Flex flex={1} gap={2}>
                              <Button
                                variant={selectedRoom?.id === room.id ? 'solid' : 'outline'}
                                colorScheme={selectedRoom?.id === room.id ? 'blue' : 'gray'}
                                flex={1}
                                size="sm"
                                onClick={() => setSelectedRoom(room)}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setIsEditingRoom(room.id);
                                  setEditRoomName(room.name);
                                }}
                              >
                                {room.name}
                                <Badge ml={2}>{room.items.length}</Badge>
                              </Button>
                              <IconButton
                                aria-label="Delete room"
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRoom(room.id);
                                }}
                              />
                            </Flex>
                          )}
                        </Flex>
                      </Box>
                    )}
                  </SortableItem>
                ))}
              </Stack>
            </SortableContext>
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
                      setNewItem({ category: categories[0] });
                      onOpen();
                    }}
                  >
                    Add Item
                  </Button>
                </Flex>
                <ItemsList
                  selectedRoom={selectedRoom}
                  onItemsChange={async (newItems) => {
                    try {
                      await updateRoomInFirestore(selectedRoom.id, { items: newItems });
                      
                      const updatedRooms = rooms.map(room =>
                        room.id === selectedRoom.id
                          ? { ...room, items: newItems }
                          : room
                      );
                      
                      setRooms(updatedRooms);
                      setSelectedRoom({ ...selectedRoom, items: newItems });
                    } catch (error) {
                      console.error('Error updating item order:', error);
                      showToast(toast, 'Error updating item order', 'error');
                    }
                  }}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                  editingItem={editingItem}
                  editItemData={editItemData}
                  setEditingItem={setEditingItem}
                  setEditItemData={setEditItemData}
                />
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
                    value={newItem.category || categories[0]}
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
    </DndContext>
  );
};

export default Inventory; 