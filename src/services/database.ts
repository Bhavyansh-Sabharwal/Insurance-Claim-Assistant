import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { UserProfile, InventoryItem } from '../types/models';

export const createUserProfile = async (profile: Partial<UserProfile>): Promise<void> => {
  if (!profile.uid) throw new Error('User ID is required');
  
  await setDoc(doc(db, 'users', profile.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  
  // First check if the user document exists
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    // If the document doesn't exist, create it
    await createUserProfile({
      uid,
      ...updates,
    });
  } else {
    // If it exists, update it
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }
};

export const createInventoryItem = async (item: InventoryItem): Promise<string> => {
  const itemRef = doc(collection(db, 'items'));
  await setDoc(itemRef, {
    ...item,
    id: itemRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return itemRef.id;
};

export const updateInventoryItem = async (
  itemId: string,
  updates: Partial<InventoryItem>
): Promise<void> => {
  await updateDoc(doc(db, 'items', itemId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const getUserItems = async (userId: string): Promise<InventoryItem[]> => {
  const q = query(collection(db, 'items'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as InventoryItem);
}; 