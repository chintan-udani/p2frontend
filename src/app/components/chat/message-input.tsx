
"use client";

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { useChat, useWallet, useAuth } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, DollarSign, Paperclip, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';


interface MessageInputProps {
  channelId: string;
  typingUsers: string[];
}

const prices = [5, 10, 20];
const MAX_FILE_SIZE_KB = 500;

export function MessageInput({ channelId, typingUsers }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [price, setPrice] = useState<number | 'custom'>(prices[0]);
  const [customPrice, setCustomPrice] = useState(25);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  
  const { sendMessage } = useChat();
  const { walletBalance } = useWallet();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const finalPrice = price === 'custom' ? customPrice : price;
  const canAffordLock = finalPrice <= walletBalance;

  const handleSend = () => {
    if (content.trim() || imageData) {
      sendMessage(channelId, content.trim(), isLocked, isLocked ? finalPrice : 0, imageData);
      setContent('');
      setIsLocked(false);
      setPrice(prices[0]);
      setImagePreview(null);
      setImageData(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_KB * 1024) {
        toast({
          variant: 'destructive',
          title: 'Image too large',
          description: `Please select an image smaller than ${MAX_FILE_SIZE_KB}KB.`,
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImagePreview(dataUrl);
        setImageData(dataUrl);
        setIsLocked(true); // Default to locked for images
      };
      reader.readAsDataURL(file);
    }
  };

  const typingIndicatorText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    return `${typingUsers.slice(0, 2).join(', ')} and others are typing...`;
  }

  const isSendDisabled = (!content.trim() && !imageData) || (isLocked && !canAffordLock);

  return (
    <div className="border-t bg-background p-4 space-y-2">
       {imagePreview && (
        <div className="relative w-32 h-32">
          <Image src={imagePreview} alt="Image preview" fill className="rounded-md object-cover" />
           <Button
             variant="destructive"
             size="icon"
             className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
             onClick={() => {
               setImagePreview(null);
               setImageData(null);
               setIsLocked(false);
               if(fileInputRef.current) fileInputRef.current.value = "";
             }}
           >
             <X className="h-4 w-4" />
           </Button>
         </div>
       )}
      <div className="relative">
        <Textarea
          placeholder={`Message #${channelId}`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pr-20 min-h-[40px] h-10"
          rows={1}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Attach image</span>
          </Button>
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8"
            onClick={handleSend}
            disabled={isSendDisabled}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send Message</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between h-8">
        <div className="flex items-center space-x-2">
          {imageData && (
            <>
              <Checkbox id="lock-message" checked={isLocked} onCheckedChange={(checked) => setIsLocked(Boolean(checked))} />
              <Label htmlFor="lock-message" className="text-sm font-medium">
                Lock Message
              </Label>
            </>
          )}

          {isLocked && (
            <>
            <Select
              value={String(price)}
              onValueChange={(value) => setPrice(value === 'custom' ? 'custom' : Number(value))}
            >
              <SelectTrigger className={cn("h-8 w-24 ml-2", !canAffordLock && "border-destructive")}>
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                {prices.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    ${p}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {price === 'custom' && (
               <div className="relative ml-2">
                 <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   type="number"
                   value={customPrice}
                   onChange={(e) => setCustomPrice(Number(e.target.value))}
                   className={cn("h-8 w-24 pl-6", !canAffordLock && "border-destructive")}
                   placeholder="Custom"
                 />
               </div>
            )}
            </>
          )}
        </div>
        <div className="text-xs text-muted-foreground h-4">
            {!isLocked || canAffordLock ? (
                typingIndicatorText()
            ) : (
                <span className="text-destructive font-medium">Price cannot exceed balance</span>
            )}
        </div>
      </div>
    </div>
  );
}
