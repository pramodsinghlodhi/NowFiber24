"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/icons/logo';
import { mockUsers } from '@/lib/data';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const success = login(userId);
      if (success) {
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        router.push('/');
      } else {
        toast({ title: 'Login Failed', description: 'Invalid User ID. Please try again.', variant: 'destructive' });
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <Logo className="w-12 h-12 text-primary" />
            </div>
          <CardTitle className="text-2xl font-headline">FiberVision Login</CardTitle>
          <CardDescription>
            Enter your User ID to access the dashboard.
            <br />
            <span className="text-xs text-muted-foreground">
                (Try: {mockUsers.map(u => u.id).join(', ')})
            </span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                id="userId"
                type="text"
                placeholder="e.g., admin or tech-001"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                />
            </div>
            </CardContent>
            <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
