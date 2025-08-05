

"use client";

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Technician, User } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
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
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, doc, updateDoc, writeBatch, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';


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
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const techniciansQuery = useMemo(() => collection(db, 'technicians'), []);
    const usersQuery = useMemo(() => collection(db, 'users'), []);

    const { data: technicians, loading: loadingTechs } = useFirestoreQuery<Technician>(techniciansQuery);
    const { data: users, loading: loadingUsers } = useFirestoreQuery<User>(usersQuery);

    useEffect(() => {
        if (!currentUser) {
            router.push('/login');
            return;
        }
        if (currentUser.role !== 'Admin') {
            router.push('/');
        }
    }, [currentUser, router]);

    const handleDelete = async (tech: Technician) => {
        try {
            // In a real app, you would need a cloud function to delete the Firebase Auth user.
            // For now, we will just delete the Firestore documents.
            const batch = writeBatch(db);
            
            // Find the user document by the technician ID.
            const userQuerySnapshot = await getDocs(query(collection(db, 'users'), where('id', '==', tech.id)));
            if (!userQuerySnapshot.empty) {
                const userDocRef = userQuerySnapshot.docs[0].ref;
                batch.delete(userDocRef);
            }
            
            const techDocRef = doc(db, 'technicians', tech.id);
            batch.delete(techDocRef);

            await batch.commit();

            toast({
                title: `Deleted Technician ${tech.id}`,
                description: "Technician has been removed from the system.",
                variant: "destructive"
            });
        } catch (error) {
            console.error("Error deleting technician: ", error);
            toast({ title: "Error", description: "Could not delete technician. You may need to manually remove the user from Firebase Authentication.", variant: "destructive" });
        }
    }

    const handleSave = async (techData: Omit<Technician, 'id'> & { id: string }, userData: Omit<User, 'uid' | 'id'> & { id: string; password?: string }) => {
        const isEditing = !!selectedTechnician;
    
        if (isEditing && selectedTechnician) {
            const techUser = users.find(u => u.id === selectedTechnician.id);
            if (!techUser || !techUser.uid) {
                 toast({ title: "Error", description: "Could not find associated user to update.", variant: "destructive"});
                 return;
            }
            
            try {
                const batch = writeBatch(db);
                
                const techDocRef = doc(db, 'technicians', selectedTechnician.id);
                batch.update(techDocRef, { ...techData });
                
                const userDocRef = doc(db, 'users', techUser.uid);
                batch.update(userDocRef, { name: userData.name, avatarUrl: userData.avatarUrl });

                await batch.commit();
                toast({ title: "Technician Updated", description: `${techData.name}'s details have been updated.` });
            } catch (error) {
                console.error("Error updating technician: ", error);
                toast({ title: "Error", description: "Could not update technician.", variant: "destructive"});
            }
        } else {
            // Adding new technician
            if (!userData.password) {
                toast({title: "Missing Info", description: "Password is required for new users.", variant: "destructive"});
                return;
            }
            
            const email = `${userData.id}@fibervision.com`;
            const auth = getAuth();
            try {
                // 1. Create Firebase Auth user
                const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
                const newAuthUser = userCredential.user;

                // 2. Create user and technician documents in Firestore using a BATCH
                const batch = writeBatch(db);

                // Document in 'users' collection, using the new Auth UID as the document ID
                const userDocRef = doc(db, 'users', newAuthUser.uid);
                const finalUserData: User = { 
                    uid: newAuthUser.uid,
                    id: userData.id, 
                    name: userData.name,
                    role: 'Technician',
                    avatarUrl: userData.avatarUrl,
                    isBlocked: false,
                };
                batch.set(userDocRef, finalUserData);
                
                // Document in 'technicians' collection, using the custom tech ID as the document ID
                const techDocRef = doc(db, 'technicians', techData.id);
                batch.set(techDocRef, techData);

                // Commit the batch
                await batch.commit();

                toast({ title: "Technician Added", description: `${userData.name} has been added to the team.` });
            } catch (error: any) {
                 console.error("Error adding new technician: ", error);
                 let message = "Could not add new technician.";
                 if (error.code === 'auth/email-already-in-use') {
                     message = "This Technician ID is already in use.";
                 } else if (error.code === 'auth/weak-password') {
                     message = "The password must be at least 6 characters."
                 }
                toast({ title: "Error", description: message, variant: "destructive"});
            }
        }
        setIsFormOpen(false);
        setSelectedTechnician(null);
    }
    
    const handleToggleBlock = async (userToToggle: User) => {
        if (!userToToggle.uid) {
             toast({ title: "Error", description: "User UID not found.", variant: "destructive"});
             return;
        };
        
        const userDocRef = doc(db, 'users', userToToggle.uid);
        
        try {
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
    
    const loading = loadingTechs || loadingUsers;

    if (!currentUser || loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Loading...</p>
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
                                                {techUser && (
                                                    techUser.isBlocked ? (
                                                        <DropdownMenuItem onClick={() => handleToggleBlock(techUser)}>
                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                            Unblock Access
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleToggleBlock(techUser)}>
                                                            <UserX className="mr-2 h-4 w-4" />
                                                            Block Access
                                                        </DropdownMenuItem>
                                                    )
                                                )}
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
                                                <DropdownMenuItem onClick={() => router.push(`/technicians/${tech.id}/report`)}>
                                                    <BarChart2 className="mr-2 h-4 w-4" />
                                                    View Report
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(tech)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator/>
                                                {techUser && (
                                                    techUser.isBlocked ? (
                                                        <DropdownMenuItem onClick={() => handleToggleBlock(techUser)}>
                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                            Unblock Access
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleToggleBlock(techUser)}>
                                                            <UserX className="mr-2 h-4 w-4" />
                                                            Block Access
                                                        </DropdownMenuItem>
                                                    )
                                                )}
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
      </SidebarInset>
       <TechnicianForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSave}
            technician={selectedTechnician}
            allUsers={users}
        />
    </SidebarProvider>
  );
}
