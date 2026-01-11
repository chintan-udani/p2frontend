"use client";

import { useEffect, useRef, useState } from 'react';
import type { Message as MessageType } from '@/lib/types';
import { Message } from './message';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MessageListProps {
  messages: MessageType[];
}

export function MessageList({ messages }: MessageListProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollViewportElementRef = useRef<Element | null>(null);

  // Check if user is at the bottom of the scroll area
  const checkIfAtBottom = (element: Element) => {
    const threshold = 100; // pixels from bottom to consider "at bottom"
    const { scrollTop, scrollHeight, clientHeight } = element;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < threshold;
  };

  // Set up scroll listener to track user's scroll position
  useEffect(() => {
    const scrollViewport = scrollViewportRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    scrollViewportElementRef.current = scrollViewport || null;

    if (!scrollViewport) return;

    const handleScroll = () => {
      const atBottom = checkIfAtBottom(scrollViewport);
      setIsAtBottom(atBottom);

      // After first user interaction, it's no longer initial load
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    };

    scrollViewport.addEventListener('scroll', handleScroll);
    return () => scrollViewport.removeEventListener('scroll', handleScroll);
  }, [isInitialLoad]);

  // Auto-scroll to bottom only when appropriate
  useEffect(() => {
    const scrollViewport = scrollViewportElementRef.current;

    if (!scrollViewport) return;

    // Only auto-scroll if:
    // 1. It's the initial load, OR
    // 2. User is already at/near the bottom
    if (isInitialLoad || isAtBottom) {
      scrollViewport.scrollTo({
        top: scrollViewport.scrollHeight,
        behavior: isInitialLoad ? 'smooth' : 'smooth',
      });

      // Mark initial load as complete after first scroll
      if (isInitialLoad) {
        setTimeout(() => setIsInitialLoad(false), 500);
      }
    }
  }, [messages, isAtBottom, isInitialLoad]);

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
