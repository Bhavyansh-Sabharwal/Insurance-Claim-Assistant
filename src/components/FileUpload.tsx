import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Text,
  VStack,
  useToast,
  Progress,
  Spinner,
  Center,
  Button,
  useBreakpointValue
} from '@chakra-ui/react';
import { ViewIcon } from '@chakra-ui/icons';
import { PanoramaCapture } from './PanoramaCapture';
import { processAndUploadImage } from '../services/imageProcessing';
import { DetectedObjectsModal } from './DetectedObjectsModal';

interface FileUploadProps {
  itemId: string;
  userId: string;
  onUploadComplete: (document: any) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  itemId,
  userId,
  onUploadComplete
}) => {
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showDetectedObjects, setShowDetectedObjects] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<Array<{ label: string; imageUrl: string }>>([]);
  const [showPanoramaCapture, setShowPanoramaCapture] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Only image files are supported for object detection',
          status: 'error',
          duration: 5000,
        });
        continue;
      }

      setIsUploading(true);
      setUploadProgress('Uploading image...');
      
      try {
        setUploadProgress('Processing image and detecting objects...');
        const result = await processAndUploadImage(userId, itemId, file);
        
        // Transform detected objects for the modal
        const objects = result.detectedObjects.map(obj => ({
          label: obj.label,
          imageUrl: obj.imageUrl
        }));
        
        setDetectedObjects(objects);
        
        if (objects.length > 0) {
          setShowDetectedObjects(true);
          toast({
            title: 'Upload successful',
            description: `Detected ${objects.length} objects in the image`,
            status: 'success',
            duration: 5000,
          });
        } else {
          toast({
            title: 'Upload successful',
            description: 'No objects were detected in the image',
            status: 'info',
            duration: 5000,
          });
        }
        
        onUploadComplete(result);
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload Error',
          description: error instanceof Error ? error.message : 'Failed to process image',
          status: 'error',
          duration: 5000,
        });
      } finally {
        setIsUploading(false);
        setUploadProgress('');
      }
    }
  }, [itemId, userId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    disabled: isUploading
  });

  return (
    <>
      <VStack spacing={4} width="100%">
        {isMobile && (
          <Button
            leftIcon={<ViewIcon />}
            colorScheme="blue"
            width="100%"
            onClick={() => setShowPanoramaCapture(true)}
            isDisabled={isUploading}
          >
            Capture Panorama
          </Button>
        )}
        
        <Box
          {...getRootProps()}
          p={6}
          border="2px dashed"
          borderColor={isDragActive ? 'blue.400' : 'gray.200'}
          borderRadius="md"
          cursor={isUploading ? 'not-allowed' : 'pointer'}
          opacity={isUploading ? 0.6 : 1}
          position="relative"
          width="100%"
        >
          <input {...getInputProps()} disabled={isUploading} />
          <VStack spacing={2}>
            {isUploading ? (
              <Center p={4}>
                <VStack spacing={4}>
                  <Spinner size="xl" />
                  <Text>{uploadProgress}</Text>
                  <Progress size="xs" width="100%" isIndeterminate />
                </VStack>
              </Center>
            ) : (
              <>
                <Text>
                  {isDragActive
                    ? 'Drop the image here'
                    : 'Drag and drop an image here, or click to select'}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Supports images (JPG, PNG)
                </Text>
              </>
            )}
          </VStack>
        </Box>

        <DetectedObjectsModal
          isOpen={showDetectedObjects}
          onClose={() => setShowDetectedObjects(false)}
          detectedObjects={detectedObjects}
        />
        
        <PanoramaCapture
          isOpen={showPanoramaCapture}
          onClose={() => setShowPanoramaCapture(false)}
          onCapture={(file) => onDrop([file])}
        />
      </VStack>
    </>
  );
};