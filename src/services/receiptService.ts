import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

export interface AnalyzedData {
  name: string;
  description: string;
  price: string;
}

export interface ReceiptProcessResult {
  mainImageUrl: string;
  text: string;
  folderPath: string;
  analyzedData: AnalyzedData;
}

export const processAndUploadReceipt = async (
  userId: string,
  itemId: string,
  file: File
): Promise<ReceiptProcessResult> => {
  try {
    const timestamp = Date.now();
    const folderPath = `receipts/${userId}/${itemId}/${timestamp}`;

    // Upload the receipt image to Firebase Storage
    const mainImageRef = ref(storage, `${folderPath}/receipt.jpg`);
    await uploadBytes(mainImageRef, file);
    const mainImageUrl = await getDownloadURL(mainImageRef);

    // Send receipt to Python backend for OCR processing and analysis
    const api = 'http://127.0.0.1:4000';
    const ocrResponse = await fetch(`${api}/read-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: mainImageUrl })
    });

    if (!ocrResponse.ok) {
      throw new Error('OCR processing failed');
    }

    const ocrResult = await ocrResponse.json();

    // Store the receipt data in Firestore
    const receiptRef = doc(collection(db, 'receipts'));
    await setDoc(receiptRef, {
      id: receiptRef.id,
      userId,
      itemId,
      imageUrl: mainImageUrl,
      folderPath,
      text: ocrResult.text,
      analyzedData: ocrResult.analyzed_data,
      timestamp: new Date(),
      type: 'receipt'
    });

    // If this is attached to an item, find and update the item in its room
    if (itemId !== 'general') {
      // Find the room containing this item
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('userId', '==', userId)
      );
      const roomsSnapshot = await getDocs(roomsQuery);
      
      for (const roomDoc of roomsSnapshot.docs) {
        const room = roomDoc.data();
        const items = room.items || [];
        const itemIndex = items.findIndex((item: any) => item.id === itemId);
        
        if (itemIndex !== -1) {
          // Update the item with receipt information
          items[itemIndex] = {
            ...items[itemIndex],
            receiptUrl: mainImageUrl,
            receiptText: ocrResult.text,
            // Only update these fields if they're not already set
            name: items[itemIndex].name || ocrResult.analyzed_data.name,
            description: items[itemIndex].description || ocrResult.analyzed_data.description,
            estimatedValue: items[itemIndex].estimatedValue || parseFloat(ocrResult.analyzed_data.price.replace(/[^0-9.]/g, '')) || 0
          };
          
          // Update the room document
          await updateDoc(roomDoc.ref, { items });
          break;
        }
      }
    }

    return {
      mainImageUrl,
      text: ocrResult.text,
      folderPath,
      analyzedData: ocrResult.analyzed_data
    };
  } catch (error) {
    console.error('Error in processAndUploadReceipt:', error);
    throw error;
  }
};