import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc,
  writeBatch,
  DocumentData,
  QueryConstraint,
  orderBy
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Generic document operations
export const getDocument = async <T = DocumentData>(path: string): Promise<T | null> => {
  const docRef = doc(db, path);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as T : null;
};

export const setDocument = async (path: string, data: any) => {
  const docRef = doc(db, path);
  await setDoc(docRef, data);
  return docRef.id;
};

export const updateDocument = async (path: string, data: any) => {
  const docRef = doc(db, path);
  await updateDoc(docRef, data);
};

export const deleteDocument = async (path: string) => {
  await deleteDoc(doc(db, path));
};

// Query operations
export const queryDocuments = async <T = DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[]
): Promise<T[]> => {
  const q = query(collection(db, collectionPath), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
};

// Batch operations
export const batchUpdate = async (operations: { path: string; data: any }[]) => {
  const batch = writeBatch(db);
  operations.forEach(({ path, data }) => {
    batch.update(doc(db, path), data);
  });
  await batch.commit();
};

// Storage operations
export const uploadFile = async (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      reject,
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const deleteFile = async (path: string) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}; 