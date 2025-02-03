import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Text,
  VStack,
  Image,
  Progress,
  useToast,
  Button
} from '@chakra-ui/react';
import { uploadDocument } from '../services/storage';
import { DocumentReference } from '../types/models';

interface FileUploadProps {
  itemId: string;
  userId: string;
  onUploadComplete: (document: DocumentReference) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  itemId,
  userId,
  onUploadComplete
}) => {
  const toast = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        const type = file.type.startsWith('image/') ? 'photo' : 'receipt';
        const document = await uploadDocument(userId, itemId, file, type);
        onUploadComplete(document);
      } catch (error) {
        toast({
          title: 'Upload Error',
          description: `Failed to upload ${file.name}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  }, [itemId, userId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    }
  });

  return (
    <Box
      {...getRootProps()}
      p={6}
      border="2px dashed"
      borderColor={isDragActive ? 'blue.400' : 'gray.200'}
      borderRadius="md"
      cursor="pointer"
    >
      <input {...getInputProps()} />
      <VStack spacing={2}>
        <Text>
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag and drop files here, or click to select files'}
        </Text>
        <Text fontSize="sm" color="gray.500">
          Supports images (JPG, PNG) and PDF documents
        </Text>
      </VStack>
    </Box>
  );
}; 