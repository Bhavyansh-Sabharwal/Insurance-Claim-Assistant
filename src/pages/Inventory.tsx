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
  writeBatch,
} from 'firebase/firestore';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
  DragEndEvent,
  DragOverEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../components/SortableItem';
import SortableHandle from '../components/SortableHandle';
import { useLocalization } from '../hooks/useLocalization';
import { Language } from '../contexts/PreferencesContext';

type TranslationKey = keyof typeof import('../i18n/translations').translations[Language];

// Types
type Item = {
  id: string;
  name: string;
  description: string;
  estimatedValue: number;
  room: string;
  category: TranslationKey;
};

type Room = {
  id: string;
  name: TranslationKey;
  items: Item[];
  userId: string;
  orderIndex: number;
};

// Constants
const categories: TranslationKey[] = [
  'inventory.categories.furniture',
  'inventory.categories.electronics',
  'inventory.categories.appliances',
  'inventory.categories.clothing',
  'inventory.categories.decor',
  'inventory.categories.other',
];

const defaultRooms: TranslationKey[] = [
  'common.livingRoom',
  'common.kitchen',
  'common.masterBedroom',
  'common.bathroom',
];

const createDefaultRooms = (userId: string): Room[] => 
  defaultRooms.map((name, index) => ({
    id: (index + 1).toString(),
    name,
    items: [],
    userId,
    orderIndex: index,
  }));

// Helper Functions
const updateFirestore = async (path: string, data: any) => {
  const docRef = doc(db, path);
  await updateDoc(docRef, data);
};

// Components
const ItemCard = ({ 
  item, 
  isEditing, 
  editData, 
  onEdit, 
  onDelete, 
  onEditSubmit, 
  onEditCancel,
  isOver
}: { 
  item: Item;
  isEditing: boolean;
  editData: Partial<Item>;
  onEdit: () => void;
  onDelete: () => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  isOver: boolean;
}) => {
  const { t } = useLocalization();
  const bgColor = useColorModeValue('white', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.600');

  return (
    <Card 
      p={4} 
      bg={isOver ? hoverBgColor : bgColor}
      boxShadow="none" 
      transition="background-color 0.2s ease"
    >
      <Stack spacing={2}>
        {isEditing ? (
          <EditItemForm
            item={item}
            editData={editData}
            onSubmit={onEditSubmit}
            onCancel={onEditCancel}
          />
        ) : (
          <Flex align="top" gap={2}>
            <SortableHandle />
            <Box flex={1}>
              <ItemDisplay
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </Box>
          </Flex>
        )}
      </Stack>
    </Card>
  );
};

const EditItemForm = ({ 
  item, 
  editData, 
  onSubmit, 
  onCancel 
}: {
  item: Item;
  editData: Partial<Item>;
  onSubmit: () => void;
  onCancel: () => void;
}) => {
  const { t } = useLocalization();
  return (
    <Stack spacing={2} width="100%">
      <Input
        value={editData.name || item.name}
        onChange={(e) => editData.name = e.target.value}
        placeholder={t('inventory.itemName')}
      />
      <Input
        value={editData.description || item.description}
        onChange={(e) => editData.description = e.target.value}
        placeholder={t('inventory.description')}
      />
      <Select
        value={editData.category || item.category}
        onChange={(e) => editData.category = e.target.value as TranslationKey}
      >
        {categories.map(category => (
          <option key={category} value={category}>
            {t(category)}
          </option>
        ))}
      </Select>
      <Input
        type="number"
        value={editData.estimatedValue || item.estimatedValue}
        onChange={(e) => editData.estimatedValue = Number(e.target.value)}
        placeholder={t('inventory.estimatedValue')}
      />
      <Flex gap={2} justify="flex-end">
        <Button size="sm" onClick={onCancel}>{t('button.cancel')}</Button>
        <Button size="sm" colorScheme="blue" onClick={onSubmit}>{t('button.save')}</Button>
      </Flex>
    </Stack>
  );
};

const ItemDisplay = ({ 
  item, 
  onEdit, 
  onDelete 
}: {
  item: Item;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { t, formatCurrency } = useLocalization();
  return (
    <>
      <Flex justify="space-between" align="center">
        <Heading size="sm" flex={1}>{item.name}</Heading>
        <Flex gap={2}>
          <IconButton
            aria-label={t('button.edit')}
            icon={<EditIcon />}
            size="sm"
            variant="ghost"
            colorScheme="blue"
            onClick={onEdit}
          />
          <IconButton
            aria-label={t('button.delete')}
            icon={<DeleteIcon />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={onDelete}
          />
        </Flex>
      </Flex>
      <Text color="gray.500">{item.description}</Text>
      <Flex justify="space-between" align="center">
        <Badge colorScheme="blue">{t(item.category)}</Badge>
        <Text fontWeight="bold">
          {formatCurrency(item.estimatedValue)}
        </Text>
      </Flex>
    </>
  );
};

const AddItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  newItem,
  setNewItem,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  newItem: Partial<Item>;
  setNewItem: (item: Partial<Item>) => void;
}) => {
  const { t } = useLocalization();
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('inventory.addItem')}</ModalHeader>
        <ModalBody>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>{t('inventory.itemName')}</FormLabel>
              <Input
                value={newItem.name || ''}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t('inventory.description')}</FormLabel>
              <Input
                value={newItem.description || ''}
                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t('inventory.category')}</FormLabel>
              <Select
                value={newItem.category || categories[0]}
                onChange={e => setNewItem({ ...newItem, category: e.target.value as TranslationKey })}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {t(category)}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>{t('inventory.estimatedValue')}</FormLabel>
              <Input
                type="number"
                value={newItem.estimatedValue || ''}
                onChange={e => setNewItem({ ...newItem, estimatedValue: Number(e.target.value) })}
              />
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>{t('button.cancel')}</Button>
          <Button colorScheme="blue" onClick={onSubmit}>{t('button.save')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Main Component
const Inventory = () => {
  const { currentUser } = useAuth();
  const { t, formatCurrency } = useLocalization();
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
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const fetchInventory = async () => {
      if (!currentUser) return;
      try {
        const q = query(collection(db, 'rooms'), where('userId', '==', currentUser.uid));
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
            .map(doc => ({ ...doc.data(), id: doc.id })) as Room[];
          setRooms(fetchedRooms.sort((a, b) => a.orderIndex - b.orderIndex));
        }
      } catch (error) {
        console.error('Fetch error:', error);
        toast({ title: 'Error fetching inventory', status: 'error', duration: 5000 });
      }
    };

    fetchInventory();
  }, [currentUser]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setHoveredItemId(null);

    try {
      if (active.id.toString().startsWith('room-')) {
        const oldIndex = rooms.findIndex(room => `room-${room.id}` === active.id);
        const newIndex = rooms.findIndex(room => `room-${room.id}` === over.id);
        
        const newRooms = arrayMove(rooms, oldIndex, newIndex)
          .map((room, index) => ({ ...room, orderIndex: index }));
        
        setRooms(newRooms);

        const batch = writeBatch(db);
        newRooms.forEach(room => {
          batch.update(doc(db, 'rooms', room.id), { orderIndex: room.orderIndex });
        });
        await batch.commit();
      }
      else if (selectedRoom) {
        const oldIndex = selectedRoom.items.findIndex(item => item.id === active.id);
        const newIndex = selectedRoom.items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(selectedRoom.items, oldIndex, newIndex);
        await updateFirestore(`rooms/${selectedRoom.id}`, { items: newItems });
        
        setRooms(rooms.map(room =>
          room.id === selectedRoom.id ? { ...room, items: newItems } : room
        ));
        setSelectedRoom({ ...selectedRoom, items: newItems });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast({ title: 'Error updating order', status: 'error', duration: 5000 });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setHoveredItemId(over.id as string);
    }
  };

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
      await updateFirestore(`rooms/${selectedRoom.id}`, { items: updatedItems });

      setRooms(rooms.map(room =>
        room.id === selectedRoom.id ? { ...room, items: updatedItems } : room
      ));
      setSelectedRoom({ ...selectedRoom, items: updatedItems });
      setNewItem({ category: categories[0] });
      onClose();
      toast({ title: 'Item added', status: 'success', duration: 2000 });
    } catch (error) {
      toast({ title: 'Error adding item', status: 'error', duration: 5000 });
    }
  };

  const handleAddRoom = async () => {
    if (!currentUser) return;

    try {
      const roomRef = doc(collection(db, 'rooms'));
      const newRoomName = `custom.${t('inventory.newRoom')} ${rooms.length + 1}` as TranslationKey;
      const newRoom: Room = {
        id: roomRef.id,
        name: newRoomName,
        items: [],
        userId: currentUser.uid,
        orderIndex: rooms.length,
      };

      await setDoc(roomRef, newRoom);
      setRooms([...rooms, newRoom]);
      toast({ title: t('inventory.addRoom'), status: 'success', duration: 2000 });
    } catch (error) {
      toast({ title: 'Error', description: t('error.addRoomFailed'), status: 'error', duration: 5000 });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    if (room.items.length > 0 && !window.confirm(t('inventory.deleteRoomConfirm'))) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      
      const updatedRooms = rooms
        .filter(room => room.id !== roomId)
        .map((room, index) => ({ ...room, orderIndex: index }));
      
      setRooms(updatedRooms);
      if (selectedRoom?.id === roomId) setSelectedRoom(null);

      const batch = writeBatch(db);
      updatedRooms.forEach(room => {
        batch.update(doc(db, 'rooms', room.id), { orderIndex: room.orderIndex });
      });
      await batch.commit();

      toast({ title: 'Room deleted', status: 'success', duration: 2000 });
    } catch (error) {
      toast({ title: 'Error deleting room', status: 'error', duration: 5000 });
    }
  };

  const handleEditRoomName = async (roomId: string, newName: string) => {
    if (!newName.trim()) return;

    const updatedRooms = rooms.map(room =>
      room.id === roomId ? { ...room, name: `custom.${newName}` as TranslationKey } : room
    );

    try {
      await updateFirestore(`rooms/${roomId}`, { name: `custom.${newName}` });
      setRooms(updatedRooms);
      setIsEditingRoom(null);
      setEditRoomName('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update room name',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd} 
      onDragOver={handleDragOver}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <Container maxW="container.xl" py={8} style={{ overflow: 'hidden' }}>
        <Grid templateColumns={{ base: '1fr', md: '250px 1fr' }} gap={8}>
          {/* Rooms Sidebar */}
          <Stack spacing={4}>
            <Flex justify="space-between" align="center">
              <Heading size="md">{t('inventory.rooms')}</Heading>
              <IconButton
                aria-label={t('inventory.addRoom')}
                icon={<AddIcon />}
                size="sm"
                colorScheme="blue"
                onClick={handleAddRoom}
              />
            </Flex>
            <SortableContext items={rooms.map(room => `room-${room.id}`)} strategy={verticalListSortingStrategy}>
              <Stack spacing={2}>
                {rooms.map((room) => (
                  <SortableItem key={`room-${room.id}`} id={`room-${room.id}`}>
                    <Box
                      bg={bgColor}
                      p={2}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <Flex align="center" gap={2}>
                        <SortableHandle />
                        {isEditingRoom === room.id ? (
                          <Input
                            value={editRoomName}
                            onChange={(e) => setEditRoomName(e.target.value)}
                            onBlur={() => {
                              if (editRoomName.trim()) {
                                handleEditRoomName(room.id, editRoomName);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (editRoomName.trim()) {
                                  handleEditRoomName(room.id, editRoomName);
                                }
                              } else if (e.key === ' ') {
                                e.stopPropagation();
                              }
                            }}
                            autoFocus
                            size="sm"
                          />
                        ) : (
                          <Flex flex={1} gap={2}>
                            <Button
                              variant={selectedRoom?.id === room.id ? 'solid' : 'outline'}
                              colorScheme={selectedRoom?.id === room.id ? 'blue' : 'gray'}
                              flex={1}
                              size="sm"
                              onClick={() => setSelectedRoom(room)}
                              onDoubleClick={() => {
                                setIsEditingRoom(room.id);
                                setEditRoomName(room.name.startsWith('custom.') ? room.name.slice(7) : t(room.name));
                              }}
                            >
                              {room.name.startsWith('custom.') ? room.name.slice(7) : t(room.name)}
                              <Badge ml={2}>{room.items.length}</Badge>
                            </Button>
                            <IconButton
                              aria-label={t('button.delete')}
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteRoom(room.id)}
                            />
                          </Flex>
                        )}
                      </Flex>
                    </Box>
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
                  <Heading size="md">
                    {selectedRoom && (selectedRoom.name.startsWith('custom.') ? 
                      selectedRoom.name.slice(7) : 
                      t(selectedRoom.name))} {t('inventory.items')}
                  </Heading>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={() => {
                      setNewItem({ category: categories[0] });
                      onOpen();
                    }}
                  >
                    {t('inventory.addItem')}
                  </Button>
                </Flex>
                <SortableContext items={selectedRoom.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    {selectedRoom.items.map((item) => (
                      <SortableItem key={item.id} id={item.id}>
                        <ItemCard
                          item={item}
                          isEditing={editingItem === item.id}
                          editData={editItemData}
                          onEdit={() => {
                            setEditingItem(item.id);
                            setEditItemData(item);
                          }}
                          onDelete={() => {
                            const updatedItems = selectedRoom.items.filter(i => i.id !== item.id);
                            updateFirestore(`rooms/${selectedRoom.id}`, { items: updatedItems })
                              .then(() => {
                                setRooms(rooms.map(r =>
                                  r.id === selectedRoom.id ? { ...r, items: updatedItems } : r
                                ));
                                setSelectedRoom({ ...selectedRoom, items: updatedItems });
                                toast({ title: 'Item deleted', status: 'success', duration: 2000 });
                              })
                              .catch(() => toast({ title: 'Error deleting item', status: 'error', duration: 5000 }));
                          }}
                          onEditSubmit={() => {
                            if (!editItemData.name) return;
                            const updatedItems = selectedRoom.items.map(i =>
                              i.id === item.id ? { ...i, ...editItemData } : i
                            );
                            updateFirestore(`rooms/${selectedRoom.id}`, { items: updatedItems })
                              .then(() => {
                                setRooms(rooms.map(r =>
                                  r.id === selectedRoom.id ? { ...r, items: updatedItems } : r
                                ));
                                setSelectedRoom({ ...selectedRoom, items: updatedItems });
                                setEditingItem(null);
                                setEditItemData({});
                                toast({ title: 'Item updated', status: 'success', duration: 2000 });
                              })
                              .catch(() => toast({ title: 'Error updating item', status: 'error', duration: 5000 }));
                          }}
                          onEditCancel={() => {
                            setEditingItem(null);
                            setEditItemData({});
                          }}
                          isOver={hoveredItemId === item.id}
                        />
                      </SortableItem>
                    ))}
                  </Grid>
                </SortableContext>
              </Stack>
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">{t('inventory.selectRoom')}</Text>
              </Box>
            )}
          </Box>
        </Grid>

        <AddItemModal
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={handleAddItem}
          newItem={newItem}
          setNewItem={setNewItem}
        />
      </Container>
    </DndContext>
  );
};

export default Inventory; 