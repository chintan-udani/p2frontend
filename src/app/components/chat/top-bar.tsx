"use client";

import { useAuth, useWallet } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { LogOut, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../theme-toggle';

export function TopBar() {
  const { user, logout } = useAuth();
  const { walletBalance } = useWallet();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex w-full items-center justify-end gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/wallet" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span>${walletBalance.toFixed(2)}</span>
          </Link>
        </Button>
        <ThemeToggle />
        <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
