

"use client";

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { mockTechnicians, Technician, mockUsers, User } from '@/lib/data';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash, Edit, UserX, UserCheck, BarChart2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TechnicianForm from '@/components/technicians/technician-form';

const getStatusBadge = (tech: Technician) => {
    if (!tech.isActive) {
        return <Badge variant="secondary">Inactive</Badge>;
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
    const [technicians, setTechnicians] = useState<Technician[]>(mockTechnicians);
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);


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
        setTechnicians(prev => prev.filter(t => t.id !== techId));
        setUsers(prev => prev.filter(u => u.id !== techId));
        
        const techUserIndex = mockUsers.findIndex(u => u.id === techId);
        if(techUserIndex > -1) mockUsers.splice(techUserIndex, 1);
        
        const techIndex = mockTechnicians.findIndex(t => t.id === techId);
        if(techIndex > -1) mockTechnicians.splice(techIndex, 1);

        toast({
            title: `Deleted Technician ${techId}`,
            description: "Technician has been removed from the list.",
            variant: "destructive"
        })
    }

    const handleSave = (techData: Technician, userData: User) => {
        const isEditing = !!selectedTechnician;

        if(isEditing) {
            setTechnicians(prev => prev.map(t => t.id === techData.id ? techData : t));
            const techIndex = mockTechnicians.findIndex(t => t.id === techData.id);
            if(techIndex > -1) mockTechnicians[techIndex] = techData;

            setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
            const userIndex = mockUsers.findIndex(u => u.id === userData.id);
            if(userIndex > -1) mockUsers[userIndex] = userData;

            toast({ title: "Technician Updated", description: `${techData.name}'s details have been updated.` });
        } else {
            setTechnicians(prev => [...prev, techData]);
            mockTechnicians.push(techData);

            setUsers(prev => [...prev, userData]);
            mockUsers.push(userData);

            toast({ title: "Technician Added", description: `${techData.name} has been added to the team.` });
        }
        setIsFormOpen(false);
        setSelectedTechnician(null);
    }
    
    const handleToggleBlock = (techId: string) => {
        const userToUpdate = users.find(u => u.id === techId);
        if (!userToUpdate) return;
        
        const isBlocked = !userToUpdate.isBlocked;
        
        setUsers(prev => prev.map(u => u.id === techId ? { ...u, isBlocked } : u));
        
        const userIndex = mockUsers.findIndex(u => u.id === techId);
        if(userIndex > -1) mockUsers[userIndex].isBlocked = isBlocked;

        toast({
            title: `Technician ${isBlocked ? 'Blocked' : 'Unblocked'}`,
            description: `${userToUpdate.name}'s access has been ${isBlocked ? 'revoked' : 'restored'}.`,
        });
    }

    const handleAddNew = () => {
        setSelectedTechnician(null);
        setIsFormOpen(true);
    }

    const handleEdit = (tech: Technician) => {
        setSelectedTechnician(tech);
        setIsFormOpen(true);
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
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Technician
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {technicians.map((tech) => {
                             const techUser = users.find(u => u.id === tech.id);
                             return (
                                <Card key={tech.id} className={cn("p-4", techUser?.isBlocked && 'opacity-50 bg-muted')}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                             <Avatar className={cn("h-12 w-12", techUser?.isBlocked && 'grayscale')}>
                                                <AvatarImage src={tech.avatarUrl} alt={tech.name} />
                                                <AvatarFallback>{tech.name.substring(0,2)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{tech.name}</p>
                                                <p className="text-xs text-muted-foreground">{tech.id}</p>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/technicians/${tech.id}/report`)}>
                                                    <BarChart2 className="mr-2 h-4 w-4" />
                                                    View Report
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(tech)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator/>
                                                {techUser?.isBlocked ? (
                                                    <DropdownMenuItem onClick={() => handleToggleBlock(tech.id)}>
                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                        Unblock Access
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleToggleBlock(tech.id)}>
                                                        <UserX className="mr-2 h-4 w-4" />
                                                        Block Access
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(tech.id)}>
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 mt-3 border-t">
                                        <Badge variant={tech.isActive ? 'default' : 'secondary'} className={cn(tech.isActive && 'bg-green-500 text-primary-foreground hover:bg-green-600', techUser?.isBlocked && 'bg-gray-500')}>
                                            {techUser?.isBlocked ? 'Blocked' : (tech.isActive ? 'Active' : 'Inactive')}
                                        </Badge>
                                        {getStatusBadge(tech)}
                                    </div>
                                </Card>
                             )
                        })}
                    </div>
                    {/* Desktop View */}
                    <Table className="hidden md:table">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Current Activity</TableHead>
                                <TableHead>Current Location</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {technicians.map((tech: Technician) => {
                                const techUser = users.find(u => u.id === tech.id);
                                return (
                                <TableRow key={tech.id} className={cn(techUser?.isBlocked && 'opacity-50')}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <Avatar className={cn("h-9 w-9", techUser?.isBlocked && 'grayscale')}>
                                            <AvatarImage src={tech.avatarUrl} alt={tech.name} />
                                            <AvatarFallback>{tech.name.substring(0,2)}</AvatarFallback>
                                        </Avatar>
                                        <div className='flex flex-col'>
                                            <span className="font-medium">{tech.name}</span>
                                            <span className='text-xs text-muted-foreground'>{tech.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={tech.isActive ? 'default' : 'secondary'} className={cn(tech.isActive && 'bg-green-500 text-primary-foreground hover:bg-green-600', techUser?.isBlocked && 'bg-gray-500')}>
                                            {techUser?.isBlocked ? 'Blocked' : (tech.isActive ? 'Active' : 'Inactive')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                       {getStatusBadge(tech)}
                                    </TableCell>
                                    <TableCell>
                                        {tech.isActive ? `${tech.lat.toFixed(4)}, ${tech.lng.toFixed(4)}` : 'N/A'}
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
                                                <DropdownMenuItem onClick={() => router.push(`/technicians/${tech.id}/report`)}>
                                                    <BarChart2 className="mr-2 h-4 w-4" />
                                                    View Report
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(tech)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator/>
                                                {techUser?.isBlocked ? (
                                                    <DropdownMenuItem onClick={() => handleToggleBlock(tech.id)}>
                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                        Unblock Access
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleToggleBlock(tech.id)}>
                                                        <UserX className="mr-2 h-4 w-4" />
                                                        Block Access
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(tech.id)}>
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
      </SidebarInset>
       <TechnicianForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSave}
            technician={selectedTechnician}
        />
    </SidebarProvider>
  );
}
