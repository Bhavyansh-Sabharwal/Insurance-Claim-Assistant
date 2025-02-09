import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

export interface ReceiptProcessResult {
  mainImageUrl: string;
  text: string;
  folderPath: string;
}

export const processAndUploadReceipt = async (
  userId: string,
  itemId: string,
  file: File
): Promise<ReceiptProcessResult> => {
  try {
    const timestamp = Date.now();
    const folderPath = `users/${userId}/${itemId}/${timestamp}`;

    // Upload the original receipt to Firebase Storage
    const mainImageRef = ref(storage, `${folderPath}/receipt.jpg`);
    await uploadBytes(mainImageRef, file);
    const mainImageUrl = await getDownloadURL(mainImageRef);

    // Store the receipt metadata in Firestore
    const receiptRef = doc(collection(db, 'receipts'));
    await setDoc(receiptRef, {
      userId,
      itemId,
      imageUrl: mainImageUrl,
      folderPath,
      timestamp: new Date(),
      type: 'receipt'
    });

    // Send receipt to Python backend for OCR processing
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

    return {
      mainImageUrl,
      text: ocrResult.text,
      folderPath
    };
  } catch (error) {
    console.error('Error in processAndUploadReceipt:', error);
    throw error;
  }
};