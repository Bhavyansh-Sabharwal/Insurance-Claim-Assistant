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
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

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
        const objects = result.detectedObjects;

        onUploadComplete({ detectedObjects: objects });

        if (objects.length > 0) {
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
  }, [itemId, userId, onUploadComplete, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    disabled: isUploading
  });

  return (
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
  );
};
