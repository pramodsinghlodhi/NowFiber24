
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
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const getStatusBadge = (tech: Technician) => {
    if (!tech.onDuty) {
        return <Badge variant="secondary">Off Duty</Badge>;
    }
    switch (tech.status) {
        case 'available':
            return <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-400">Available</Badge>;
        case 'on-task':
            return <Badge variant="default">On Task</Badge>;
        case 'on-break':
            return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-400">On Break</Badge>;
        default:
            return <Badge variant="outline">Unknown</Badge>;
    }
}


export default function TechniciansPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (user.role !== 'Admin') {
            router.push('/');
        }
    }, [user, router]);

    const handleDelete = (techId: string) => {
        toast({
            title: `Deleted Technician ${techId}`,
            description: "In a real app, this would remove the technician from the database.",
            variant: "destructive"
        })
    }

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
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Field Technicians</CardTitle>
                        <CardDescription>Manage and monitor your field engineering team.</CardDescription>
                    </div>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Technician
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Duty Status</TableHead>
                                <TableHead>Current Activity</TableHead>
                                <TableHead>Current Location</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                       {getStatusBadge(tech)}
                                    </TableCell>
                                    <TableCell>
                                        {tech.onDuty ? `${tech.lat}, ${tech.lng}` : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(tech.id)}>
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
