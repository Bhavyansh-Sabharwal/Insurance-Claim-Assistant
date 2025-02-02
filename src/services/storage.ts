import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { DocumentReference } from '../types/models';

/**
 * Uploads a document to Firebase Storage and updates the corresponding Firestore record
 * 
 * @param userId - The ID of the user uploading the document
 * @param itemId - The ID of the inventory item the document belongs to
 * @param file - The file to be uploaded
 * @param type - The type of document being uploaded
 * @param isBlurred - Whether the document should be marked as blurred (default: false)
 * @returns Promise resolving to DocumentReference containing upload metadata
 */
export const uploadDocument = async (
  userId: string,
  itemId: string,
  file: File,
  type: DocumentReference['type'],
  isBlurred: boolean = false
): Promise<DocumentReference> => {
  // Create a unique file path using timestamp
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}/${itemId}/${Date.now()}.${fileExtension}`;
  const storageRef = ref(storage, fileName);

  // Upload the file to Firebase Storage
  await uploadBytes(storageRef, file);
  const storageUrl = await getDownloadURL(storageRef);

  // Create document reference object with metadata
  const documentRef: DocumentReference = {
    id: fileName,
    type,
    fileName: file.name,
    storageUrl,
    isBlurred,
    uploadedAt: new Date()
  };

  // Update the item's documents array in Firestore
  await updateDoc(doc(db, 'items', itemId), {
    documents: arrayUnion(documentRef),
    updatedAt: new Date()
  });

  return documentRef;
};

/**
 * Deletes a document from Firebase Storage and removes its reference from Firestore
 * 
 * @param userId - The ID of the user who owns the document
 * @param itemId - The ID of the inventory item the document belongs to
 * @param documentId - The unique identifier of the document to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteDocument = async (
  userId: string,
  itemId: string,
  documentId: string
): Promise<void> => {
  // Delete the file from Firebase Storage
  const storageRef = ref(storage, documentId);
  await deleteObject(storageRef);

  // Remove the document reference from the item's documents array in Firestore
  const itemRef = doc(db, 'items', itemId);
  await updateDoc(itemRef, {
    documents: arrayRemove({ id: documentId }),
    updatedAt: new Date()
  });
};