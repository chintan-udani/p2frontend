"use client";

import { useEffect, useRef } from 'react';
import type { Message as MessageType } from '@/lib/types';
import { Message } from './message';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MessageListProps {
  messages: MessageType[];
}

export function MessageList({ messages }: MessageListProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change (including after sending)
  useEffect(() => {
    // Find the actual scrollable viewport element (Radix UI ScrollArea.Viewport)
    const scrollViewport = scrollViewportRef.current?.querySelector('[data-radix-scroll-area-viewport]');

    if (scrollViewport) {
      // Scroll to the bottom smoothly
      scrollViewport.scrollTo({
        top: scrollViewport.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollViewportRef}>
      <div className="space-y-6">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
