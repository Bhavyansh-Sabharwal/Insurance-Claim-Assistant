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

/**
 * Creates a new user profile document in Firestore
 * 
 * @param profile - Partial user profile data to be created
 * @throws Error if uid is not provided in the profile
 */
export const createUserProfile = async (profile: Partial<UserProfile>): Promise<void> => {
  if (!profile.uid) throw new Error('User ID is required');
  
  // Create new user document with timestamps
  await setDoc(doc(db, 'users', profile.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Updates an existing user profile or creates it if it doesn't exist
 * 
 * @param uid - User ID to update
 * @param updates - Partial user profile data to update
 */
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

/**
 * Creates a new inventory item document in Firestore
 * 
 * @param item - Inventory item data to be created
 * @returns Promise resolving to the created item's ID
 */
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

/**
 * Updates an existing inventory item document
 * 
 * @param itemId - ID of the item to update
 * @param updates - Partial item data to update
 */
export const updateInventoryItem = async (
  itemId: string,
  updates: Partial<InventoryItem>
): Promise<void> => {
  await updateDoc(doc(db, 'items', itemId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Retrieves all inventory items belonging to a specific user
 * 
 * @param userId - ID of the user whose items to retrieve
 * @returns Promise resolving to array of inventory items
 */
export const getUserItems = async (userId: string): Promise<InventoryItem[]> => {
  const q = query(collection(db, 'items'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as InventoryItem);
};