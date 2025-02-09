import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';
import { uploadSingleImage } from '../services/imageService';
import { useLocalization } from '../hooks/useLocalization';

interface SimpleFileUploadProps {
  itemId: string;
  userId: string;
  onUploadComplete: (imageUrl: string) => void;
}

export const SimpleFileUpload = ({ itemId, userId, onUploadComplete }: SimpleFileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { t } = useLocalization();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const imageUrl = await uploadSingleImage(userId, itemId, file);
      onUploadComplete(imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('error.imageUploadFailed'),
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <VStack spacing={4} width="100%">
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        display="none"
      />
      <Box
        border="2px dashed"
        borderColor="gray.300"
        borderRadius="md"
        p={6}
        width="100%"
        textAlign="center"
        cursor="pointer"
        onClick={handleClick}
        _hover={{ borderColor: 'blue.500' }}
      >
        <VStack spacing={2}>
          <AttachmentIcon boxSize={8} color="gray.400" />
          <Text>{t('inventory.dragOrClick')}</Text>
        </VStack>
      </Box>
      <Button
        onClick={handleClick}
        isLoading={isUploading}
        loadingText={t('inventory.uploading')}
        width="100%"
      >
        {t('inventory.selectImage')}
      </Button>
    </VStack>
  );
}; 