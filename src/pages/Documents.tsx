import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Heading,
  Text,
  useColorModeValue,
  Stack,
  Card,
  Badge,
  IconButton,
  Input,
  useToast,
  Progress,
  Flex,
  Select,
} from '@chakra-ui/react';
import { DeleteIcon, DownloadIcon, AddIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../hooks/useLocalization';
import { storage, db } from '../config/firebase';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  doc 
} from 'firebase/firestore';
import { StoredDocument } from '../types/models';

const Documents = () => {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { currentUser } = useAuth();
  const { t } = useLocalization();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');

  // Move the categories definition inside the component
  const categories = [
    t('documents.categories.receipts'),
    t('documents.categories.photos'),
    t('documents.categories.insurance'),
    t('documents.categories.property'),
    t('documents.categories.other'),
  ];

  // Fetch user's documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!currentUser) return;

      try {
        const q = query(
          collection(db, 'documents'),
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            firestoreId: doc.id,
            uploadedAt: data.uploadedAt?.toDate() // Convert Firestore Timestamp to Date
          };
        }) as StoredDocument[];
        setDocuments(docs);
      } catch (error) {
        console.error('Fetch error:', error);
        toast({
          title: 'Error fetching documents',
          description: 'Failed to load your documents',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchDocuments();
  }, [currentUser, toast]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentUser || !selectedCategory) {
      toast({
        title: 'Error',
        description: 'Please select a category and files to upload',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Create a storage reference
        const fileName = `${currentUser.uid}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, fileName);

        // Upload file with progress monitoring
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              reject(error);
            },
            async () => {
              try {
                // Get download URL
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                // Create document reference in Firestore
                const docRef = await addDoc(collection(db, 'documents'), {
                  id: fileName,
                  userId: currentUser.uid,
                  type: file.type.startsWith('image/') ? 'photo' : 'receipt',
                  fileName: file.name,
                  storageUrl: downloadURL,
                  category: selectedCategory,
                  isBlurred: false,
                  uploadedAt: new Date(),
                  size: file.size
                });

                // Add to local state
                const newDoc: StoredDocument = {
                  id: fileName,
                  userId: currentUser.uid,
                  type: file.type.startsWith('image/') ? 'photo' : 'receipt',
                  fileName: file.name,
                  storageUrl: downloadURL,
                  category: selectedCategory,
                  isBlurred: false,
                  uploadedAt: new Date(),
                  firestoreId: docRef.id,
                  size: file.size
                };

                setDocuments(prev => [...prev, newDoc]);
                resolve();
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      }

      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${files.length} file(s)`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: 'Failed to upload one or more files',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [currentUser, selectedCategory, toast]);

  const handleDelete = async (document: StoredDocument) => {
    if (!document.firestoreId) return;

    try {
      // Delete from Storage
      const storageRef = ref(storage, document.id);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'documents', document.firestoreId));

      // Update local state
      setDocuments(prev => prev.filter(doc => doc.firestoreId !== document.firestoreId));

      toast({
        title: 'Document Deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDownload = async (document: StoredDocument) => {
    try {
      window.open(document.storageUrl, '_blank');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download document',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = selectedCategory
    ? documents.filter(doc => doc.category === selectedCategory)
    : documents;

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box>
          <Heading size="lg" mb={4}>{t('documents.title')}</Heading>
          <Text color={useColorModeValue('gray.600', 'gray.300')}>
            {t('documents.description')}
          </Text>
        </Box>

        <Flex gap={4} wrap="wrap">
          <Select
            placeholder={t('placeholder.selectCategory')}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            maxW="200px"
            isRequired
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>

          <Box position="relative">
            <Input
              type="file"
              multiple
              onChange={handleFileUpload}
              hidden
              id="file-upload"
              disabled={uploading || !selectedCategory}
            />
            <Button
              as="label"
              htmlFor="file-upload"
              leftIcon={<AddIcon />}
              colorScheme="blue"
              cursor="pointer"
              isLoading={uploading}
              isDisabled={!selectedCategory}
            >
              {t('documents.upload')}
            </Button>
          </Box>
        </Flex>

        {uploading && (
          <Progress value={uploadProgress} size="sm" colorScheme="blue" />
        )}

        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
          {filteredDocuments.map(doc => (
            <Card key={doc.id} p={4} bg={bgColor}>
              <Stack spacing={3}>
                <Flex justify="space-between" align="center">
                  <Heading size="sm" noOfLines={1}>
                    {doc.fileName}
                  </Heading>
                  <Badge colorScheme="blue">
                    {doc.category}
                  </Badge>
                </Flex>
                
                <Text fontSize="sm" color="gray.500">
                  {t('documents.uploadDate')}: {doc.uploadedAt instanceof Date ? doc.uploadedAt.toLocaleDateString() : 'Unknown date'}
                </Text>
                
                <Text fontSize="sm" color="gray.500">
                  {t('documents.fileSize')}: {formatFileSize(doc.size || 0)}
                </Text>

                <Flex justify="flex-end" gap={2}>
                  <IconButton
                    aria-label={t('button.download')}
                    icon={<DownloadIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(doc)}
                  />
                  <IconButton
                    aria-label={t('button.delete')}
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDelete(doc)}
                  />
                </Flex>
              </Stack>
            </Card>
          ))}
        </Grid>

        {filteredDocuments.length === 0 && (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">
              {selectedCategory
                ? t('documents.noCategoryDocuments')
                : t('documents.noDocuments')}
            </Text>
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default Documents; 