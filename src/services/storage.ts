import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { DocumentReference } from '../types/models';

export const uploadDocument = async (
  userId: string,
  itemId: string,
  file: File,
  type: DocumentReference['type'],
  isBlurred: boolean = false
): Promise<DocumentReference> => {
  // Create a unique file path
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}/${itemId}/${Date.now()}.${fileExtension}`;
  const storageRef = ref(storage, fileName);

  // Upload the file
  await uploadBytes(storageRef, file);
  const storageUrl = await getDownloadURL(storageRef);

  // Create document reference
  const documentRef: DocumentReference = {
    id: fileName,
    type,
    fileName: file.name,
    storageUrl,
    isBlurred,
    uploadedAt: new Date()
  };

  // Update the item in Firestore with the new document reference
  await updateDoc(doc(db, 'items', itemId), {
    documents: arrayUnion(documentRef),
    updatedAt: new Date()
  });

  return documentRef;
};

export const deleteDocument = async (
  userId: string,
  itemId: string,
  documentId: string
): Promise<void> => {
  // Delete from Storage
  const storageRef = ref(storage, documentId);
  await deleteObject(storageRef);

  // Update Firestore document
  const itemRef = doc(db, 'items', itemId);
  await updateDoc(itemRef, {
    documents: arrayRemove({ id: documentId }),
    updatedAt: new Date()
  });
}; 