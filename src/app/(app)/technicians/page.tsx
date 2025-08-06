

"use client";

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
import { MoreHorizontal, UserX, UserCheck, BarChart2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TechnicianForm from '@/components/technicians/technician-form';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, doc, updateDoc, writeBatch, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';


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
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const techniciansQuery = useMemo(() => query(collection(db, 'technicians')), []);
    const usersQuery = useMemo(() => query(collection(db, 'users')), []);

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
            const response = await fetch('/api/deleteUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ techId: tech.id }),
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: `Deleted Technician ${tech.id}`,
                    description: result.message,
                    variant: "destructive"
                });
            } else {
                 toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            console.error("Error deleting technician: ", error);
            toast({ title: "Error", description: "Could not delete technician. A network error occurred.", variant: "destructive" });
        }
    }

    const handleSave = async (techData: Omit<Technician, 'id'> & { id: string }, userData: Omit<User, 'uid' | 'id'> & { id: string; password?: string }) => {
        const isEditing = !!selectedTechnician;
    
        if (isEditing && selectedTechnician) {
            const techUser = users.find(u => u.id === selectedTechnician.id);
            if (!techUser?.uid) { 
                 toast({ title: "Error", description: "Could not find associated user to update.", variant: "destructive"});
                 return;
            }
            
            try {
                const batch = writeBatch(db);
                
                const techDocRef = doc(db, 'technicians', selectedTechnician.id);
                batch.update(techDocRef, techData as any);
                
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
            let newAuthUser;
            try {
                // 1. Create Firebase Auth user
                const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
                newAuthUser = userCredential.user;

                // 2. Create user and technician documents in Firestore using a BATCH
                const batch = writeBatch(db);

                // Document in 'users' collection, using the new Auth UID as the document ID
                const userDocRef = doc(db, 'users', newAuthUser.uid);
                const finalUserData: User = { 
                    uid: newAuthUser.uid,
                    id: userData.id, 
                    name: userData.name,
                    role: 'Technician',
                    isBlocked: false,
                    avatarUrl: userData.avatarUrl,
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
                 } else if (error.code === 'permission-denied' || error.code === 'missing-permission') {
                     message = "Permission denied. Make sure your Firestore security rules allow this action."
                 }
                 
                 // If auth user was created but firestore failed, delete the auth user
                 if (newAuthUser) {
                    await deleteUser(newAuthUser);
                    console.log("Rolled back auth user creation due to firestore error.");
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
                                                <DropdownMenuItem onClick={() => router.push(`/technicians/${tech.id}/report`)}>
                                                    <BarChart2 className="mr-2 h-4 w-4" />
                                                    View Report
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
                                                <DropdownMenuItem onClick={() => router.push(`/technicians/${tech.id}/report`)}>
                                                    <BarChart2 className="mr-2 h-4 w-4" />
                                                    View Report
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
