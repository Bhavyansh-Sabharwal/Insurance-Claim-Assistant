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
  VStack
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
// import { useLocalization } from '../hooks/useLocalization';
import { DetectedObject } from '../services/imageService';

interface DetectedObjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedObjects: DetectedObject[];
}

export const DetectedObjectsModal: React.FC<DetectedObjectsModalProps> = ({
  isOpen,
  onClose,
  detectedObjects
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // const { formatCurrency } = useLocalization();

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? detectedObjects.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === detectedObjects.length - 1 ? 0 : prev + 1));
  };

  // Handle keyboard navigation
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
            <Badge colorScheme="blue">
              {currentIndex + 1} of {detectedObjects.length}
            </Badge>
          </Flex>
        </ModalHeader>
        <ModalBody>
          <Flex justify="center" align="center" position="relative" minH="400px">
            <IconButton
              aria-label="Previous image"
              icon={<ChevronLeftIcon boxSize={8} />}
              position="absolute"
              left={2}
              onClick={handlePrevious}
              zIndex={2}
              variant="ghost"
              size="lg"
              isRound
              _hover={{ bg: 'blackAlpha.300' }}
            />
            <Box width="100%" height="400px" position="relative">
              <Image
                src={detectedObjects[currentIndex].imageUrl}
                alt={detectedObjects[currentIndex].label}
                objectFit="contain"
                width="100%"
                height="100%"
              />
              <VStack spacing={2} mt={4} align="start" width="100%">
                <Text fontSize="lg" fontWeight="bold">
                  {detectedObjects[currentIndex].name}
                </Text>
                <Text fontSize="lg" color="gray.600">
                  {detectedObjects[currentIndex].description}
                </Text>
                <Text fontSize="lg" color="green.600" fontWeight="semibold">
                  Estimated Value: {detectedObjects[currentIndex].price}
                </Text>
              </VStack>
            </Box>
            <IconButton
              aria-label="Next image"
              icon={<ChevronRightIcon boxSize={8} />}
              position="absolute"
              right={2}
              onClick={handleNext}
              zIndex={2}
              variant="ghost"
              size="lg"
              isRound
              _hover={{ bg: 'blackAlpha.300' }}
            />
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
