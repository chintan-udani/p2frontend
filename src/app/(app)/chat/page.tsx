"use client";

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@/lib/hooks';
import { MessageList } from '@/app/components/chat/message-list';
import { MessageInput } from '@/app/components/chat/message-input';
 

export default function ChatPage() {
  const searchParams = useSearchParams();
  const { messages, channels, typingUsers, connectToChannel } = useChat();

  const paramChannelId = searchParams.get('channel');
  const currentChannelId = useMemo(() => {
    if (paramChannelId && channels.some(c => c.id === paramChannelId)) {
      return paramChannelId;
    }
    return channels.length ? channels[0].id : null;
  }, [paramChannelId, channels]);

  

  const currentChannel = useMemo(
    () => channels.find(c => c.id === currentChannelId) || channels[0],
    [channels, currentChannelId]
  );
  
  const filteredMessages = useMemo(
    () => messages.filter(msg => msg.channelId === currentChannelId),
    [messages, currentChannelId]
  );
  
  const currentTypingUsers = currentChannelId ? (typingUsers[currentChannelId] || []) : [];

  return (
    <div className="flex h-full flex-col">
      <MessageList messages={filteredMessages} />
      {currentChannelId && (
        <MessageInput channelId={currentChannelId} typingUsers={currentTypingUsers} />
      )}
    </div>
  );
}
