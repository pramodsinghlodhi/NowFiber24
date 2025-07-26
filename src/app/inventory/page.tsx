
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
import { mockDevices, Device } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Circle, MoreHorizontal, PlusCircle, Trash, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import DeviceForm from '@/components/inventory/device-form';


const getStatusIndicator = (status: 'online' | 'offline' | 'maintenance') => {
    switch (status) {
      case 'online':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-400"><Circle className="mr-2 h-2 w-2 fill-green-500 text-green-500" />Online</Badge>;
      case 'offline':
        return <Badge variant="destructive"><Circle className="mr-2 h-2 w-2 fill-white" />Offline</Badge>;
      case 'maintenance':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-400"><Circle className="mr-2 h-2 w-2 fill-yellow-500 text-yellow-500" />Maintenance</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

export default function InventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
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

  const handleDelete = (deviceId: string) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    const deviceIndex = mockDevices.findIndex(d => d.id === deviceId);
    if(deviceIndex > -1) mockDevices.splice(deviceIndex, 1);

    toast({
        title: `Deleted Device ${deviceId}`,
        description: "Device has been removed from the inventory.",
        variant: "destructive"
    })
  }

  const handleSave = (deviceData: Device) => {
    const isEditing = !!selectedDevice;
    if (isEditing) {
        setDevices(prev => prev.map(d => d.id === deviceData.id ? deviceData : d));
        const deviceIndex = mockDevices.findIndex(d => d.id === deviceData.id);
        if(deviceIndex > -1) mockDevices[deviceIndex] = deviceData;
        toast({ title: "Device Updated", description: `${deviceData.id}'s details have been updated.` });
    } else {
        setDevices(prev => [...prev, deviceData]);
        mockDevices.push(deviceData);
        toast({ title: "Device Added", description: `Device ${deviceData.id} has been added to the inventory.` });
    }
    setIsFormOpen(false);
    setSelectedDevice(null);
  }

  const handleAddNew = () => {
    setSelectedDevice(null);
    setIsFormOpen(true);
  }

  const handleEdit = (device: Device) => {
    setSelectedDevice(device);
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
                    <CardTitle>Network Inventory</CardTitle>
                    <CardDescription>Manage all network devices and equipment.</CardDescription>
                </div>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Device
                </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device: Device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.id}</TableCell>
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
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(device.id)}>
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
      <DeviceForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        device={selectedDevice}
      />
    </SidebarProvider>
  );
}
