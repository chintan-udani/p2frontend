"use client";

import { useWallet } from '@/lib/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function TransactionHistory() {
  const { transactions } = useWallet();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>A record of your recent deposits and purchases.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No transactions yet.
                    </TableCell>
                </TableRow>
            ) : (
                transactions.map((tx) => (
                <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell>
                    <Badge variant={tx.type === 'deposit' ? 'default' : 'secondary'} className={cn(tx.type === 'deposit' ? 'bg-green-500/20 text-green-700 border-green-500/30' : '')}>
                        {tx.type}
                    </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(tx.timestamp), 'MMM d, yyyy')}</TableCell>
                    <TableCell className={cn("text-right font-mono", tx.amount > 0 ? 'text-green-600' : 'text-destructive')}>
                    {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
