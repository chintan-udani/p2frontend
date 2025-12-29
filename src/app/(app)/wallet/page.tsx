"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionHistory } from '@/app/components/wallet/transaction-history';
import { DollarSign, Loader2, ArrowLeft } from 'lucide-react';

export default function WalletPage() {
  const { walletBalance, addFunds } = useWallet();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFunds = () => {
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      setIsLoading(true);
      setTimeout(() => { // Simulate network delay
        addFunds(numericAmount);
        setAmount('');
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/chat">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Chat</span>
                </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">${walletBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Available to spend on LockedChat</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Funds</CardTitle>
              <CardDescription>Top up your wallet balance instantly.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  type="number"
                  placeholder="e.g., 50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                />
                <Button onClick={handleAddFunds} disabled={isLoading || !amount}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Funds
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <TransactionHistory />
      </div>
    </div>
  );
}
