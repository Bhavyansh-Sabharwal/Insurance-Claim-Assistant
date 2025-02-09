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

    // Store the receipt data in Firestore receipts collection
    const receiptRef = doc(collection(db, 'receipts'));
    await setDoc(receiptRef, {
      id: receiptRef.id,
      userId,
      itemId,
      receiptUrl: mainImageUrl,  // Store as receiptUrl to be consistent
      folderPath,
      text: ocrResult.text,
      analyzedData: ocrResult.analyzed_data,
      timestamp: new Date(),
      type: 'receipt'
    });

    // If this is attached to an item, only update the estimated value if not set
    if (itemId !== 'general') {
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
          // Only update the estimated value if not already set
          const currentItem = items[itemIndex];
          if (!currentItem.estimatedValue) {
            const newEstimatedValue = parseFloat(ocrResult.analyzed_data.price.replace(/[^0-9.]/g, '')) || 0;
            items[itemIndex] = {
              ...currentItem,
              estimatedValue: newEstimatedValue
            };
            
            // Update the room document
            await updateDoc(roomDoc.ref, { items });
          }
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