
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAuth } from '@/contexts/auth-context';
import { Material, MaterialAssignment, Technician } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, CheckCircle, Undo2, Ban, Trash, Edit, Check, XCircle, HardHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import AssignMaterialForm from '@/components/materials/assign-material-form';
import MaterialForm from '@/components/materials/material-form';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, doc, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const getStatusBadge = (status: MaterialAssignment['status']) => {
    switch(status) {
        case 'Requested':
            return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-400">Requested</Badge>;
        case 'Pending':
            return <Badge variant="outline">Pending Issuance</Badge>;
        case 'Issued':
            return <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-400">Issued to Technician</Badge>;
        case 'Returned':
            return <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-400">Returned to Stock</Badge>;
        case 'Rejected':
            return <Badge variant="destructive">Rejected</Badge>;
        default:
            return <Badge>Unknown</Badge>;
    }
}

export default function MaterialsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAssignFormOpen, setIsAssignFormOpen] = useState(false);
  const [isMaterialFormOpen, setIsMaterialFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const { data: assignments, loading: loadingAssignments } = useFirestoreQuery<MaterialAssignment>(collection(db, 'assignments'));
  const { data: materials, loading: loadingMaterials } = useFirestoreQuery<Material>(collection(db, 'materials'));
  const { data: technicians, loading: loadingTechnicians } = useFirestoreQuery<Technician>(collection(db, 'technicians'));
  
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'Admin') {
      router.push('/');
    }
  }, [user, router]);

  const handleSaveAssignment = async (assignment: Omit<MaterialAssignment, 'id' | 'status'>) => {
    try {
        await addDoc(collection(db, 'assignments'), {
            ...assignment,
            status: 'Pending'
        });
        toast({ title: "Assignment Created", description: "The material assignment is pending issuance." });
    } catch (error) {
        toast({ title: "Error", description: "Could not create assignment." });
    }
    setIsAssignFormOpen(false);
  };

  const handleStatusChange = async (assignmentId: string, status: MaterialAssignment['status']) => {
    const docRef = doc(db, 'assignments', assignmentId);
    try {
        await updateDoc(docRef, { status });
        toast({ title: "Status Updated", description: `Assignment status has been changed to ${status}.`})
    } catch (error) {
        toast({ title: "Error", description: "Could not update status." });
    }
  }

  const handleSaveMaterial = async (materialData: Omit<Material, 'id'>, materialId?: string) => {
    const isEditing = !!materialId;
    if (isEditing) {
        try {
            const docRef = doc(db, 'materials', materialId);
            await updateDoc(docRef, materialData);
            toast({ title: "Material Updated", description: `${materialData.name}'s details have been updated.` });
        } catch (error) {
            toast({ title: "Error", description: "Could not update material." });
        }
    } else {
        try {
            const docRef = doc(db, 'materials', materialData.id);
            await setDoc(docRef, materialData);
            toast({ title: "Material Added", description: `Material ${materialData.name} has been added to stock.` });
        } catch (error) {
            toast({ title: "Error", description: "Could not add material." });
        }
    }
    setIsMaterialFormOpen(false);
    setSelectedMaterial(null);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
        await deleteDoc(doc(db, 'materials', materialId));
        toast({ title: "Material Deleted", description: "The material has been removed from stock.", variant: "destructive" });
    } catch (error) {
        toast({ title: "Error", description: "Could not delete material." });
    }
  };

  const handleAddNewMaterial = () => {
    setSelectedMaterial(null);
    setIsMaterialFormOpen(true);
  }

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setIsMaterialFormOpen(true);
  }

  const loading = loadingAssignments || loadingMaterials || loadingTechnicians;

  if (!user || user.role !== 'Admin' || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading Materials...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Available Materials</CardTitle>
                            <CardDescription>Materials and tools currently in stock.</CardDescription>
                        </div>
                         <Button size="sm" variant="outline" onClick={handleAddNewMaterial}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {materials.map(material => (
                                <div key={material.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                                    <Image src={material.imageUrl} alt={material.name} width={64} height={64} className="rounded-md" data-ai-hint="fiber optic cable"/>
                                    <div className="flex-1">
                                        <p className="font-semibold">{material.name}</p>
                                        <p className="text-sm text-muted-foreground">{material.description}</p>
                                        <p className="text-sm">In Stock: <span className="font-bold">{material.quantityInStock}</span></p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 self-start">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditMaterial(material)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteMaterial(material.id)}>
                                                <Trash className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Material Assignments</CardTitle>
                            <CardDescription>Track materials issued to and returned by technicians.</CardDescription>
                        </div>
                        <Button onClick={() => setIsAssignFormOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Assign Material
                        </Button>
                    </CardHeader>
                    <CardContent>
                         {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                        {assignments.map(assignment => {
                            const material = materials.find(m => m.id === assignment.materialId);
                            const technician = technicians.find(t => t.id === assignment.technicianId);
                            return (
                                <Card key={assignment.id} className="p-4 space-y-3">
                                    <div>
                                        <p className="font-semibold">{material?.name || 'Unknown'}</p>
                                        <p className="text-sm text-muted-foreground">Quantity: {assignment.quantityAssigned}</p>
                                    </div>
                                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <HardHat size={14}/>
                                            <span>{technician?.name || 'Unknown'}</span>
                                        </div>
                                        {getStatusBadge(assignment.status)}
                                    </div>
                                </Card>
                            )
                        })}
                        </div>
                        
                        {/* Desktop View */}
                        <Table className="hidden md:table">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Material</TableHead>
                                    <TableHead>Technician</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.map(assignment => {
                                    const material = materials.find(m => m.id === assignment.materialId);
                                    const technician = technicians.find(t => t.id === assignment.technicianId);
                                    return (
                                        <TableRow key={assignment.id}>
                                            <TableCell className="font-medium">{material?.name || 'Unknown'}</TableCell>
                                            <TableCell>{technician?.name || 'Unknown'}</TableCell>
                                            <TableCell>{assignment.quantityAssigned}</TableCell>
                                            <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                         {assignment.status === 'Requested' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleStatusChange(assignment.id, 'Pending')}>
                                                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                                                    Approve Request
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleStatusChange(assignment.id, 'Rejected')} className="text-destructive">
                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                    Reject Request
                                                                </DropdownMenuItem>
                                                            </>
                                                         )}
                                                         {assignment.status === 'Pending' && (
                                                            <DropdownMenuItem onClick={() => handleStatusChange(assignment.id, 'Issued')}>
                                                                <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                                                                Approve Issuance
                                                            </DropdownMenuItem>
                                                        )}
                                                        {assignment.status === 'Issued' && (
                                                             <DropdownMenuItem onClick={() => handleStatusChange(assignment.id, 'Returned')}>
                                                                <Undo2 className="mr-2 h-4 w-4 text-green-500" />
                                                                Confirm Return
                                                            </DropdownMenuItem>
                                                        )}
                                                        {assignment.status !== 'Requested' && (
                                                            <DropdownMenuItem className="text-destructive">
                                                                <Ban className="mr-2 h-4 w-4" />
                                                                Cancel Assignment
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
      <AssignMaterialForm 
        isOpen={isAssignFormOpen}
        onOpenChange={setIsAssignFormOpen}
        onSave={handleSaveAssignment}
        technicians={technicians}
        materials={materials}
      />
      <MaterialForm
        isOpen={isMaterialFormOpen}
        onOpenChange={setIsMaterialFormOpen}
        onSave={handleSaveMaterial}
        material={selectedMaterial}
      />
    </SidebarProvider>
  );
}
