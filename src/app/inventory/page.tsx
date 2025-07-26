
"use client";

import { useEffect } from 'react';
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
import { Circle } from 'lucide-react';

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

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'Admin') {
      router.push('/');
    }
  }, [user, router]);

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
            <CardHeader>
              <CardTitle>Network Inventory</CardTitle>
              <CardDescription>Manage all network devices and equipment.</CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDevices.map((device: Device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.id}</TableCell>
                      <TableCell>{device.type}</TableCell>
                      <TableCell>{device.ip || "N/A"}</TableCell>
                      <TableCell>{device.lat}, {device.lng}</TableCell>
                      <TableCell>
                        {getStatusIndicator(device.status)}
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
