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
  Badge
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface DetectedObject {
  label: string;
  imageUrl: string;
}

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
                borderRadius="md"
              />
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                p={4}
                bg="blackAlpha.600"
                color="white"
                borderBottomRadius="md"
              >
                <Text fontSize="lg" fontWeight="bold" textAlign="center">
                  {detectedObjects[currentIndex].label}
                </Text>
              </Box>
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