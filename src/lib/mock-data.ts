import type { Channel, Message, Transaction } from './types';
import { placeholderImages } from '@/lib/placeholder-images.json';

export const MOCK_USERS = {
  'user1': { uid: 'user1', name: 'Alice' },
  'user2': { uid: 'user2', name: 'Bob' },
  'user3': { uid: 'user3', name: 'Charlie' },
};

export const CHANNELS: Channel[] = [
  { id: 'general', name: 'general' },
  { id: 'payments', name: 'payments' },
  { id: 'stock-tips', name: 'stock-tips' },
  { id: 'crypto', name: 'crypto' },
];

export const MESSAGES: Message[] = [
  {
    id: 'msg1',
    channelId: 'general',
    author: MOCK_USERS['user1'],
    content: 'Welcome to LockedChat!',
    timestamp: Date.now() - 1000 * 60 * 10,
    isLocked: false,
    price: 0,
    unlockedBy: [],
  },
  {
    id: 'msg2',
    channelId: 'general',
    author: MOCK_USERS['user2'],
    content: 'This is a cool concept.',
    timestamp: Date.now() - 1000 * 60 * 9,
    isLocked: false,
    price: 0,
    unlockedBy: [],
  },
  {
    id: 'msg3',
    channelId: 'crypto',
    author: MOCK_USERS['user3'],
    content: 'My secret crypto tip is inside!',
    timestamp: Date.now() - 1000 * 60 * 8,
    isLocked: true,
    price: 10,
    unlockedBy: [],
    imageData: placeholderImages[0].url,
  },
  {
    id: 'msg4',
    channelId: 'stock-tips',
    author: MOCK_USERS['user1'],
    content: 'I have a hot stock tip that will make you rich.',
    timestamp: Date.now() - 1000 * 60 * 5,
    isLocked: true,
    price: 20,
    unlockedBy: [],
    imageData: placeholderImages[1].url,
  },
  {
    id: 'msg5',
    channelId: 'stock-tips',
    author: MOCK_USERS['user2'],
    content: "Is it about GME?",
    timestamp: Date.now() - 1000 * 60 * 4,
    isLocked: false,
    price: 0,
    unlockedBy: [],
  },
  {
    id: 'msg6',
    channelId: 'payments',
    author: MOCK_USERS['user3'],
    content: 'How do payments work on this app?',
    timestamp: Date.now() - 1000 * 60 * 2,
    isLocked: false,
    price: 0,
    unlockedBy: [],
  },
  {
    id: 'msg7',
    channelId: 'crypto',
    author: MOCK_USERS['user1'],
    content: 'Here is another one for just 5 bucks!',
    timestamp: Date.now() - 1000 * 60 * 1,
    isLocked: true,
    price: 5,
    unlockedBy: [],
    imageData: placeholderImages[2].url,
  },
];

export const TRANSACTIONS: Transaction[] = [
    {
        id: 'txn1',
        type: 'deposit',
        amount: 100,
        description: 'Initial deposit',
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
    },
    {
        id: 'txn2',
        type: 'purchase',
        amount: -20,
        description: 'Unlocked message in #stock-tips',
        timestamp: Date.now() - 1000 * 60 * 3,
    }
]
