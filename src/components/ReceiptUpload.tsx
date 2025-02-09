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
  Button
} from '@chakra-ui/react';
import { processAndUploadReceipt } from '../services/receiptService';

interface ReceiptUploadProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  userId: string;
  onUploadComplete: (result: { text: string; imageUrl: string; }) => void;
}

export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
  isOpen,
  onClose,
  itemId,
  userId,
  onUploadComplete
}) => {
  if (!isOpen) return null;

  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Only image files are supported for receipt processing',
          status: 'error',
          duration: 5000,
        });
        continue;
      }

      setIsUploading(true);
      setUploadProgress('Uploading receipt...');

      try {
        setUploadProgress('Processing receipt and extracting text...');
        const result = await processAndUploadReceipt(userId, itemId, file);

        onUploadComplete({
          text: result.text,
          imageUrl: result.mainImageUrl
        });

        toast({
          title: 'Upload successful',
          description: 'Receipt processed successfully',
          status: 'success',
          duration: 5000,
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload Error',
          description: error instanceof Error ? error.message : 'Failed to process receipt',
          status: 'error',
          duration: 5000,
        });
      } finally {
        setIsUploading(false);
        setUploadProgress('');
      }
    }
  }, [itemId, userId, onUploadComplete, toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    disabled: isUploading,
    noClick: true
  });

  return (
    <VStack spacing={4} width="100%">
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
                  ? 'Drop the receipt here'
                  : 'Drag and drop a receipt here'}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Supports images (JPG, PNG)
              </Text>
            </>
          )}
        </VStack>
      </Box>
      {!isUploading && (
        <Button colorScheme="green" width="100%" onClick={open}>
          Select Receipt
        </Button>
      )}
    </VStack>
  );
};