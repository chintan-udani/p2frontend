import { Lock } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-primary p-2 text-primary-foreground">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">LockedChat</h1>
    </div>
  );
}
