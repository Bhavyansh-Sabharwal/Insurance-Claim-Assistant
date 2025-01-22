import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, db } from '../config/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
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
  itemId: string,
  documentId: string,
  storageUrl: string
) => {
  const storageRef = ref(storage, storageUrl);
  await deleteObject(storageRef);

  const itemRef = doc(db, 'items', itemId);
  await updateDoc(itemRef, {
    documents: arrayRemove(documentId)
  });
}; 