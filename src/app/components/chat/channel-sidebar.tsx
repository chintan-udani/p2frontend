"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useChat } from '@/lib/hooks';
import { apiGet, apiPost } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Hash, LogOut, User as UserIcon } from 'lucide-react';
import { Logo } from '../logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


export function ChannelSidebar() {
  const [channels, setChannels] = useState<Array<{ id: string; name: string }>>([]);
  const { user, logout } = useAuth();
  const { connectToChannel } = useChat();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentChannelId = searchParams.get('channel') || 'general';

  useEffect(() => {
    // Load channels via authenticated API call (credentials included by api client)
    (async () => {
      try {
        const res = await apiGet<{ channels: Array<{ _id: string; name: string }> }>("/channels");
        setChannels(res.channels.map(c => ({ id: c._id, name: c.name })));
      } catch (_) {
        // silently ignore; middleware will redirect unauthenticated users
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      // Hit backend to clear cookie with credentials included
      await apiPost<{ ok: boolean }>("/auth/logout", {});
    } catch (_) {
      // ignore network errors; proceed to clear local state
    }
    // Clear local auth state
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="h-16 border-b px-4 flex items-center">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 p-2">
        <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channels</p>
        {channels.map((channel) => (
          <Button
            key={channel.id}
            variant={currentChannelId === channel.id ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
            <Link href={`/chat?channel=${channel.id}`} onClick={() => connectToChannel(channel.id)}>
              <Hash className="mr-2 h-4 w-4" />
              {channel.name}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="mt-auto border-t p-2">
        <div className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50">
           <div className="flex items-center gap-2">
             <Avatar className="h-8 w-8">
                <AvatarFallback>
                    <UserIcon className="h-4 w-4" />
                </AvatarFallback>
             </Avatar>
             <span className="text-sm font-medium">{user?.username || user?.email}</span>
           </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
