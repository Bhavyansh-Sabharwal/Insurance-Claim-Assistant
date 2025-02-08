import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Image,
  Flex,
  IconButton,
  Text,
  Box,
  Badge,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
// import { useLocalization } from '../hooks/useLocalization';
import { DetectedObject } from '../services/imageService';
import { Item } from '../types/inventory';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DetectedObjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedObjects: DetectedObject[];
  selectedRoomId?: string;
  onObjectAdded?: (item: Item) => void;
}

export const DetectedObjectsModal: React.FC<DetectedObjectsModalProps> = ({
  isOpen,
  onClose,
  detectedObjects,
  selectedRoomId,
  onObjectAdded
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedObjects, setSavedObjects] = useState<Set<number>>(new Set());
  const buttonBgColor = useColorModeValue('blackAlpha.700', 'whiteAlpha.700');
  const buttonIconColor = useColorModeValue('white', 'black');
  const toast = useToast();
  // const { formatCurrency } = useLocalization();

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? detectedObjects.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === detectedObjects.length - 1 ? 0 : prev + 1));
  };

  const moveToNextUnsavedObject = () => {
    let nextIndex = (currentIndex + 1) % detectedObjects.length;
    while (savedObjects.has(nextIndex) && nextIndex !== currentIndex) {
      nextIndex = (nextIndex + 1) % detectedObjects.length;
    }
    setCurrentIndex(nextIndex);
  };

  const handleSkip = () => {
    if (remainingObjects > 0) {
      moveToNextUnsavedObject();
    } else {
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      handleNext();
    } else if (event.key === 'Escape') {
      onClose();
    }
  };
  // console.log(detectedObjects.map(obj => obj));
  if (!detectedObjects.length) return null;

  const currentObject = detectedObjects[currentIndex];
  const fallbackDescription = `A ${currentObject.label.toLowerCase()}`;
  const remainingObjects = detectedObjects.length - savedObjects.size;

  const handleAddToInventory = async () => {
    if (!selectedRoomId) {
      toast({
        title: 'Error',
        description: 'Please select a room first',
        status: 'error',
        duration: 3000
      });
      return;
    }

    const newItem: Item = {
      id: Date.now().toString(),
      name: currentObject.name || currentObject.label,
      description: currentObject.description || `A ${currentObject.label.toLowerCase()}`,
      estimatedValue: parseFloat(currentObject.price?.replace(/[^0-9.]/g, '') || '0'),
      room: selectedRoomId,
      category: 'inventory.categories.other'
    };

    try {
      const roomRef = doc(db, 'rooms', selectedRoomId);
      const roomSnapshot = await getDoc(roomRef);
      const currentItems = roomSnapshot.data()?.items || [];
      
      await updateDoc(roomRef, {
        items: [...currentItems, newItem]
      });

      onObjectAdded?.(newItem);
      
      // Add current index to saved objects
      const newSavedObjects = new Set(savedObjects);
      newSavedObjects.add(currentIndex);
      setSavedObjects(newSavedObjects);

      toast({
        title: 'Success',
        description: 'Item added to inventory',
        status: 'success',
        duration: 2000
      });

      // Move to next unsaved object if there are any remaining
      if (newSavedObjects.size < detectedObjects.length) {
        moveToNextUnsavedObject();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item to inventory',
        status: 'error',
        duration: 3000
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      isCentered
    >
      <ModalOverlay />
      <ModalContent onKeyDown={handleKeyDown}>
        <ModalHeader>
          <Flex justify="space-between" align="center">
            <Text>Detected Objects</Text>
            <Flex gap={2} align="center">
              <Text fontSize="sm" color="gray.500">
                {remainingObjects} object{remainingObjects !== 1 ? 's' : ''} remaining
              </Text>
              <Badge colorScheme="blue" bg="blue.100" color="blue.800">
                {currentIndex + 1} OF {detectedObjects.length}
              </Badge>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalBody p={0} position="relative">
          <Box 
            position="relative" 
            width="100%" 
            paddingTop="75%" // 4:3 aspect ratio
            bg="gray.50"
          >
            <Flex
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              align="center"
              justify="center"
            >
              <Image
                src={currentObject.imageUrl}
                alt={currentObject.label}
                objectFit="contain"
                w="100%"
                h="100%"
                p={4}
              />
            </Flex>
            <IconButton
              aria-label="Previous image"
              icon={<ChevronLeftIcon boxSize={6} color={buttonIconColor} />}
              position="absolute"
              left={4}
              top="50%"
              transform="translateY(-50%)"
              onClick={handlePrevious}
              zIndex={2}
              size="md"
              isRound
              bg={buttonBgColor}
              _hover={{ bg: buttonBgColor, transform: 'scale(1.1)' }}
              transition="transform 0.2s"
            />
            <IconButton
              aria-label="Next image"
              icon={<ChevronRightIcon boxSize={6} color={buttonIconColor} />}
              position="absolute"
              right={4}
              top="50%"
              transform="translateY(-50%)"
              onClick={handleNext}
              zIndex={2}
              size="md"
              isRound
              bg={buttonBgColor}
              _hover={{ bg: buttonBgColor, transform: 'scale(1.1)' }}
              transition="transform 0.2s"
            />
          </Box>
          <Box p={6}>
            <Text fontSize="2xl" fontWeight="semibold" mb={2}>
              {currentObject.name}
            </Text>
            <Text color="gray.600" mb={4} lineHeight="tall">
              {currentObject.description || fallbackDescription}
            </Text>
            <Text color="green.600" fontSize="md">
              Estimated Value: {currentObject.price || 'Not available'}
            </Text>
            <Text color="gray.500" fontSize="sm" mt={2}>
              Confidence Score: {(currentObject.confidence * 100).toFixed(1)}%
            </Text>
            {savedObjects.has(currentIndex) && (
              <Badge colorScheme="green" mt={2}>
                Added to Inventory
              </Badge>
            )}
          </Box>
        </ModalBody>
        <ModalFooter>
          <Flex gap={2}>
            <Button 
              colorScheme="blue"
              onClick={handleAddToInventory}
              isDisabled={!selectedRoomId || savedObjects.has(currentIndex)}
            >
              {savedObjects.has(currentIndex) ? 'Already Added' : 'Add to Inventory'}
            </Button>
            <Button onClick={handleSkip}>
              {remainingObjects === 0 ? 'Done' : 'Skip'}
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
