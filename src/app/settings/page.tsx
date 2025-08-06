'use client';

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
import {Loader2, Map, Bell, HardHat, Send, Network} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { mockNotifications, Notification } from '@/lib/notifications';

export default function SettingsPage() {
  const {user} = useAuth();
  const router = useRouter();
  const {toast} = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingSnmp, setIsTestingSnmp] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<Notification['type']>('System');

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
      description: 'This will check a single faulty device and create an alert.',
    });
    try {
      const results = await runAutoFaultDetection();
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
          description: 'No new faults were detected on the monitored device.',
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
  
  const handleTestSnmp = () => {
    setIsTestingSnmp(true);
    setTimeout(() => {
        setIsTestingSnmp(false);
        toast({ title: 'SNMP Test Successful', description: 'Successfully connected to a test device via SNMP.'});
    }, 1500)
  }

  const handleBroadcast = () => {
    if (!broadcastMessage) {
        toast({ title: 'Message is empty', description: 'Please enter a message to broadcast.', variant: 'destructive' });
        return;
    }
    setIsBroadcasting(true);
    setTimeout(() => {
        const newNotification: Notification = {
            id: mockNotifications.length + 1,
            type: broadcastType,
            message: broadcastMessage,
            read: false,
            timestamp: new Date().toISOString(),
        };
        mockNotifications.unshift(newNotification);
        setBroadcastMessage('');
        setIsBroadcasting(false);
        toast({
            title: 'Broadcast Sent!',
            description: 'Your message has been sent to all users.',
        });
    }, 1000);
  }

  if (!user || user.role !== 'Admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Unauthorized. Redirecting...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-sm -mx-4 px-4 py-2 -mt-2 border-b mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage application settings and integrations. (Admin only)</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
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
                        'Run Test Scan'
                    )}
                    </Button>
                </div>
                </div>
            </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'><Network/> SNMP Configuration</CardTitle>
                    <CardDescription>Configure settings for network device monitoring via SNMP.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="snmp-monitoring" className="text-base">
                            Enable SNMP Monitoring
                            </Label>
                            <p className="text-sm text-muted-foreground">
                            Use SNMP to poll devices for detailed status and metrics.
                            </p>
                        </div>
                        <Switch id="snmp-monitoring" defaultChecked />
                    </div>

                     <div className="space-y-2">
                        <Label htmlFor="snmp-community">SNMP Community String</Label>
                        <Input id="snmp-community" type="password" defaultValue="public" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="snmp-port">SNMP Port</Label>
                            <Input id="snmp-port" type="number" defaultValue="161" />
                        </div>
                         <div>
                            <Label>Test Connection</Label>
                            <Button variant="outline" className="w-full mt-2" onClick={handleTestSnmp} disabled={isTestingSnmp}>
                            {isTestingSnmp ? (
                                <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing...
                                </>
                            ) : (
                                'Test SNMP Connection'
                            )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'><Send/> Broadcast Message</CardTitle>
                    <CardDescription>Send a notification to all users of the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="broadcast-message">Message</Label>
                        <Textarea id="broadcast-message" placeholder="Enter your announcement..." value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} />
                    </div>
                    <div className="flex items-end gap-4">
                         <div className="space-y-2 flex-1">
                            <Label htmlFor="broadcast-type">Type</Label>
                            <Select value={broadcastType} onValueChange={(v) => setBroadcastType(v as any)}>
                            <SelectTrigger id="broadcast-type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="System">System Update</SelectItem>
                                <SelectItem value="New Alert">Announcement</SelectItem>
                                <SelectItem value="Task Assigned">Urgent</SelectItem>
                            </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleBroadcast} disabled={isBroadcasting}>
                            {isBroadcasting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send/>}
                            Send Broadcast
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><Bell/> Notification Preferences</CardTitle>
                <CardDescription>Manage how alerts are sent to technicians and administrators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="sms-notifications" className="text-base">Enable SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send alerts via SMS to assigned technicians.</p>
                    </div>
                    <Switch id="sms-notifications" defaultChecked />
                </div>
                 <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="email-notifications" className="text-base">Enable Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send detailed alert emails to admins.</p>
                    </div>
                    <Switch id="email-notifications" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="alert-template">SMS Alert Template</Label>
                    <Textarea id="alert-template" placeholder="e.g., [ALERT] Device {deviceId} offline. Please investigate." defaultValue="ALERT: Device {deviceId} at {location} is offline. Issue: {issue}. Assigned to you."/>
                    <p className="text-xs text-muted-foreground">Use variables: {`{deviceId}`}, {`{deviceType}`}, {`{issue}`}, {`{location}`}.</p>
                </div>
            </CardContent>
            </Card>
        </div>
        
        <div className='space-y-6'>
             <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'><HardHat/> Technician & Task Management</CardTitle>
                    <CardDescription>Configure rules and requirements for field operations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="geofence-radius">Geo-fence Radius (meters)</Label>
                        <Input id="geofence-radius" type="number" defaultValue="100" placeholder="e.g., 100" />
                        <p className="text-xs text-muted-foreground">Distance from job site a tech must be within to check-in.</p>
                    </div>
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="proof-of-work" className="text-base">Require Photo for Task Completion</Label>
                            <p className="text-sm text-muted-foreground">Technicians must upload a photo to mark a task as complete.</p>
                        </div>
                        <Switch id="proof-of-work" defaultChecked/>
                    </div>
                     <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="gps-tracking" className="text-base">Enable Real-time GPS Tracking</Label>
                            <p className="text-sm text-muted-foreground">Track on-duty technician locations every 30 seconds.</p>
                        </div>
                        <Switch id="gps-tracking" defaultChecked/>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'><Map/> Map Display Settings</CardTitle>
                    <CardDescription>Customize the appearance of the GIS Network Visualizer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                        <Label htmlFor="map-style">Default Map Style</Label>
                        <Select defaultValue="streets">
                        <SelectTrigger id="map-style">
                            <SelectValue placeholder="Select map style" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="streets">Streets</SelectItem>
                            <SelectItem value="satellite">Satellite</SelectItem>
                            <SelectItem value="terrain">Terrain</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="show-fiber-paths" className="text-base">Show Fiber Paths</Label>
                            <p className="text-sm text-muted-foreground">Display fiber optic cable routes on the map.</p>
                        </div>
                        <Switch id="show-fiber-paths" defaultChecked />
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
                <Input id="sms-api-key" type="password" placeholder="Enter your SMS provider API key" />
                </div>
                <div className="space-y-2">
                <Label htmlFor="map-api-key">Advanced Mapping API Key</Label>
                <Input id="map-api-key" type="password" placeholder="Enter your mapping provider API key (optional)" />
                </div>
            </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
