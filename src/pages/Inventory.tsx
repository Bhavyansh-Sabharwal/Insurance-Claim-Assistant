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
  Image,
  Textarea,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, AttachmentIcon, DownloadIcon } from '@chakra-ui/icons';
import { ReceiptIcon } from '../components/Icons'; // Assuming you'll create a custom ReceiptIcon component
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
  getDoc,
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
import { FileUpload } from '../components/FileUpload';
import { ReceiptUpload } from '../components/ReceiptUpload';
import { DetectedObjectsModal } from '../components/DetectedObjectsModal';
import { generatePDF } from '../components/InventoryPDF';
import { SimpleFileUpload } from '../components/SimpleFileUpload';
import { TranslationKey } from '../i18n/translations';
import { Item, Room } from '../types/inventory';

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
const SingleImageUploadModal = ({
  isOpen,
  onClose,
  itemId,
  userId,
  onImageUploaded,
}: {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  userId: string;
  onImageUploaded: (imageUrl: string) => void;
}) => {
  const { t } = useLocalization();

  const handleUploadComplete = (imageUrl: string) => {
    onImageUploaded(imageUrl);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('inventory.uploadImage')}</ModalHeader>
        <ModalBody>
          <SimpleFileUpload
            itemId={itemId}
            userId={userId}
            onUploadComplete={handleUploadComplete}
          />
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>{t('button.close')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface ItemCardProps {
  item: Item;
  isEditing: boolean;
  editData: Partial<Item>;
  onEdit: () => void;
  onDelete: () => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  isOver: boolean;
  onImageAdd: (itemId: string, imageUrl: string) => void;
  onAddReceipt: (itemId: string, result: { text: string; imageUrl: string; analyzed_data?: { name: string; description: string; price: string } }) => void;
}

const ItemCard = ({
  item,
  isEditing,
  editData,
  onEdit,
  onDelete,
  onEditSubmit,
  onEditCancel,
  isOver,
  onImageAdd,
  onAddReceipt
}: ItemCardProps) => {
  const { t } = useLocalization();
  const bgColor = useColorModeValue('white', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.600');
  const { currentUser } = useAuth();
  const { isOpen: isUploadModalOpen, onOpen: onUploadModalOpen, onClose: onUploadModalClose } = useDisclosure();
  const [uploadType, setUploadType] = useState<'image' | 'receipt'>('image');

  const handleUploadClick = (type: 'image' | 'receipt') => {
    setUploadType(type);
    onUploadModalOpen();
  };

  return (
    <Card
      p={4}
      bg={isOver ? hoverBgColor : bgColor}
      boxShadow="md"
      transition="all 0.2s ease"
      _hover={{ boxShadow: 'lg' }}
      minH="140px"
    >
      <Stack spacing={2} height="100%">
        {isEditing ? (
          <EditItemForm
            item={item}
            editData={editData}
            onSubmit={onEditSubmit}
            onCancel={onEditCancel}
          />
        ) : (
          <Flex align="top" gap={2} height="100%">
            <SortableHandle />
            <Box flex={1}>
              <ItemDisplay
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddImage={() => handleUploadClick('image')}
                onAddReceipt={() => handleUploadClick('receipt')}
              />
            </Box>
          </Flex>
        )}
      </Stack>

      {currentUser && (
        <Modal isOpen={isUploadModalOpen} onClose={onUploadModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {uploadType === 'image' ? t('inventory.uploadImage') : t('inventory.addReceipt')}
            </ModalHeader>
            <ModalBody>
              {uploadType === 'image' ? (
                <SimpleFileUpload
                  itemId={item.id}
                  userId={currentUser.uid}
                  onUploadComplete={(imageUrl) => {
                    onImageAdd(item.id, imageUrl);
                    onUploadModalClose();
                  }}
                />
              ) : (
                <ReceiptUpload
                  isOpen={true}
                  onClose={onUploadModalClose}
                  itemId={item.id}
                  userId={currentUser.uid}
                  onUploadComplete={(result) => {
                    onAddReceipt(item.id, result);
                    onUploadModalClose();
                  }}
                />
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onUploadModalClose}>{t('button.close')}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
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
  const [formData, setFormData] = useState({
    name: editData.name || item.name,
    description: editData.description || item.description,
    category: editData.category || item.category,
    estimatedValue: editData.estimatedValue || item.estimatedValue,
    imageUrl: editData.imageUrl || item.imageUrl,
  });

  const handleSubmit = () => {
    if (!formData.name?.trim()) return;
    Object.assign(editData, formData);
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' && formData.name?.trim()) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <Stack
      spacing={2}
      width="100%"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
    >
      <Input
        value={formData.name ?? ''}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder={t('inventory.itemName')}
        autoFocus
      />
      <Input
        value={formData.description ?? ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder={t('inventory.description')}
      />
      <Select
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value as TranslationKey })}
      >
        {categories.map(category => (
          <option key={category} value={category}>
            {t(category)}
          </option>
        ))}
      </Select>
      <Input
        type="number"
        value={formData.estimatedValue ?? ''}
        onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
        placeholder={t('inventory.estimatedValue')}
      />
      <Input
        value={formData.imageUrl ?? ''}
        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
        placeholder={t('inventory.imageUrl')}
      />
      <Flex gap={2} justify="flex-end">
        <Button size="sm" onClick={onCancel}>{t('button.cancel')}</Button>
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleSubmit}
          isDisabled={!formData.name?.trim()}
        >
          {t('button.save')}
        </Button>
      </Flex>
    </Stack>
  );
};

const ItemDisplay = ({
  item,
  onEdit,
  onDelete,
  onAddImage,
  onAddReceipt
}: {
  item: Item;
  onEdit: () => void;
  onDelete: () => void;
  onAddImage: () => void;
  onAddReceipt: () => void;
}) => {
  const { t, formatCurrency } = useLocalization();
  return (
    <Stack height="100%" justify="space-between">
      <Box>
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
        <Text
          color="gray.500"
          minH="24px"
          wordBreak="break-word"
          noOfLines={2}
        >
          {item.description}
        </Text>
      </Box>
      <Stack>
        <Flex justify="space-between" align="center">
          <Badge colorScheme="blue">{t(item.category)}</Badge>
          <Text fontWeight="bold">
            {formatCurrency(item.estimatedValue)}
          </Text>
        </Flex>
        <Stack spacing={2}>
          {item.imageUrl ? (
            <Button
              size="sm"
              leftIcon={<AttachmentIcon />}
              variant="outline"
              colorScheme="blue"
              onClick={() => window.open(item.imageUrl, '_blank')}
            >
              {t('inventory.viewImage')}
            </Button>
          ) : (
            <Button
              size="sm"
              leftIcon={<AddIcon />}
              variant="outline"
              colorScheme="teal"
              onClick={onAddImage}
            >
              {t('inventory.addImage')}
            </Button>
          )}
          {item.receiptUrl ? (
            <Button
              size="sm"
              leftIcon={<ReceiptIcon />}
              variant="outline"
              colorScheme="green"
              onClick={() => window.open(item.receiptUrl, '_blank')}
            >
              {t('inventory.viewReceipt')}
            </Button>
          ) : (
            <Button
              size="sm"
              leftIcon={<ReceiptIcon />}
              variant="outline"
              colorScheme="green"
              onClick={onAddReceipt}
            >
              {t('inventory.addReceipt')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Stack>
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
            <FormControl>
              <FormLabel>{t('inventory.imageUrl')}</FormLabel>
              <Input
                value={newItem.imageUrl || ''}
                onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })}
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
  const {
    isOpen: isImageUploadOpen,
    onOpen: onImageUploadOpen,
    onClose: onImageUploadClose
  } = useDisclosure();
  const {
    isOpen: isReceiptUploadOpen,
    onOpen: onReceiptUploadOpen,
    onClose: onReceiptUploadClose
  } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [uploadType, setUploadType] = useState<'image' | 'receipt'>('image');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newItem, setNewItem] = useState<Partial<Item>>({ category: categories[0] });
  const [isEditingRoom, setIsEditingRoom] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<Partial<Item>>({});
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [showDetectedObjects, setShowDetectedObjects] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<Array<{ label: string; imageUrl: string }>>([]);
  const [showAnalyzedReceipt, setShowAnalyzedReceipt] = useState(false);
  const [analyzedReceiptData, setAnalyzedReceiptData] = useState<{
    name: string;
    description: string;
    price: string;
    imageUrl: string;
  } | null>(null);

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

  const handleDownloadPDF = async () => {
    try {
      if (!currentUser) return;
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const address = userDoc.exists() ? userDoc.data()?.propertyDetails?.address || '' : '';

      const blob = await generatePDF({
        rooms,
        t,
        formatCurrency,
        address,
      });

      // const blob = await generatePDF({
      //   rooms,
      //   t,
      //   formatCurrency,
      // });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t('inventory.pdfDownloaded'),
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: t('error.pdfGenerationFailed'),
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleItemImageAdd = async (itemId: string, imageUrl: string) => {
    if (!selectedRoom) return;

    try {
      const updatedItems = selectedRoom.items.map(item =>
        item.id === itemId ? { ...item, imageUrl } : item
      );

      await updateFirestore(`rooms/${selectedRoom.id}`, { items: updatedItems });

      setRooms(rooms.map(room =>
        room.id === selectedRoom.id ? { ...room, items: updatedItems } : room
      ));
      setSelectedRoom({ ...selectedRoom, items: updatedItems });

      toast({
        title: t('inventory.imageAdded'),
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: t('error.imageAddFailed'),
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleReceiptUpload = (result: { text: string; imageUrl: string; analyzed_data?: { name: string; description: string; price: string } }) => {
    console.log('Receipt Upload Result:', result);
    console.log('Analyzed Data:', result.analyzed_data);

    // Set the analyzed receipt data and show the modal
    setAnalyzedReceiptData({
      name: result.analyzed_data?.name || 'Unknown Item',
      description: result.analyzed_data?.description || result.text || '',
      price: result.analyzed_data?.price || '$0.00',
      imageUrl: result.imageUrl
    });
    console.log('Setting Analyzed Receipt Data:', {
      name: result.analyzed_data?.name || 'Unknown Item',
      description: result.analyzed_data?.description || result.text || '',
      price: result.analyzed_data?.price || '$0.00',
      imageUrl: result.imageUrl
    });
    setShowAnalyzedReceipt(true);
    onImageUploadClose();
  };

  const handleImageUpload = (imageUrl: string) => {
    // Handle general image upload (not tied to a specific item)
    toast({
      title: t('inventory.imageAdded'),
      status: 'success',
      duration: 2000,
    });
    onImageUploadClose();
  };

  const handleUploadClick = () => {
    onImageUploadOpen();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <Container maxW="container.xl" py={0} px={0} style={{ overflow: 'hidden' }}>
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
                                setEditRoomName(room.name.startsWith('custom.') ? room.name.slice(7) : t(room.name as TranslationKey));
                              }}
                            >
{room.name.startsWith('custom.') ? room.name.slice(7) : t(room.name as TranslationKey)}
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
                      t(selectedRoom.name as TranslationKey))} {t('inventory.items')}
                  </Heading>
                  <Flex gap={2}>
                    <Button
                      leftIcon={<AttachmentIcon />}
                      colorScheme="teal"
                      onClick={handleUploadClick}
                    >
                      {t('inventory.addImage')}
                    </Button>
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
                          onImageAdd={handleItemImageAdd}
                          onAddReceipt={(itemId, result) => handleReceiptUpload(result)}
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
            {/* Add PDF download button below the grid */}
            <Flex justify="center" mt={8}>
              <Button
                leftIcon={<DownloadIcon />}
                colorScheme="green"
                onClick={handleDownloadPDF}
                isDisabled={rooms.length === 0}
              >
                {t('inventory.downloadPDF')}
              </Button>
            </Flex>
          </Box>
        </Grid>

        <AddItemModal
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={handleAddItem}
          newItem={newItem}
          setNewItem={setNewItem}
        />

        {/* Add Image Upload Modal */}
        <Modal isOpen={isImageUploadOpen} onClose={onImageUploadClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{uploadType === 'image' ? t('inventory.uploadImage') : t('inventory.addReceipt')}</ModalHeader>
            <ModalBody>
              <Stack spacing={4}>
                <Flex gap={4} mb={4}>
                  <Button
                    flex={1}
                    colorScheme={uploadType === 'image' ? 'blue' : 'gray'}
                    onClick={() => setUploadType('image')}
                  >
                    {t('inventory.addImage')}
                  </Button>
                  <Button
                    flex={1}
                    colorScheme={uploadType === 'receipt' ? 'green' : 'gray'}
                    onClick={() => setUploadType('receipt')}
                  >
                    {t('inventory.addReceipt')}
                  </Button>
                </Flex>

                {currentUser && (
                  <Box>
                    {uploadType === 'image' ? (
                      <FileUpload
                        itemId="general"
                        userId={currentUser.uid}
                        onUploadComplete={(result) => {
                          setDetectedObjects(result.detectedObjects);
                          handleImageUpload(result.imageUrl);
                        }}
                      />
                    ) : (
                      <ReceiptUpload
                        isOpen={true}
                        onClose={onImageUploadClose}
                        itemId={selectedItemId || 'general'}
                        userId={currentUser.uid}
                        onUploadComplete={(result) => handleReceiptUpload(result)}
                      />
                    )}
                  </Box>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onImageUploadClose}>{t('button.close')}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Detected Objects Modal */}
        <DetectedObjectsModal
          isOpen={showDetectedObjects}
          onClose={() => setShowDetectedObjects(false)}
          detectedObjects={detectedObjects as any}
          selectedRoomId={selectedRoom?.id}
          onObjectAdded={(item) => {
            if (selectedRoom) {
              const updatedRooms = rooms.map(room =>
                room.id === selectedRoom.id
                  ? { ...room, items: [...room.items, item] }
                  : room
              );
              setRooms(updatedRooms);
              setSelectedRoom({ ...selectedRoom, items: [...selectedRoom.items, item] });
            }
            // setShowDetectedObjects(false);
          }}
        />

        {/* Analyzed Receipt Modal */}
        <Modal isOpen={showAnalyzedReceipt} onClose={() => setShowAnalyzedReceipt(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t('inventory.addReceipt')}</ModalHeader>
            <ModalBody>
              {analyzedReceiptData && (
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel>{t('inventory.itemName')}</FormLabel>
                    <Input
                      value={analyzedReceiptData.name}
                      isReadOnly
                      bg="gray.50"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>{t('inventory.description')}</FormLabel>
                    <Textarea
                      value={analyzedReceiptData.description}
                      isReadOnly
                      bg="gray.50"
                      minH="100px"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>{t('inventory.estimatedValue')}</FormLabel>
                    <Input
                      value={analyzedReceiptData.price}
                      isReadOnly
                      bg="gray.50"
                    />
                  </FormControl>
                  {analyzedReceiptData.imageUrl && (
                    <Box>
                      <FormLabel>{t('inventory.uploadImage')}</FormLabel>
                      <Image
                        src={analyzedReceiptData.imageUrl}
                        alt="Receipt"
                        maxH="200px"
                        objectFit="contain"
                        mx="auto"
                      />
                    </Box>
                  )}
                </Stack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setShowAnalyzedReceipt(false)}>
                {t('button.cancel')}
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => {
                  if (analyzedReceiptData && selectedRoom) {
                    const newItem: Item = {
                      id: Date.now().toString(),
                      name: analyzedReceiptData.name,
                      description: analyzedReceiptData.description,
                      estimatedValue: parseFloat(analyzedReceiptData.price.replace(/[^0-9.]/g, '')),
                      room: selectedRoom.id,
                      category: 'inventory.categories.electronics',
                      receiptUrl: analyzedReceiptData.imageUrl,
                      receiptText: analyzedReceiptData.description
                    };

                    const updatedItems = [...selectedRoom.items, newItem];
                    updateFirestore(`rooms/${selectedRoom.id}`, { items: updatedItems })
                      .then(() => {
                        setRooms(rooms.map(room =>
                          room.id === selectedRoom.id ? { ...room, items: updatedItems } : room
                        ));
                        setSelectedRoom({ ...selectedRoom, items: updatedItems });
                        setShowAnalyzedReceipt(false);
                        toast({
                          title: t('inventory.itemAdded'),
                          status: 'success',
                          duration: 2000,
                        });
                      })
                      .catch(() => {
                        toast({
                          title: t('error.addItemFailed'),
                          status: 'error',
                          duration: 5000,
                        });
                      });
                  }
                }}
              >
                {t('button.save')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </DndContext>
  );
};

export default Inventory;
