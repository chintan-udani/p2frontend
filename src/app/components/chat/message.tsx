
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import type { Message as MessageType } from '@/lib/types';
import { useAuth, useChat } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Lock, User, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnlockModal } from './unlock-modal';
import { apiGet } from '@/lib/api/client';
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

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const { user } = useAuth();
  const { isMessageUnlocked } = useChat();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [statsUnlocked, setStatsUnlocked] = useState<Array<{ id: string; username?: string; email?: string }>>([]);
  const [statsNotUnlocked, setStatsNotUnlocked] = useState<Array<{ id: string; username?: string; email?: string }>>([]);

  const isAuthor = user?.uid === message.author.uid;
  const isUnlocked = !message.isLocked || isAuthor || isMessageUnlocked(message.id) || Boolean(message.content);

  const handleUnlockClick = () => {
    if (!isUnlocked) {
      setIsModalOpen(true);
    }
  };
  
  const hasContent = message.content && message.content.trim().length > 0;

  return (
    <div className={cn('flex items-start gap-3 animate-in fade-in duration-300', isAuthor ? 'justify-end' : 'justify-start')}>
      {!isAuthor && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('max-w-md space-y-1', isAuthor ? 'items-end flex flex-col' : '')}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {!isAuthor && <span className="font-semibold text-foreground">{message.author.name}</span>}
          <span>{formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}</span>
        </div>
        
        <div
          className={cn(
            'relative rounded-lg text-sm',
            isAuthor ? 'bg-primary text-primary-foreground' : 'bg-card',
            hasContent && 'px-3 py-2',
            message.imageData && 'p-1',
            !isUnlocked && 'cursor-pointer hover:bg-accent/20 transition-colors',
          )}
          onClick={handleUnlockClick}
        >
          {isUnlocked ? (
            <>
              {message.imageData && (
                <div className="relative w-64 h-64">
                  <Image src={message.imageData} alt="Message image" fill className="rounded-md object-cover" />
                </div>
              )}
              {hasContent && <p className={cn(message.imageData && "p-2")}>{message.content}</p>}
            </>
          ) : (
            <div className={cn("relative", message.imageData ? "w-64 h-64" : "")}>
              {message.imageData && (
                <Image src={message.imageData} alt="Locked content" fill className="rounded-md object-cover blur-md" />
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2 bg-black/40 text-white px-3 py-2 rounded-md">
                  <Lock className="h-4 w-4" />
                  <span>Locked • ${message.price}</span>
                </div>
              </div>
              {!message.imageData && hasContent && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                  <p className="select-none text-transparent blur-sm p-2">{message.content}</p>
                </div>
              )}
            </div>
          )}
        </div>
        {message.isLocked && user?.role === 'admin' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isAuthor && (
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Locked for ${message.price}</span>
                    </div>
                )}
                <button
                  className="flex items-center gap-1 hover:underline"
                  onClick={async () => {
                    setIsStatsOpen(true);
                    try {
                      const data = await apiGet<{ messages: Array<any> }>(`/messages/${message.channelId}`);
                      const found = data.messages.find((m) => (m.id || m._id) === message.id);
                      if (found) {
                        const u = found.unlockedByUsers || [];
                        const n = found.notUnlockedUsers || [];
                        setStatsUnlocked(u.map((x: any) => ({ id: String(x.id || x._id || x), username: x.username, email: x.email })));
                        setStatsNotUnlocked(n.map((x: any) => ({ id: String(x.id || x._id || x), username: x.username, email: x.email })));
                      } else {
                        setStatsUnlocked(message.unlockedBy.map((uid) => ({ id: uid })));
                        setStatsNotUnlocked([]);
                      }
                    } catch {
                      setStatsUnlocked(message.unlockedBy.map((uid) => ({ id: uid })));
                      setStatsNotUnlocked([]);
                    }
                  }}
                >
                  <Users className="h-3 w-3" />
                  <span>Unlocked by {message.unlockedBy.length} users</span>
                </button>
            </div>
        )}
      </div>
      {isAuthor && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      <UnlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={message}
      />
      <AlertDialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock stats</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <div>
                  <span className="font-semibold">Unlocked:</span>{' '}
                  {(statsUnlocked && statsUnlocked.length) || (message.unlockedByUsers ? message.unlockedByUsers.length : message.unlockedBy.length)}
                </div>
                <div>
                  <span className="font-semibold">Not unlocked:</span>{' '}
                  {(statsNotUnlocked && statsNotUnlocked.length) || (message.notUnlockedUsers ? message.notUnlockedUsers.length : 0)}
                </div>
                <div>
                  <span className="font-semibold">Users who unlocked:</span>
                  <ul className="mt-2 list-disc list-inside">
                    {(statsUnlocked && statsUnlocked.length > 0) ? (
                      statsUnlocked.map((u) => (
                        <li key={u.id}>{u.username || u.email || u.id}</li>
                      ))
                    ) : (message.unlockedByUsers && message.unlockedByUsers.length > 0) ? (
                      message.unlockedByUsers.map((u) => (
                        <li key={u.id}>{u.username || u.email || u.id}</li>
                      ))
                    ) :  (
                      <li className="italic text-muted-foreground">Details not available</li>
                    )}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold">Users who have not unlocked:</span>
                  <ul className="mt-2 list-disc list-inside">
                    {(statsNotUnlocked && statsNotUnlocked.length > 0) ? (
                      statsNotUnlocked.map((u) => (
                        <li key={u.id}>{u.username || u.email || u.id}</li>
                      ))
                    ) : (message.notUnlockedUsers && message.notUnlockedUsers.length > 0) ? (
                      message.notUnlockedUsers.map((u) => (
                        <li key={u.id}>{u.username || u.email || u.id}</li>
                      ))
                    ) : (
                      <li className="italic text-muted-foreground">None or details not available</li>
                    )}
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => setIsStatsOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
