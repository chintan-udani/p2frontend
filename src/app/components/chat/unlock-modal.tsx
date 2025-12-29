"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWallet } from '@/lib/hooks';
import type { Message } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
}

export function UnlockModal({ isOpen, onClose, message }: UnlockModalProps) {
  const { walletBalance, unlockMessage } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async () => {
    setIsLoading(true);
    const success = await unlockMessage(message.id, message.price);
    if (success) onClose();
    setIsLoading(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unlock this message?</AlertDialogTitle>
          <AlertDialogDescription>
            This will deduct <span className="font-bold">${message.price.toFixed(2)}</span> from your wallet balance.
            Your current balance is <span className="font-bold">${walletBalance.toFixed(2)}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUnlock} disabled={isLoading || walletBalance < message.price}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Unlock
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
