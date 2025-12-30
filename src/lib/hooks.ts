
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AppUser, Channel, Message, Transaction } from './types';
import { CHANNELS, MESSAGES, TRANSACTIONS, MOCK_USERS } from './mock-data';
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from '@/lib/api/client';

export interface AppContextType {
  // Auth
  user: AppUser | null;
  loading: boolean;
  register: (email: string, pass: string, username: string) => Promise<any>;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;

  // Wallet
  walletBalance: number;
  transactions: Transaction[];
  addFunds: (amount: number) => void;
  unlockMessage: (messageId: string, price: number) => Promise<boolean>;

  // Chat
  channels: Channel[];
  messages: Message[];
  sendMessage: (channelId: string, content: string, isLocked: boolean, price: number, imageData?: string | null) => void;
  isMessageUnlocked: (messageId: string) => boolean;
  typingUsers: { [channelId: string]: string[] };
  connectToChannel: (channelId: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

export const useAuth = () => {
  const { user, loading, register, login, logout } = useAppContext();
  return { user, loading, register, login, logout };
};

export const useWallet = () => {
  const { walletBalance, transactions, addFunds, unlockMessage } = useAppContext();
  return { walletBalance, transactions, addFunds, unlockMessage };
};

export const useChat = () => {
  const { channels, messages, sendMessage, isMessageUnlocked, typingUsers, connectToChannel } = useAppContext();
  return { channels, messages, sendMessage, isMessageUnlocked, typingUsers, connectToChannel };
};

export const useAppProvider = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // --- Wallet State ---
  const [walletBalance, setWalletBalance] = useState(100);
  const [transactions, setTransactions] = useState<Transaction[]>(TRANSACTIONS);

  // --- Chat State ---
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unlockedMessages, setUnlockedMessages] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<{ [channelId: string]: string[] }>({});
  const [connectedChannelId, setConnectedChannelId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const connectedChannelIdRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  let wsBase = API_BASE_URL.replace('0.0.0.0', 'localhost');

  const WS_BASE_URL = wsBase.replace(/^http(s?):\/\//, (_, s) => `ws${s ? 's' : ''}://`);


  function toAppMessage(apiMsg: { id?: string; _id?: string; channel: string; sender: { id?: string; _id?: string; username?: string; role?: string }; content: string | null; createdAt: string | number | Date; isLocked?: boolean; lockPrice?: number; imageData?: string | null; unlockedByIds?: string[]; unlockedByUsers?: Array<{ id: string; username?: string; email?: string }>; notUnlockedUsers?: Array<{ id: string; username?: string; email?: string }> }): Message {
    return {
      id: apiMsg.id || (apiMsg as any)._id || String(Date.now()),
      channelId: String(apiMsg.channel),
      author: {
        uid: apiMsg.sender?.id || (apiMsg.sender as any)._id || '',
        name: apiMsg.sender?.username || 'Unknown',
      },
      content: apiMsg.content || '',
      imageData: apiMsg.imageData || null,
      timestamp:
        apiMsg.createdAt instanceof Date
          ? apiMsg.createdAt.getTime()
          : typeof apiMsg.createdAt === 'string'
            ? new Date(apiMsg.createdAt).getTime()
            : Number(apiMsg.createdAt),
      isLocked: !!apiMsg.isLocked,
      price: Number(apiMsg.lockPrice || 0),
      unlockedBy: Array.isArray(apiMsg.unlockedByIds) ? apiMsg.unlockedByIds : [],
      unlockedByUsers: apiMsg.unlockedByUsers,
      notUnlockedUsers: apiMsg.notUnlockedUsers,
    };
  }

  function toAppUser(apiUser: { id: string; email?: string; username?: string; role?: string; balance?: number; status?: string }): AppUser {
    return {
      uid: apiUser.id,
      email: apiUser.email || '',
      username: apiUser.username || '',
      role: (apiUser.role as any) || 'user',
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      providerId: 'custom',
      tenantId: null,
      delete: async () => { },
      getIdToken: async () => '',
      getIdTokenResult: async () => ({} as any),
      reload: async () => { },
      toJSON: () => ({}),
      photoURL: null,
      displayName: apiUser.username || apiUser.email || null,
      phoneNumber: null,
      refreshToken: '',
    } as unknown as AppUser;
  }

  // --- Auth Effects ---
  useEffect(() => {
    // Attempt to load current user via cookie-based session
    (async () => {
      setLoading(true);
      try {
        const data = await apiGet<{ user: { id: string; email?: string; username?: string; balance?: number } }>("/auth/me");
        if (data?.user) {
          setUser(toAppUser(data.user));
          if (typeof data.user.balance !== 'undefined') {
            setWalletBalance(Number(data.user.balance) || 0);
          }
          // Load channels from backend when authenticated
          try {
            const ch = await apiGet<{ channels: Array<{ _id: string; name: string }> }>("/channels");
            setChannels(ch.channels.map(c => ({ id: c._id, name: c.name })));
          } catch { }
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Auth Methods ---
  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await apiPost<{ user: { id: string; email?: string; username?: string; balance?: number } }>("/auth/login", { email, password: pass });
      setUser(toAppUser(res.user));
      if (typeof res.user.balance !== 'undefined') {
        setWalletBalance(Number(res.user.balance) || 0);
      }
      toast({ title: "Login successful!", description: `Welcome back${res.user.username ? ", " + res.user.username : "."}` });
      return res;
    } catch (e: any) {
      toast({ variant: "destructive", title: "Login failed", description: e?.message || "Please check your credentials." });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const register = useCallback(async (email: string, pass: string, username: string) => {
    setLoading(true);
    try {
      const res = await apiPost<{ user: { id: string; email?: string; username?: string; balance?: number } }>("/auth/register", { email, username, password: pass });
      setUser(toAppUser(res.user));
      if (typeof res.user.balance !== 'undefined') {
        setWalletBalance(Number(res.user.balance) || 0);
      }
      toast({ title: "Registration successful!", description: `Welcome, ${res.user.username || res.user.email}.` });
      return res;
    } catch (e: any) {
      toast({ variant: "destructive", title: "Registration failed", description: e?.message || "Please check your details." });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await apiPost<{ ok: boolean }>("/auth/logout", {});
    } catch { }
    setUser(null);
    setWalletBalance(0);
    toast({ title: "Logged out." });
  }, [toast]);


  // --- Wallet Methods ---
  const addFunds = useCallback((amount: number) => {
    if (amount > 0) {
      setWalletBalance(prev => prev + amount);
      const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        type: 'deposit',
        amount: amount,
        description: 'Manual deposit',
        timestamp: Date.now(),
      };
      setTransactions(prev => [newTransaction, ...prev]);
      toast({ title: "Funds added", description: `$${amount.toFixed(2)} added to your wallet.` });
    }
  }, [toast]);

  const unlockMessage = useCallback(async (messageId: string, price: number) => {
    try {
      await apiPost<{ ok: boolean }>(`/messages/${messageId}/unlock`, {});
      setUnlockedMessages(prev => new Set(prev).add(messageId));
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, unlockedBy: [...msg.unlockedBy, user?.uid ?? 'unknown'] }
          : msg
      ));
      try {
        const wb = await apiGet<{ balance: number; transactions?: any[] }>(`/wallet/balance`);
        setWalletBalance(Number(wb.balance) || 0);
      } catch { }
      toast({ title: "Message unlocked!", description: `You can now view the message.` });
      return true;
    } catch (e: any) {
      const status = (e && e.status) || 0;
      if (status === 402) {
        toast({ variant: "destructive", title: "Insufficient funds", description: "Please add more funds to your wallet." });
      } else {
        toast({ variant: "destructive", title: "Unlock failed", description: e?.message || "Unable to unlock message." });
      }
      return false;
    }
  }, [user, toast]);

  // --- Chat Methods ---
  const isMessageUnlocked = useCallback((messageId: string) => {
    return unlockedMessages.has(messageId);
  }, [unlockedMessages]);

  const sendMessage = useCallback((channelId: string, content: string, isLocked: boolean, price: number, imageData: string | null = null) => {
    if (!user) return;
    // Persist via backend; websocket will broadcast to all subscribers
    (async () => {
      try {
        const payloadContent = content.trim().length ? content.trim() : (imageData ? ' ' : '');
        const res = await apiPost<{ message: any }>(`/messages/${channelId}`, {
          content: payloadContent,
          isLocked,
          lockPrice: isLocked ? price : 0,
          imageData,
        });
        // Optimistically add to local state so sender sees it immediately
        const serverMsg = res?.message || {};
        const optimistic = toAppMessage({
          id: serverMsg._id || serverMsg.id || String(Date.now()),
          channel: serverMsg.channel || channelId,
          sender: { id: user.uid, username: user.username || user.email || 'You' },
          content: serverMsg.content ?? payloadContent,
          createdAt: serverMsg.createdAt || Date.now(),
          isLocked: !!(serverMsg.isLocked ?? isLocked),
          lockPrice: Number(serverMsg.lockPrice ?? (isLocked ? price : 0)),
          imageData: imageData || serverMsg.imageData || null,
        });
        setMessages(prev => {
          // Avoid duplicate if it already exists
          if (prev.some(m => m.id === optimistic.id)) return prev;
          return [...prev, optimistic];
        });
      } catch (e) {
        // Optionally could toast error
      }
    })();
  }, [user]);

  // Cleanup WebSocket and polling on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { }
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // --- Real-time Simulation ---

  const connectToChannel = useCallback((channelId: string) => {
    if (connectedChannelIdRef.current === channelId && wsRef.current?.readyState === WebSocket.OPEN) return;
    connectedChannelIdRef.current = channelId;
    setConnectedChannelId(channelId);

    // Clean up existing connections
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { }
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    let wsConnectionFailed = false;

    // Load initial messages
    (async () => {
      try {
        const data = await apiGet<{ messages: Array<any> }>(`/messages/${channelId}`);
        const mapped = data.messages.map(toAppMessage);

        // Populate unlockedMessages Set with messages the current user has unlocked
        if (user?.uid) {
          setUnlockedMessages(prev => {
            const next = new Set(prev);
            mapped.forEach(msg => {
              if (msg.unlockedBy && msg.unlockedBy.includes(user.uid)) {
                next.add(msg.id);
              }
            });
            return next;
          });
        }

        setMessages(prev => [...prev.filter(m => m.channelId !== channelId), ...mapped].sort((a, b) => a.timestamp - b.timestamp));
      } catch (err) {
        console.error('Failed to load initial messages:', err);
      }
    })();

    // Start polling fallback (will be cleared if WebSocket connects successfully)
    const startPolling = () => {
      if (pollingIntervalRef.current) return;
      console.log('Starting polling fallback for channel:', channelId);
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const data = await apiGet<{ messages: Array<any> }>(`/messages/${channelId}`);
          const mapped = data.messages.map(toAppMessage);

          // Update unlocked messages
          if (user?.uid) {
            setUnlockedMessages(prev => {
              const next = new Set(prev);
              mapped.forEach(msg => {
                if (msg.unlockedBy && msg.unlockedBy.includes(user.uid)) {
                  next.add(msg.id);
                }
              });
              return next;
            });
          }

          setMessages(prev => {
            const filtered = prev.filter(m => m.channelId !== channelId);
            return [...filtered, ...mapped].sort((a, b) => a.timestamp - b.timestamp);
          });
        } catch (err) {
          console.error('Polling failed:', err);
        }
      }, 2000); // Poll every 2 seconds
    };

    // Try WebSocket connection
    const url = `${WS_BASE_URL}/ws?channelId=${encodeURIComponent(channelId)}`;
    console.log('Attempting WebSocket connection to:', url);

    try {
      const sock = new WebSocket(url);

      sock.onopen = () => {
        console.log('WebSocket connected successfully to channel:', channelId);
        wsConnectionFailed = false;
        // Clear polling if it was started
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };

      sock.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          console.log('WebSocket message received:', data);

          if (data.event === 'message:new' && data.payload) {
            const p = data.payload;
            const m = toAppMessage({
              id: p.id || p._id,
              channel: p.channel || p.channelId || channelId,
              sender: p.sender || p.author,
              content: p.content,
              createdAt: p.createdAt || p.timestamp,
              isLocked: p.isLocked,
              lockPrice: p.lockPrice,
              imageData: p.imageData || null,
            });
            setMessages(prev => {
              if (prev.some(x => x.id === m.id)) return prev;
              return [...prev, m];
            });
          } else if (data.event === 'message:unlock' && data.payload) {
            const { messageId, userId } = data.payload;
            setMessages(prev => prev.map(x => x.id === messageId ? { ...x, unlockedBy: x.unlockedBy.includes(userId) ? x.unlockedBy : [...x.unlockedBy, userId] } : x));
            if (userId === user?.uid) {
              setUnlockedMessages(prev => {
                const next = new Set(prev);
                next.add(messageId);
                return next;
              });
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      sock.onerror = (err) => {
        console.error('WebSocket error:', err);
        wsConnectionFailed = true;
        if (!pollingIntervalRef.current) {
          startPolling();
        }
      };

      sock.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        if (!wsConnectionFailed && !pollingIntervalRef.current) {
          startPolling();
        }
      };

      // Fallback: if connection doesn't open within 5 seconds, start polling
      setTimeout(() => {
        if (sock.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket connection timed out, starting polling fallback');
          startPolling();
        }
      }, 5000);

      wsRef.current = sock;

      // Cleanup function
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      startPolling();
    }
  }, [WS_BASE_URL, user]);
  return {
    user,
    loading,
    register,
    login,
    logout,
    walletBalance,
    transactions,
    addFunds,
    unlockMessage,
    channels,
    messages,
    sendMessage,
    isMessageUnlocked,
    typingUsers,
    connectToChannel,
  };
}
