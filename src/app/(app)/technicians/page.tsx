

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
import { MoreHorizontal, BarChart2, Trash, PlusCircle, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import TechnicianForm from '@/components/technicians/technician-form';


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
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const techniciansQuery = useMemo(() => query(collection(db, 'technicians'), orderBy('id'), limit(50)), []);
    const { data: technicians, loading: loadingTechs } = useFirestoreQuery<Technician>(techniciansQuery);

    useEffect(() => {
        if (!authLoading && !currentUser) {
            router.push('/login');
            return;
        }
        if (!authLoading && currentUser?.role !== 'Admin') {
            router.push('/');
        }
    }, [currentUser, authLoading, router]);

    const handleDeleteClick = (tech: Technician) => {
        setSelectedTechnician(tech);
        setIsDeleteAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedTechnician) return;

        try {
            const response = await fetch('/api/deleteUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ techId: selectedTechnician.id }),
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Technician Deleted",
                    description: `Technician ${selectedTechnician.name} has been permanently removed.`,
                    variant: "destructive"
                });
            } else {
                throw new Error(result.message || 'Failed to delete technician.');
            }
        } catch (error: any) {
            toast({
                title: "Error Deleting Technician",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsDeleteAlertOpen(false);
            setSelectedTechnician(null);
        }
    };

    const handleEditClick = (tech: Technician) => {
        setSelectedTechnician(tech);
        setIsFormOpen(true);
    };

    const handleAddNewClick = () => {
        setSelectedTechnician(null);
        setIsFormOpen(true);
    }
    
    const handleSave = async (techData: Technician, userData: User & { password?: string}) => {
        const isEditing = !!selectedTechnician;
        try {
            const response = await fetch('/api/upsertUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isEditing: isEditing,
                    techData: techData,
                    userData: userData,
                    oldTechId: selectedTechnician?.id
                })
            });

            const result = await response.json();
            if (result.success) {
                toast({
                    title: result.title,
                    description: result.message
                });
                setIsFormOpen(false);
                setSelectedTechnician(null);
            } else {
                 throw new Error(result.message || 'Failed to save technician.');
            }
        } catch (error: any) {
             toast({
                title: "Error Saving Technician",
                description: error.message,
                variant: "destructive"
            });
        }
    }
    
    const loading = loadingTechs || authLoading;

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
                        <CardDescription>Manage and monitor your field engineering team. Showing latest 50.</CardDescription>
                    </div>
                     <Button onClick={handleAddNewClick}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Technician
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {technicians.map((tech) => (
                            <Card key={tech.id} className={cn("p-4", tech.isBlocked && 'opacity-50 bg-muted')}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                            <Avatar className={cn("h-12 w-12", tech.isBlocked && 'grayscale')}>
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
                                             <DropdownMenuItem onClick={() => handleEditClick(tech)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push(`/technicians/${tech.id}/report`)}>
                                                <BarChart2 className="mr-2 h-4 w-4" />
                                                View Report
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(tech)}>
                                                <Trash className="mr-2 h-4 w-4" />
                                                Delete Technician
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="flex items-center justify-between pt-3 mt-3 border-t">
                                    <Badge variant={tech.isActive ? 'default' : 'secondary'} className={cn(tech.isActive && 'bg-green-500 text-primary-foreground hover:bg-green-600', tech.isBlocked && 'bg-gray-500')}>
                                        {tech.isBlocked ? 'Blocked' : (tech.isActive ? 'Active' : 'Inactive')}
                                    </Badge>
                                    {getActivityBadge(tech)}
                                </div>
                            </Card>
                        ))}
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
                            {technicians.map((tech) => (
                                <TableRow key={tech.id} className={cn(tech.isBlocked && 'opacity-50')}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <Avatar className={cn("h-9 w-9", tech.isBlocked && 'grayscale')}>
                                            <AvatarImage src={tech.avatarUrl} alt={tech.name} />
                                            <AvatarFallback>{tech.name.substring(0,2)}</AvatarFallback>
                                        </Avatar>
                                        <div className='flex flex-col'>
                                            <span className="font-medium">{tech.name}</span>
                                            <span className='text-xs text-muted-foreground'>{tech.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={tech.isActive ? 'default' : 'secondary'} className={cn(tech.isActive && 'bg-green-500 text-primary-foreground hover:bg-green-600', tech.isBlocked && 'bg-gray-500')}>
                                            {tech.isBlocked ? 'Blocked' : (tech.isActive ? 'Active' : 'Inactive')}
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
                                                <DropdownMenuItem onClick={() => handleEditClick(tech)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/technicians/${tech.id}/report`)}>
                                                    <BarChart2 className="mr-2 h-4 w-4" />
                                                    View Report
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(tech)}>
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete Technician
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
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the technician's profile, authentication account, and all associated data.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <TechnicianForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSave}
            technician={selectedTechnician}
        />
    </>
  );
}
