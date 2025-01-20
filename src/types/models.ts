export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  preferences: {
    language: string;
    currency: string;
  };
  propertyDetails?: {
    type: string;
    address: string;
    rooms: number;
  };
  setupCompleted?: boolean;
  contactInfo?: {
    phone: string;
    alternateContact?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  description?: string;
  room: string;
  category: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  condition: string;
  documents: DocumentReference[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentReference {
  id: string;
  type: 'receipt' | 'photo' | 'other';
  fileName: string;
  storageUrl: string;
  isBlurred: boolean;
  uploadedAt: Date;
}

export interface Room {
  id: string;
  name: string;
  items: InventoryItem[];
  userId: string;
  orderIndex: number;
} 