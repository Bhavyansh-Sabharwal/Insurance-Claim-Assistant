import { TranslationKey } from '../i18n/translations';

export type Item = {
  id: string;
  name: string;
  description: string;
  estimatedValue: number;
  room: string;
  category: TranslationKey;
  imageUrl?: string;
  receiptUrl?: string;
  receiptText?: string;
};

export type Room = {
  id: string;
  name: TranslationKey | string;
  items: Item[];
  userId: string;
  orderIndex: number;
}; 