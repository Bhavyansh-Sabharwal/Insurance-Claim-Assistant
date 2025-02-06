import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection } from 'firebase/firestore';

/**
 * Interface representing a detected object in an image
 * Contains information about the object's label, confidence score,
 * associated image URL, and optional pricing/description details
 */
interface DetectedObject {
  label: string;          // Object classification label
  confidence: number;      // Detection confidence score (0-1)
  imageUrl: string;       // URL to the cropped object image
  price?: string;         // Optional estimated price
  description?: string;   // Optional object description
}

/**
 * Interface representing the result of an image upload and processing operation
 * Contains URLs and metadata for both the main image and any detected objects
 */
interface ImageUploadResult {
  mainImageUrl: string;           // URL to the uploaded original image
  detectedObjects: DetectedObject[]; // Array of detected objects
  folderPath: string;            // Storage path where images are saved
}

/**
 * Processes and uploads an image file, performs object detection, and analyzes pricing
 * 
 * @param userId - The ID of the user uploading the image
 * @param itemId - The ID of the inventory item associated with the image
 * @param file - The image file to be processed
 * @returns Promise resolving to ImageUploadResult containing processing results
 * 
 * The function performs the following steps:
 * 1. Uploads the original image to Firebase Storage
 * 2. Stores image metadata in Firestore
 * 3. Sends image for object detection
 * 4. For each detected object:
 *    - Uploads cropped object image
 *    - Gets pricing analysis
 *    - Stores object metadata
 */
export const processAndUploadImage = async (
  userId: string,
  itemId: string,
  file: File
): Promise<ImageUploadResult> => {
  try {
    // Create a unique folder path for this upload using timestamp
    const timestamp = Date.now();
    const folderPath = `users/${userId}/items/${itemId}/images/${timestamp}`;
    
    // Upload the original image to Firebase Storage
    const mainImageRef = ref(storage, `${folderPath}/main.jpg`);
    await uploadBytes(mainImageRef, file);
    const mainImageUrl = await getDownloadURL(mainImageRef);

    // Store the main image metadata in Firestore photos collection
    const photoRef = doc(collection(db, 'photos'));
    await setDoc(photoRef, {
      userId,
      itemId,
      imageUrl: mainImageUrl,
      folderPath,
      timestamp: new Date(),
      type: 'main'
    });

    // Prepare image data for object detection backend
    const formData = new FormData();
    formData.append('image', file);
    formData.append('image_url', mainImageUrl);

    // Send image to Python backend for object detection
    const detectionResponse = await fetch('/api/detect-objects', {
      method: 'POST',
      body: formData
    });

    if (!detectionResponse.ok) {
      throw new Error('Object detection failed');
    }

    const detectionResult = await detectionResponse.json();
    const detectedObjects: DetectedObject[] = [];

    // Process each detected object from the response
    for (const object of detectionResult.objects) {
      // Upload the cropped object image to Firebase
      const objectImageRef = ref(storage, `${folderPath}/object_${object.label}.jpg`);
      const objectImageBlob = await fetch(object.image_url).then(r => r.blob());
      await uploadBytes(objectImageRef, objectImageBlob);
      const objectImageUrl = await getDownloadURL(objectImageRef);

      // Get pricing analysis for the detected object
      const pricingResponse = await fetch('/api/analyze-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_url: objectImageUrl })
      });

      const pricingResult = await pricingResponse.json();

      // Create detected object metadata
      const detectedObject: DetectedObject = {
        label: object.label,
        confidence: object.confidence,
        imageUrl: objectImageUrl,
        price: pricingResult.price,
        description: pricingResult.description
      };

      detectedObjects.push(detectedObject);

      // Store detected object metadata in Firestore
      await setDoc(doc(collection(db, 'photos')), {
        userId,
        itemId,
        imageUrl: objectImageUrl,
        folderPath,
        timestamp: new Date(),
        type: 'detected',
        label: object.label,
        confidence: object.confidence,
        price: pricingResult.price,
        description: pricingResult.description
      });
    }

    // Return the processing results
    return {
      mainImageUrl,
      detectedObjects,
      folderPath
    };
  } catch (error) {
    console.error('Error in processAndUploadImage:', error);
    throw error;
  }
};