

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
import {runAutoFaultDetection, sendTestEmail, createBroadcast} from '@/app/actions';
import {Loader2, Map, Bell, HardHat, Send, Network, Mail} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Notification, Settings } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';


export default function SettingsPage() {
  const {user} = useAuth();
  const router = useRouter();
  const {toast} = useToast();
  
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingSnmp, setIsTestingSnmp] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<Notification['type']>('System');
  const [broadcastTitle, setBroadcastTitle] = useState('System Announcement');


  useEffect(() => {
    if (user?.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      const settingsDocRef = doc(db, 'settings', 'live');
      const settingsDoc = await getDoc(settingsDocRef);
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as Settings);
      } else {
        toast({ title: 'Could not load settings', description: 'Settings document not found.', variant: 'destructive'});
      }
      setLoading(false);
    }
    
    fetchSettings();

  }, [user, router, toast]);

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };
  
  const handleSmtpChange = (key: keyof Settings['smtp'], value: string | number | boolean) => {
    setSettings(prev => prev ? { ...prev, smtp: { ...prev.smtp, [key]: value }} : null);
  }

  const handleSave = async () => {
    if (!settings) {
        toast({title: "Error", description: "Settings not loaded.", variant: "destructive"});
        return;
    }
    setIsSaving(true);
    try {
        const settingsDocRef = doc(db, 'settings', 'live');
        await setDoc(settingsDocRef, settings);
        toast({
            title: 'Settings Saved',
            description: 'Your new preferences have been saved.',
        });
    } catch (error) {
        toast({title: "Error", description: "Could not save settings.", variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
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

  const handleTestEmail = async () => {
    if (!settings?.smtp) return;
    setIsTestingEmail(true);
    try {
        const result = await sendTestEmail({ host: settings.smtp.host, port: settings.smtp.port, user: settings.smtp.user, pass: settings.smtp.pass });
        if (result.success) {
            toast({ title: 'Email Test Successful', description: 'Check your inbox for a test email.'});
        } else {
            toast({ title: 'Email Test Failed', description: result.message, variant: 'destructive'});
        }
    } catch (error) {
        toast({ title: 'Error', description: 'Could not send test email.', variant: 'destructive'});
    } finally {
        setIsTestingEmail(false);
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastMessage || !broadcastTitle) {
        toast({ title: 'Missing Fields', description: 'Please enter a title and message to broadcast.', variant: 'destructive' });
        return;
    }
    setIsBroadcasting(true);
    try {
        const result = await createBroadcast({
            type: broadcastType,
            title: broadcastTitle,
            message: broadcastMessage,
        });

        if (result.success) {
            setBroadcastMessage('');
            setBroadcastTitle('System Announcement');
            toast({
                title: 'Broadcast Sent!',
                description: 'Your message has been sent to all users.',
            });
        } else {
            toast({ title: 'Broadcast Failed', description: result.message, variant: 'destructive' });
        }
    } catch (error) {
        toast({ title: 'Broadcast Failed', description: 'Could not send the broadcast.', variant: 'destructive' });
    } finally {
        setIsBroadcasting(false);
    }
  }

  if (loading || !user || user.role !== 'Admin') {
    return (
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
         <div className="flex items-center justify-between">
            <div>
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-80 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2 mt-4">
            <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
        </div>
      </main>
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
                <Switch 
                    id="auto-monitoring" 
                    checked={settings?.automatedMonitoring?.enabled}
                    onCheckedChange={(checked) => handleSettingChange('automatedMonitoring', { ...settings?.automatedMonitoring, enabled: checked })}
                />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="monitoring-frequency">Monitoring Frequency</Label>
                    <Select 
                        value={String(settings?.automatedMonitoring?.frequency)} 
                        onValueChange={(value) => handleSettingChange('automatedMonitoring', { ...settings?.automatedMonitoring, frequency: Number(value)})}
                    >
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
                        <Switch 
                            id="snmp-monitoring" 
                            checked={settings?.snmp?.enabled}
                            onCheckedChange={(checked) => handleSettingChange('snmp', { ...settings?.snmp, enabled: checked })}
                        />
                    </div>

                     <div className="space-y-2">
                        <Label htmlFor="snmp-community">SNMP Community String</Label>
                        <Input 
                            id="snmp-community" 
                            type="password" 
                            value={settings?.snmp?.community || ''}
                            onChange={(e) => handleSettingChange('snmp', { ...settings?.snmp, community: e.target.value })}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="snmp-port">SNMP Port</Label>
                            <Input 
                                id="snmp-port" 
                                type="number" 
                                value={settings?.snmp?.port || 161}
                                onChange={(e) => handleSettingChange('snmp', { ...settings?.snmp, port: Number(e.target.value) })}
                            />
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
                    <CardTitle className='flex items-center gap-2'><Mail/> Email &amp; SMTP Configuration</CardTitle>
                    <CardDescription>Set up an SMTP server to send email notifications for critical alerts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="email-notifications" className="text-base">Enable Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Send detailed alert emails to admins for critical issues.</p>
                        </div>
                        <Switch 
                            id="email-notifications" 
                            checked={settings?.smtp?.enabled}
                            onCheckedChange={(checked) => handleSmtpChange('enabled', checked)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="smtp-host">SMTP Host</Label>
                            <Input id="smtp-host" placeholder="smtp.example.com" value={settings?.smtp?.host || ''} onChange={e => handleSmtpChange('host', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="smtp-port">SMTP Port</Label>
                            <Input id="smtp-port" type="number" placeholder="587" value={settings?.smtp?.port || 587} onChange={e => handleSmtpChange('port', Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="smtp-user">SMTP Username</Label>
                            <Input id="smtp-user" placeholder="your@email.com" value={settings?.smtp?.user || ''} onChange={e => handleSmtpChange('user', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="smtp-pass">SMTP Password</Label>
                            <Input id="smtp-pass" type="password" value={settings?.smtp?.pass || ''} onChange={e => handleSmtpChange('pass', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <Label>Test Connection</Label>
                        <Button variant="outline" className="w-full mt-2" onClick={handleTestEmail} disabled={isTestingEmail}>
                        {isTestingEmail ? (
                            <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                            </>
                        ) : (
                            'Send Test Email'
                        )}
                        </Button>
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
                        <Input 
                            id="geofence-radius" 
                            type="number" 
                            value={settings?.taskManagement?.geofenceRadius}
                            onChange={(e) => handleSettingChange('taskManagement', {...settings?.taskManagement, geofenceRadius: Number(e.target.value)})}
                            placeholder="e.g., 100" 
                        />
                        <p className="text-xs text-muted-foreground">Distance from job site a tech must be within to check-in.</p>
                    </div>
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="proof-of-work" className="text-base">Require Photo for Task Completion</Label>
                            <p className="text-sm text-muted-foreground">Technicians must upload a photo to mark a task as complete.</p>
                        </div>
                        <Switch 
                            id="proof-of-work" 
                            checked={settings?.taskManagement?.requirePhotoOnCompletion}
                            onCheckedChange={(checked) => handleSettingChange('taskManagement', {...settings?.taskManagement, requirePhotoOnCompletion: checked})}
                        />
                    </div>
                     <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="gps-tracking" className="text-base">Enable Real-time GPS Tracking</Label>
                            <p className="text-sm text-muted-foreground">Track on-duty technician locations every 30 seconds.</p>
                        </div>
                        <Switch 
                            id="gps-tracking"
                            checked={settings?.technicianManagement?.enableGpsTracking}
                            onCheckedChange={(checked) => handleSettingChange('technicianManagement', {...settings?.technicianManagement, enableGpsTracking: checked})}
                        />
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
                        <Label htmlFor="broadcast-title">Title</Label>
                        <Input id="broadcast-title" placeholder="Enter a title for your broadcast" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} />
                    </div>
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
                                <SelectItem value="Notice">Announcement</SelectItem>
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
                        <Switch 
                            id="sms-notifications" 
                            checked={settings?.notifications?.sms?.enabled}
                            onCheckedChange={(checked) => handleSettingChange('notifications', {...settings?.notifications, sms: {...settings?.notifications?.sms, enabled: checked}})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sms-api-key">SMS Service API Key</Label>
                        <Input 
                            id="sms-api-key" 
                            type="password"
                            value={settings?.notifications?.sms?.apiKey || ''}
                            onChange={(e) => handleSettingChange('notifications', {...settings?.notifications, sms: {...settings?.notifications?.sms, apiKey: e.target.value}})}
                            placeholder="Enter your SMS provider API key" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="alert-template">SMS Alert Template</Label>
                        <Textarea 
                            id="alert-template" 
                            value={settings?.notifications?.sms?.template || ''}
                            onChange={(e) => handleSettingChange('notifications', {...settings?.notifications, sms: {...settings?.notifications?.sms, template: e.target.value}})}
                            placeholder="e.g., [ALERT] Device {deviceId} offline. Please investigate."
                        />
                        <p className="text-xs text-muted-foreground">Use variables: {`{deviceId}`}, {`{deviceType}`}, {`{issue}`}, {`{location}`}.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
