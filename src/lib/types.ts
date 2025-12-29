import type { User } from 'firebase/auth';

export interface AppUser extends User {
  username?: string;
  role?: 'admin' | 'user';
}

export type Channel = {
  id: string;
  name: string;
};

export type Message = {
  id: string;
  channelId: string;
  author: {
    uid: string;
    name: string;
  };
  content: string;
  timestamp: number;
  isLocked: boolean;
  price: number;
  unlockedBy: string[]; // array of user uids
  imageData?: string | null; // data URL for image
  unlockedByUsers?: { id: string; username?: string; email?: string }[];
  notUnlockedUsers?: { id: string; username?: string; email?: string }[];
};

export type Transaction = {
  id: string;
  type: 'deposit' | 'purchase';
  amount: number;
  description: string;
  timestamp: number;
};
