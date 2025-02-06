import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection } from 'firebase/firestore';
import { getImageDetection } from './objectDetection'; // You'll need to implement this

interface DetectedObject {
  label: string;
  confidence: number;
  imageUrl: string;
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

    // Run object detection
    console.log('Starting object detection...');
    const detectedObjects = await getImageDetection(file);
    console.log('Detected objects:', detectedObjects);
    
    // Upload detected object images
    const uploadedObjects: DetectedObject[] = [];
    
    for (let i = 0; i < detectedObjects.length; i++) {
      const object = detectedObjects[i];
      try {
        const objectImageRef = ref(storage, `${folderPath}/object_${i + 1}.${fileExtension}`);
        
        // Convert the detected object image to a File/Blob before uploading
        const response = await fetch(object.imageUrl);
        const blob = await response.blob();
        
        await uploadBytes(objectImageRef, blob);
        const objectImageUrl = await getDownloadURL(objectImageRef);
        
        uploadedObjects.push({
          label: object.label,
          confidence: object.confidence,
          imageUrl: objectImageUrl
        });

        // Save detected object reference to photos collection
        await setDoc(doc(collection(db, 'photos')), {
          userId,
          itemId,
          imageUrl: objectImageUrl,
          folderPath,
          timestamp: new Date(),
          type: 'detected',
          label: object.label,
          confidence: object.confidence
        });

        // Cleanup object URL
        URL.revokeObjectURL(object.imageUrl);
      } catch (error) {
        console.error(`Error processing detected object ${i + 1}:`, error);
      }
    }

    return {
      mainImageUrl,
      detectedObjects: uploadedObjects,
      folderPath
    };
  } catch (error) {
    console.error('Error in processAndUploadImage:', error);
    throw error;
  }
}; 