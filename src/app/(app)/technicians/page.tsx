

"use client";

import { Technician, User } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserX, UserCheck, BarChart2, Edit, Trash, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TechnicianForm from '@/components/technicians/technician-form';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const getActivityBadge = (tech: Technician) => {
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
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const techniciansQuery = useMemo(() => query(collection(db, 'technicians')), []);
    const usersQuery = useMemo(() => query(collection(db, 'users')), []);

    const { data: technicians, loading: loadingTechs } = useFirestoreQuery<Technician>(techniciansQuery);
    const { data: users, loading: loadingUsers } = useFirestoreQuery<User>(usersQuery);

    useEffect(() => {
        if (!authLoading && !currentUser) {
            router.push('/login');
            return;
        }
        if (!authLoading && currentUser?.role !== 'Admin') {
            router.push('/');
        }
    }, [currentUser, authLoading, router]);

    const handleDelete = async (tech: Technician) => {
        if (!window.confirm(`Are you sure you want to delete ${tech.name}? This will permanently remove their login and data.`)) return;

        try {
            const response = await fetch('/api/deleteUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ techId: tech.id }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: `Deleted Technician`,
                    description: result.message,
                    variant: "destructive"
                });
            } else {
                 toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            console.error("Error deleting technician: ", error);
            toast({ title: "Network Error", description: "Could not delete technician. Please check your connection.", variant: "destructive" });
        }
    }

    const handleSave = async (techData: Omit<Technician, 'id'> & { id: string }, userData: Omit<User, 'uid' | 'id'> & { id: string; password?: string }) => {
        const isEditing = !!selectedTechnician;
        
        try {
            const response = await fetch('/api/upsertUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isEditing, techData, userData, oldTechId: selectedTechnician?.id }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({ title: result.title, description: result.message });
                setIsFormOpen(false);
                setSelectedTechnician(null);
            } else {
                 toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            console.error("Error saving technician: ", error);
            toast({ title: "Network Error", description: "Could not save technician. Please check your connection.", variant: "destructive" });
        }
    }
    
    const handleToggleBlock = async (techId: string) => {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("id", "==", techId));
        
        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                toast({ title: "Error", description: "User profile not found.", variant: "destructive" });
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userToToggle = { uid: userDoc.id, ...userDoc.data() } as User;
            const userDocRef = doc(db, 'users', userToToggle.uid);
            
            const isBlocked = !userToToggle.isBlocked;
            await updateDoc(userDocRef, { isBlocked: isBlocked });

            toast({
                title: `Technician ${isBlocked ? 'Blocked' : 'Unblocked'}`,
                description: `${userToToggle.name}'s access has been ${isBlocked ? 'revoked' : 'restored'}.`,
            });
        } catch (error) {
            console.error("Error toggling block status: ", error);
            toast({ title: "Error", description: "Could not update technician status.", variant: "destructive"});
        }
    }

    const handleAddNew = () => {
        setSelectedTechnician(null);
        setIsFormOpen(true);
    }

    const handleEdit = (tech: Technician) => {
        setSelectedTechnician(tech);
        setIsFormOpen(true);
    }

    const renderBlockUnblockAction = (tech: Technician): ReactNode => {
        const techUser = users.find(u => u.id === tech.id);
        if (!techUser) return null; // Safety check

        if (techUser.isBlocked) {
            return (
                <DropdownMenuItem onClick={() => handleToggleBlock(tech.id)}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Unblock Access
                </DropdownMenuItem>
            );
        } else {
            return (
                <DropdownMenuItem className="text-destructive" onClick={() => handleToggleBlock(tech.id)}>
                    <UserX className="mr-2 h-4 w-4" />
                    Block Access
                </DropdownMenuItem>
            );
        }
    }
    
    const loading = loadingTechs || loadingUsers || authLoading;

    if (!currentUser || loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

  return (
    <>
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Field Technicians</CardTitle>
                        <CardDescription>Manage and monitor your field engineering team.</CardDescription>
                    </div>
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
                                                <DropdownMenuItem onClick={() => handleEdit(tech)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/technicians/${tech.id}/report`)}>
                                                    <BarChart2 className="mr-2 h-4 w-4" />
                                                    View Report
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator/>
                                                {renderBlockUnblockAction(tech)}
                                                <DropdownMenuSeparator/>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(tech)}>
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
                                        {getActivityBadge(tech)}
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
                                <TableHead>Activity</TableHead>
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
                                       {getActivityBadge(tech)}
                                    </TableCell>
                                    <TableCell>
                                        {tech.isActive && typeof tech.lat === 'number' && typeof tech.lng === 'number' ? `${tech.lat.toFixed(4)}, ${tech.lng.toFixed(4)}` : 'N/A'}
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
                                                <DropdownMenuItem onClick={() => handleEdit(tech)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/technicians/${tech.id}/report`)}>
                                                    <BarChart2 className="mr-2 h-4 w-4" />
                                                    View Report
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {renderBlockUnblockAction(tech)}
                                                <DropdownMenuSeparator/>
                                                 <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(tech)}>
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
       <TechnicianForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSave}
            technician={selectedTechnician}
            allUsers={users}
        />
    </>
  );
}
