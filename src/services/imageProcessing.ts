import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection } from 'firebase/firestore';
import { detectProducts } from './googleVisionAI';

interface DetectedObject {
  label: string;
  confidence: number;
  imageUrl: string;
  metadata?: {
    brand?: string;
    title?: string;
    gtins?: string[];
  };
}

interface ImageUploadResult {
  mainImageUrl: string;
  detectedObjects: DetectedObject[];
  folderPath: string;
}

export const processAndUploadImage = async (
  userId: string,
  itemId: string,
  file: File
): Promise<ImageUploadResult> => {
  try {
    // Create a unique folder for this upload
    const timestamp = Date.now();
    const folderPath = `users/${userId}/items/${itemId}/images/${timestamp}`;
    
    // Get file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Upload main image
    const mainImageRef = ref(storage, `${folderPath}/main.${fileExtension}`);
    await uploadBytes(mainImageRef, file);
    const mainImageUrl = await getDownloadURL(mainImageRef);

    // Save main image reference to photos collection
    const photoRef = doc(collection(db, 'photos'));
    await setDoc(photoRef, {
      userId,
      itemId,
      imageUrl: mainImageUrl,
      folderPath,
      timestamp: new Date(),
      type: 'main'
    });

    // Run product detection using Google Vision AI
    console.log('Starting product detection...');
    const detectedProducts = await detectProducts(file);
    console.log('Detected products:', detectedProducts);
    
    // Save detected products to Firestore
    for (const product of detectedProducts) {
      await setDoc(doc(collection(db, 'photos')), {
        userId,
        itemId,
        imageUrl: product.imageUrl,
        folderPath,
        timestamp: new Date(),
        type: 'detected',
        label: product.label,
        confidence: product.confidence,
        metadata: product.metadata
      });
    }

    return {
      mainImageUrl,
      detectedObjects: detectedProducts,
      folderPath
    };
  } catch (error) {
    console.error('Error in processAndUploadImage:', error);
    throw error;
  }
}; 