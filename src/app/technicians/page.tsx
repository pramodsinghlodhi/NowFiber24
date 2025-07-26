
"use client";

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { mockTechnicians, Technician } from '@/lib/data';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function TechniciansPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (user.role !== 'Admin') {
            router.push('/');
        }
    }, [user, router]);

    if (!user || user.role !== 'Admin') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Unauthorized. Redirecting...</p>
            </div>
        );
    }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Field Technicians</CardTitle>
                    <CardDescription>Manage and monitor your field engineering team.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Current Location</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockTechnicians.map((tech: Technician) => (
                                <TableRow key={tech.id}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={`https://i.pravatar.cc/150?u=${tech.id}`} alt={tech.name} />
                                            <AvatarFallback>{tech.name.substring(0,2)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{tech.name}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={tech.onDuty ? 'default' : 'secondary'} className={cn(tech.onDuty && 'bg-green-500 text-primary-foreground hover:bg-green-600')}>{tech.onDuty ? 'On Duty' : 'Off Duty'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {tech.lat}, {tech.lng}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
