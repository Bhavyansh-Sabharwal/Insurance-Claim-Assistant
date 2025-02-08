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
  useColorModeValue
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
  const buttonBgColor = useColorModeValue('blackAlpha.700', 'whiteAlpha.700');
  const buttonIconColor = useColorModeValue('white', 'black');
  // const { formatCurrency } = useLocalization();

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? detectedObjects.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === detectedObjects.length - 1 ? 0 : prev + 1));
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
  const description = currentObject.description || `A ${currentObject.label.toLowerCase()}`;

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
            <Badge colorScheme="blue" bg="blue.100" color="blue.800">
              {currentIndex + 1} OF {detectedObjects.length}
            </Badge>
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
            <Text color="gray.600" mb={4}>
              {description}
            </Text>
            <Text color="green.600" fontSize="md">
              Estimated Value: {currentObject.price}
            </Text>
            <Text color="gray.500" fontSize="sm" mt={2}>
              Confidence Score: {(currentObject.confidence * 100).toFixed(1)}%
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} colorScheme="blue">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
