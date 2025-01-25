import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';

interface PanoramaCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const PanoramaCapture: React.FC<PanoramaCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const toast = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState<number>(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      startOrientationTracking();
    } else {
      stopCamera();
      stopOrientationTracking();
    }

    return () => {
      stopCamera();
      stopOrientationTracking();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Camera Error',
        description: 'Unable to access the camera',
        status: 'error',
        duration: 5000,
      });
      onClose();
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startOrientationTracking = () => {
    window.addEventListener('deviceorientation', handleOrientation);
  };

  const stopOrientationTracking = () => {
    window.removeEventListener('deviceorientation', handleOrientation);
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null) {
      setDeviceOrientation(event.alpha);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current frame from video to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `panorama-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        onClose();
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Capture Panorama</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box position="relative" width="100%" height="70vh">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              {/* Orientation Guide */}
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform={`translate(-50%, -50%) rotate(${deviceOrientation}deg)`}
                width="4px"
                height="100px"
                bg="blue.500"
                opacity={0.7}
              />
            </Box>

            <Text textAlign="center">
              Slowly rotate your device to capture a panoramic view
            </Text>

            <Button
              colorScheme="blue"
              onClick={captureImage}
              isLoading={isCapturing}
              mb={4}
            >
              Capture Panorama
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};