
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAuth } from '@/contexts/auth-context';
import { mockAlerts, Alert as AlertType, mockInfrastructure, Infrastructure } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

const getSeverityBadge = (severity: 'Critical' | 'High' | 'Medium' | 'Low') => {
  switch (severity) {
    case 'Critical':
      return 'destructive';
    case 'High':
      return 'secondary';
    case 'Medium':
      return 'outline';
    default:
      return 'default';
  }
};

const getSeverityClass = (severity: 'Critical' | 'High' | 'Medium' | 'Low') => {
    switch (severity) {
      case 'Critical':
        return 'border-l-4 border-destructive';
      case 'High':
        return 'border-l-4 border-orange-500';
      case 'Medium':
        return 'border-l-4 border-yellow-500';
      default:
        return 'border-l-4 border-gray-500';
    }
  };


export default function AlertsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Infrastructure | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (selectedAlert) {
      const device = mockInfrastructure.find(d => d.id === selectedAlert.device_id) || null;
      setSelectedDevice(device);
    } else {
      setSelectedDevice(null);
    }
  }, [selectedAlert]);

  if (!user) {
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
            <CardHeader>
              <CardTitle>All Alerts</CardTitle>
              <CardDescription>View and manage all network alerts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAlerts.map((alert: AlertType) => (
                    <TableRow key={alert.id} className={cn(getSeverityClass(alert.severity))}>
                      <TableCell>
                        <Badge variant={getSeverityBadge(alert.severity)} className={cn(alert.severity === 'High' && 'bg-orange-500 text-white')}>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{alert.device_id}</TableCell>
                      <TableCell>{alert.issue}</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedAlert(alert)}>View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>

       <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              Detailed information for alert #{selectedAlert?.id}.
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Issue</h4>
                <p>{selectedAlert.issue}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Device</h4>
                <p>{selectedDevice ? `${selectedDevice.name} (${selectedDevice.id})` : selectedAlert.device_id}</p>
                {selectedDevice && <p className="text-sm text-muted-foreground">IP: {selectedDevice.ip}</p>}
              </div>
               <div className="space-y-2">
                <h4 className="font-semibold">Location</h4>
                 <p className="text-sm text-muted-foreground">{selectedAlert.lat}, {selectedAlert.lng}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
