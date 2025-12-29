import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/app/components/providers';
import { useAppProvider } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'LockedChat',
  description: 'Secure real-time chat with message locking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
       
          <Providers>
            {children}
            <Toaster />
          </Providers>
     
      </body>
    </html>
  );
}
