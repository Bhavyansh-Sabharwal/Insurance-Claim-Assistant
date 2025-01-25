import React, { useEffect, useRef, useState } from 'react';
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';
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
  HStack,
  Image,
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
  const [isPanoramaMode, setIsPanoramaMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const capturedFramesRef = useRef<HTMLCanvasElement[]>([]);
  const sphereContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      startOrientationTracking();
    } else {
      stopCamera();
      stopOrientationTracking();
      setIsPanoramaMode(false);
      setPreviewImage(null);
      setShowPreview(false);
      capturedFramesRef.current = [];
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
          width: { ideal: 4096 },
          height: { ideal: 2048 }
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

  const startPanoramaCapture = () => {
    setIsPanoramaMode(true);
    setIsCapturing(true);
    capturedFramesRef.current = [];
    captureFrame();
  };

  const stopPanoramaCapture = () => {
    setIsPanoramaMode(false);
    setIsCapturing(false);
    if (capturedFramesRef.current.length > 0) {
      createSphericalPanorama();
    }
  };

  const createSphericalPanorama = () => {
    if (capturedFramesRef.current.length === 0) return;

    const frames = capturedFramesRef.current;
    const panoramaCanvas = document.createElement('canvas');
    const context = panoramaCanvas.getContext('2d');

    if (!context) return;

    // Set dimensions for equirectangular projection (2:1 aspect ratio)
    panoramaCanvas.width = 4096;
    panoramaCanvas.height = 2048;

    // Clear the canvas with a black background
    context.fillStyle = '#000';
    context.fillRect(0, 0, panoramaCanvas.width, panoramaCanvas.height);

    // Calculate the angle step between frames
    const angleStep = 360 / frames.length;

    // Draw frames with proper positioning for spherical projection
    frames.forEach((frame, index) => {
      const angle = index * angleStep;
      const x = (angle / 360) * panoramaCanvas.width;
      
      // Scale the frame to fit the height
      const scaleFactor = panoramaCanvas.height / frame.height;
      const scaledWidth = frame.width * scaleFactor;
      
      context.save();
      context.translate(x, 0);
      context.drawImage(frame, 0, 0, scaledWidth, panoramaCanvas.height);
      context.restore();
    });

    // Convert to image for preview
    const panoramaUrl = panoramaCanvas.toDataURL('image/jpeg', 1.0);
    setPreviewImage(panoramaUrl);
    setShowPreview(true);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isPanoramaMode) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    capturedFramesRef.current.push(canvas);

    // Continue capturing frames
    if (isPanoramaMode) {
      requestAnimationFrame(() => {
        setTimeout(captureFrame, 100); // Capture every 100ms
      });
    }
  };

  const handleConfirmUpload = () => {
    if (!previewImage) return;

    // Convert data URL to File
    fetch(previewImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `panorama-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        onClose();
      })
      .catch(error => {
        console.error('Error creating file:', error);
        toast({
          title: 'Error',
          description: 'Failed to process panorama image',
          status: 'error',
          duration: 5000,
        });
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Capture 360° Panorama</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box position="relative" width="100%" height="70vh">
              {!showPreview ? (
                <>
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
                </>
              ) : (
                <div ref={sphereContainerRef} style={{ width: '100%', height: '100%' }}>
                  <ReactPhotoSphereViewer
                    src={previewImage || ''}
                    height="100%"
                    width="100%"
                    container={sphereContainerRef.current || undefined}
                  />
                </div>
              )}
            </Box>

            <Text textAlign="center">
              {!showPreview
                ? isPanoramaMode
                  ? 'Slowly rotate in a full circle to capture a 360° panorama'
                  : 'Press Start to begin capturing 360° panorama'
                : 'Review your 360° panorama'}
            </Text>

            <HStack spacing={4} justify="center">
              {!showPreview ? (
                <>
                  <Button
                    colorScheme="blue"
                    onClick={isPanoramaMode ? stopPanoramaCapture : startPanoramaCapture}
                    isLoading={isCapturing}
                  >
                    {isPanoramaMode ? 'Stop' : 'Start'}
                  </Button>
                </>
              ) : (
                <>
                  <Button colorScheme="blue" onClick={handleConfirmUpload}>
                    Upload
                  </Button>
                  <Button variant="ghost" onClick={() => {
                    setShowPreview(false);
                    setPreviewImage(null);
                    capturedFramesRef.current = [];
                  }}>
                    Retake
                  </Button>
                </>
              )}
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};