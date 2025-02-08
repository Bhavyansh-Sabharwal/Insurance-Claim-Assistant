import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Text,
  VStack,
  useToast,
  Progress,
  Spinner,
  Center
} from '@chakra-ui/react';
import { DetectedObject, processAndUploadImage } from '../services/imageService';
import { DetectedObjectsModal } from './DetectedObjectsModal';

interface FileUploadProps {
  itemId: string;
  userId: string;
  onUploadComplete: (document: any) => void;
}

/**
 * FileUpload Component
 *
 * A reusable component that handles image file uploads with object detection capabilities.
 * Provides drag-and-drop functionality and displays upload progress and detected objects.
 */

export const FileUpload: React.FC<FileUploadProps> = ({
  itemId,
  userId,
  onUploadComplete
}) => {
  // Hooks for managing component state
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showDetectedObjects, setShowDetectedObjects] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<Array<DetectedObject>>([]);

  /**
   * Handles file drop events and processes uploaded images
   * Validates file types, manages upload state, and processes detected objects
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Only image files are supported for object detection',
          status: 'error',
          duration: 5000,
        });
        continue;
      }

      // Set upload state and show progress
      setIsUploading(true);
      setUploadProgress('Uploading image...');

      try {
        // Process image and detect objects
        setUploadProgress('Processing image and detecting objects...');
        const result = await processAndUploadImage(userId, itemId, file);

        // Transform detected objects for the modal display
        const objects = result.detectedObjects;

        setDetectedObjects(objects);

        // Show success message based on detection results
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
        // Reset upload state
        setIsUploading(false);
        setUploadProgress('');
      }
    }
  }, [itemId, userId, onUploadComplete]);

  // Configure dropzone with accepted file types and upload state
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    disabled: isUploading
  });

  return (
    <>
      {/* File upload dropzone area */}
      <Box
        {...getRootProps()}
        p={6}
        border="2px dashed"
        borderColor={isDragActive ? 'blue.400' : 'gray.200'}
        borderRadius="md"
        cursor={isUploading ? 'not-allowed' : 'pointer'}
        opacity={isUploading ? 0.6 : 1}
        position="relative"
      >
        <input {...getInputProps()} disabled={isUploading} />
        <VStack spacing={2}>
          {isUploading ? (
            // Upload progress indicator
            <Center p={4}>
              <VStack spacing={4}>
                <Spinner size="xl" />
                <Text>{uploadProgress}</Text>
                <Progress size="xs" width="100%" isIndeterminate />
              </VStack>
            </Center>
          ) : (
            // Upload instructions
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

      {/* Modal for displaying detected objects */}
      <DetectedObjectsModal
        isOpen={showDetectedObjects}
        onClose={() => setShowDetectedObjects(false)}
        detectedObjects={detectedObjects as any}
      />
    </>
  );
};
