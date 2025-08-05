
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAuth } from '@/contexts/auth-context';
import { Infrastructure } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Circle, MoreHorizontal, PlusCircle, Trash, Edit, MapPin, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import DeviceForm from '@/components/inventory/device-form';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const getStatusIndicator = (status: Infrastructure['status']) => {
    switch (status) {
      case 'online':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-400"><Circle className="mr-2 h-2 w-2 fill-green-500 text-green-500" />Online</Badge>;
      case 'offline':
        return <Badge variant="destructive"><Circle className="mr-2 h-2 w-2 fill-white" />Offline</Badge>;
      case 'maintenance':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-400"><Circle className="mr-2 h-2 w-2 fill-yellow-500 text-yellow-500" />Maintenance</Badge>;
      case 'installed':
        return <Badge variant="secondary"><Circle className="mr-2 h-2 w-2" />Installed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

export default function InventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState<Infrastructure | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const devicesQuery = useMemo(() => collection(db, 'infrastructure'), []);
  const { data: devices, loading } = useFirestoreQuery<Infrastructure>(devicesQuery);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  const handleDelete = async (deviceId: string) => {
    if (user?.role !== 'Admin') {
        toast({ title: 'Permission Denied', description: 'You do not have permission to delete devices.', variant: 'destructive' });
        return;
    }
    try {
      await deleteDoc(doc(db, 'infrastructure', deviceId));
      toast({
          title: `Deleted Device ${deviceId}`,
          description: "Device has been removed from the inventory.",
          variant: "destructive"
      })
    } catch (error) {
        toast({ title: "Error", description: "Could not delete device."});
    }
  }

  const handleSave = async (deviceData: Omit<Infrastructure, 'id'>, isEditing: boolean) => {
    if (isEditing && selectedDevice) {
        try {
            const docRef = doc(db, 'infrastructure', selectedDevice.id);
            await updateDoc(docRef, deviceData);
            toast({ title: "Device Updated", description: `${selectedDevice.name}'s details have been updated.` });
        } catch (error) {
            console.error("Update error: ", error);
            toast({ title: "Error", description: "Could not update device.", variant: "destructive" });
        }
    } else {
        if (user?.role !== 'Admin') {
            toast({ title: 'Permission Denied', description: 'You do not have permission to add new devices.', variant: 'destructive' });
            return;
        }
        try {
            const docRef = doc(db, 'infrastructure', deviceData.id);
            await setDoc(docRef, deviceData);
            toast({ title: "Device Added", description: `Device ${deviceData.id} has been added to the inventory.` });
        } catch (error) {
            console.error("Add error: ", error);
            toast({ title: "Error", description: "Could not add new device. Is the ID unique?", variant: "destructive"});
        }
    }
    setIsFormOpen(false);
    setSelectedDevice(null);
  }

  const handleAddNew = () => {
    setSelectedDevice(null);
    setIsFormOpen(true);
  }

  const handleEdit = (device: Infrastructure) => {
    setSelectedDevice(device);
    setIsFormOpen(true);
  }

  if (!user || loading) {
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
                    <CardTitle>Network Inventory</CardTitle>
                    <CardDescription>Manage all network devices and equipment.</CardDescription>
                </div>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Device
                </Button>
            </CardHeader>
            <CardContent>
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {devices.map((device) => (
                    <Card key={device.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{device.name}</p>
                                <p className="text-sm text-muted-foreground">{device.id} | {device.type}</p>
                            </div>
                             {getStatusIndicator(device.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
                            <p className="flex items-center gap-2"><MapPin size={14}/> {device.lat.toFixed(4)}, {device.lng.toFixed(4)}</p>
                            <p className="flex items-center gap-2"><Wifi size={14}/> {device.ip || "N/A"}</p>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                             <Button variant="outline" size="sm" onClick={() => handleEdit(device)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                             {user?.role === 'Admin' && (
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(device.id)}><Trash className="mr-2 h-4 w-4" /> Delete</Button>
                             )}
                        </div>
                    </Card>
                ))}
              </div>

              {/* Desktop View */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device: Infrastructure) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.id}</TableCell>
                      <TableCell>{device.name}</TableCell>
                      <TableCell>{device.type}</TableCell>
                      <TableCell>{device.ip || "N/A"}</TableCell>
                      <TableCell>{device.lat.toFixed(4)}, {device.lng.toFixed(4)}</TableCell>
                      <TableCell>
                        {getStatusIndicator(device.status)}
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
                                <DropdownMenuItem onClick={() => handleEdit(device)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                {user.role === 'Admin' && (
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(device.id)}>
                                        <Trash className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
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
      <DeviceForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        device={selectedDevice}
      />
    </SidebarProvider>
  );
}
