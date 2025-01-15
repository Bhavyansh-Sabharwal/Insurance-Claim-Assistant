import { useState, useCallback } from 'react';
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

type Document = {
  id: string;
  name: string;
  type: string;
  category: string;
  uploadDate: string;
  size: string;
};

const categories = [
  'Receipts',
  'Photos',
  'Insurance Documents',
  'Property Records',
  'Other',
];

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    // Simulate file upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploading(false);
        setUploadProgress(0);

        // Add uploaded files to documents
        Array.from(files).forEach(file => {
          const newDoc: Document = {
            id: Date.now().toString(),
            name: file.name,
            type: file.type,
            category: selectedCategory || 'Other',
            uploadDate: new Date().toLocaleDateString(),
            size: formatFileSize(file.size),
          };
          setDocuments(prev => [...prev, newDoc]);
        });

        toast({
          title: 'Upload Complete',
          description: `Successfully uploaded ${files.length} file(s)`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    }, 200);
  }, [selectedCategory, toast]);

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: 'Document Deleted',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
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
          <Heading size="lg" mb={4}>Documents</Heading>
          <Text color={useColorModeValue('gray.600', 'gray.300')}>
            Upload and manage your documentation for the insurance claim.
          </Text>
        </Box>

        <Flex gap={4} wrap="wrap">
          <Select
            placeholder="Filter by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            maxW="200px"
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
              disabled={uploading}
            />
            <Button
              as="label"
              htmlFor="file-upload"
              leftIcon={<AddIcon />}
              colorScheme="blue"
              cursor="pointer"
              isLoading={uploading}
            >
              Upload Files
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
                    {doc.name}
                  </Heading>
                  <Badge colorScheme="blue">
                    {doc.category}
                  </Badge>
                </Flex>
                
                <Text fontSize="sm" color="gray.500">
                  Uploaded: {doc.uploadDate}
                </Text>
                
                <Text fontSize="sm" color="gray.500">
                  Size: {doc.size}
                </Text>

                <Flex justify="flex-end" gap={2}>
                  <IconButton
                    aria-label="Download document"
                    icon={<DownloadIcon />}
                    size="sm"
                    variant="ghost"
                  />
                  <IconButton
                    aria-label="Delete document"
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDelete(doc.id)}
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
                ? `No documents found in the ${selectedCategory} category`
                : 'No documents uploaded yet'}
            </Text>
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default Documents; 