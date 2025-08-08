
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/icons/logo';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';

const auth = getAuth(app);

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
        router.push('/dashboard');
    }
  }, [user, loading, router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const email = `${userId}@fibervision.com`;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        router.push('/dashboard');

    } catch (error: any) {
        console.error("Login Error:", error);
        let errorMessage = 'Invalid User ID or Password.';
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
             errorMessage = 'Invalid User ID or Password.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
        setIsLoading(false);
    }
  };

  if (loading || user) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <p>Loading...</p>
          </div>
      )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <Logo className="w-12 h-12 text-primary" />
            </div>
          <CardTitle className="text-2xl font-headline">NowFiber24 Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard.
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
                 <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
