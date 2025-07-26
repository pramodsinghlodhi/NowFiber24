
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
import { mockMaterials, mockTechnicians, mockAssignments, Material, MaterialAssignment } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, CheckCircle, Undo2, Ban, Trash, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import AssignMaterialForm from '@/components/materials/assign-material-form';
import MaterialForm from '@/components/materials/material-form';

const getStatusBadge = (status: MaterialAssignment['status']) => {
    switch(status) {
        case 'Pending':
            return <Badge variant="outline">Pending Issuance</Badge>;
        case 'Issued':
            return <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-400">Issued to Technician</Badge>;
        case 'Returned':
            return <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-400">Returned to Stock</Badge>;
        default:
            return <Badge>Unknown</Badge>;
    }
}

export default function MaterialsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<MaterialAssignment[]>(mockAssignments);
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [isAssignFormOpen, setIsAssignFormOpen] = useState(false);
  const [isMaterialFormOpen, setIsMaterialFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'Admin') {
      router.push('/');
    }
  }, [user, router]);

  const handleSaveAssignment = (assignment: Omit<MaterialAssignment, 'id' | 'status'>) => {
    const newAssignment: MaterialAssignment = {
        id: assignments.length + 1,
        ...assignment,
        status: 'Pending'
    };
    setAssignments(prev => [newAssignment, ...prev]);
    mockAssignments.unshift(newAssignment);
    toast({ title: "Assignment Created", description: "The material assignment is pending issuance." });
    setIsAssignFormOpen(false);
  };

  const handleStatusChange = (assignmentId: number, status: MaterialAssignment['status']) => {
     setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, status } : a));
     const assignmentIndex = mockAssignments.findIndex(a => a.id === assignmentId);
     if(assignmentIndex > -1) mockAssignments[assignmentIndex].status = status;
     toast({ title: "Status Updated", description: `Assignment status has been changed to ${status}.`})
  }

  const handleSaveMaterial = (material: Material) => {
    const isEditing = !!selectedMaterial;
    if (isEditing) {
        setMaterials(prev => prev.map(m => m.id === material.id ? material : m));
        const materialIndex = mockMaterials.findIndex(m => m.id === material.id);
        if(materialIndex > -1) mockMaterials[materialIndex] = material;
        toast({ title: "Material Updated", description: `${material.name}'s details have been updated.` });
    } else {
        setMaterials(prev => [...prev, material]);
        mockMaterials.push(material);
        toast({ title: "Material Added", description: `Material ${material.name} has been added to stock.` });
    }
    setIsMaterialFormOpen(false);
    setSelectedMaterial(null);
  };

  const handleDeleteMaterial = (materialId: string) => {
    setMaterials(prev => prev.filter(m => m.id !== materialId));
    const materialIndex = mockMaterials.findIndex(m => m.id === materialId);
    if(materialIndex > -1) mockMaterials.splice(materialIndex, 1);
    toast({ title: "Material Deleted", description: "The material has been removed from stock.", variant: "destructive" });
  };

  const handleAddNewMaterial = () => {
    setSelectedMaterial(null);
    setIsMaterialFormOpen(true);
  }

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setIsMaterialFormOpen(true);
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
                        <Table>
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
                                    const material = mockMaterials.find(m => m.id === assignment.materialId);
                                    const technician = mockTechnicians.find(t => t.id === assignment.technicianId);
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
                                                         {assignment.status === 'Pending' && (
                                                            <DropdownMenuItem onClick={() => handleStatusChange(assignment.id, 'Issued')}>
                                                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                                Approve Issuance
                                                            </DropdownMenuItem>
                                                        )}
                                                        {assignment.status === 'Issued' && (
                                                             <DropdownMenuItem onClick={() => handleStatusChange(assignment.id, 'Returned')}>
                                                                <Undo2 className="mr-2 h-4 w-4 text-blue-500" />
                                                                Confirm Return
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Ban className="mr-2 h-4 w-4" />
                                                            Cancel Assignment
                                                        </DropdownMenuItem>
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
