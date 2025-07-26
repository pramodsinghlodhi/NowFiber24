'use client';

import {SidebarProvider, SidebarInset} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import {useAuth} from '@/contexts/auth-context';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import {runAutoFaultDetection} from '@/app/actions';
import {Loader2} from 'lucide-react';

export default function SettingsPage() {
  const {user} = useAuth();
  const router = useRouter();
  const {toast} = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'Admin') {
      router.push('/');
    }
  }, [user, router]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Settings Saved',
        description: 'Your new preferences have been saved.',
      });
    }, 1000);
  };

  const handleTestMonitoring = async () => {
    setIsTesting(true);
    toast({
      title: 'Running Automated Scan...',
      description: 'This will check all devices and create alerts for any faults found.',
    });
    try {
      const results = await runAutoFaultDetection(true);
      const faults = results.filter(r => r.alertCreated);
      if (faults.length > 0) {
        toast({
          title: `${faults.length} Fault(s) Detected!`,
          description: `Created alerts for: ${faults.map(f => f.issue?.split(' ')[1]).join(', ')}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Scan Complete',
          description: 'No new faults were detected across the network.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run the automated scan.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
              <p className="text-muted-foreground">Manage application settings and integrations. (Admin only)</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Automated Monitoring</CardTitle>
                <CardDescription>Configure the automated network health monitoring service.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-monitoring" className="text-base">
                      Enable Automated Fault Detection
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically run scans to detect and alert on offline devices.
                    </p>
                  </div>
                  <Switch id="auto-monitoring" defaultChecked />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monitoring-frequency">Monitoring Frequency</Label>
                    <Select defaultValue="15">
                      <SelectTrigger id="monitoring-frequency">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Every 5 minutes</SelectItem>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every 60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Test Monitoring</Label>
                    <Button variant="outline" className="w-full mt-2" onClick={handleTestMonitoring} disabled={isTesting}>
                      {isTesting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Running Scan...
                        </>
                      ) : (
                        'Run Full Scan Now'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>Manage API keys and endpoints for external services.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-api-key">SMS Service API Key</Label>
                  <Input id="sms-api-key" placeholder="Enter your SMS provider API key" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="map-api-key">Advanced Mapping API Key</Label>
                  <Input id="map-api-key" placeholder="Enter your mapping provider API key (optional)" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
