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
  VStack,
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
  const arrowBgColor = useColorModeValue('blackAlpha.700', 'whiteAlpha.700');
  const arrowHoverColor = useColorModeValue('blackAlpha.800', 'whiteAlpha.800');
  const arrowIconColor = useColorModeValue('white', 'black');
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

  const currentObject = detectedObjects[currentIndex];
  console.log("Current object in modal:", currentObject);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      isCentered
    >
      <ModalOverlay />
      <ModalContent onKeyDown={handleKeyDown} maxH="90vh">
        <ModalHeader>
          <Flex justify="space-between" align="center">
            <Text fontSize="2xl" fontWeight="bold">Detected Objects</Text>
            <Badge colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="full">
              {currentIndex + 1} of {detectedObjects.length}
            </Badge>
          </Flex>
        </ModalHeader>
        <ModalBody>
          <Flex direction="column" gap={6}>
            <Flex justify="center" align="center" position="relative" minH="500px">
              <IconButton
                aria-label="Previous image"
                icon={<ChevronLeftIcon boxSize={8} color={arrowIconColor} />}
                position="absolute"
                left={4}
                onClick={handlePrevious}
                zIndex={2}
                size="lg"
                isRound
                bg={arrowBgColor}
                _hover={{ bg: arrowHoverColor, transform: 'scale(1.1)' }}
                transition="all 0.2s"
                boxShadow="lg"
              />
              <Box width="100%" height="500px" position="relative">
                <Image
                  src={currentObject.imageUrl}
                  alt={currentObject.label}
                  objectFit="contain"
                  width="100%"
                  height="100%"
                  borderRadius="md"
                />
              </Box>
              <IconButton
                aria-label="Next image"
                icon={<ChevronRightIcon boxSize={8} color={arrowIconColor} />}
                position="absolute"
                right={4}
                onClick={handleNext}
                zIndex={2}
                size="lg"
                isRound
                bg={arrowBgColor}
                _hover={{ bg: arrowHoverColor, transform: 'scale(1.1)' }}
                transition="all 0.2s"
                boxShadow="lg"
              />
            </Flex>
            
            <VStack spacing={4} align="start" width="100%" px={4}>
              <Box width="100%">
                <Text fontSize="2xl" fontWeight="bold" mb={2}>
                  {currentObject.name}
                </Text>
                <Text fontSize="lg" color="gray.600" lineHeight="tall" mb={4}>
                  {currentObject.description}
                </Text>
                <Text fontSize="xl" color="green.600" fontWeight="semibold">
                  Estimated Value: {currentObject.price}
                </Text>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Confidence Score: {(currentObject.confidence * 100).toFixed(1)}%
                </Text>
              </Box>
            </VStack>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button size="lg" onClick={onClose} colorScheme="blue">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
