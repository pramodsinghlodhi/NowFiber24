
'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Route, Bot, Loader2} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {runTraceRoute} from '@/app/actions';
import {Label} from '../ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../ui/select';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Infrastructure } from '@/lib/types';


interface TraceRouteProps {
    startDevice?: string;
    endDevice?: string;
    onTraceComplete?: () => void;
}

export default function TraceRoute({ startDevice, endDevice, onTraceComplete }: TraceRouteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [startDeviceId, setStartDeviceId] = useState(startDevice || '');
  const [endDeviceId, setEndDeviceId] = useState(endDevice || '');
  const {toast} = useToast();
  const router = useRouter();

  const { data: olts, loading: loadingOlts } = useFirestoreQuery<Infrastructure>(query(collection(db, 'infrastructure'), where('type', '==', 'OLT')));
  const { data: onus, loading: loadingOnus } = useFirestoreQuery<Infrastructure>(query(collection(db, 'infrastructure'), where('type', '==', 'ONU')));


  useEffect(() => {
    if (startDevice) setStartDeviceId(startDevice);
    if (endDevice) setEndDeviceId(endDevice);
  }, [startDevice, endDevice]);

  const handleTrace = async () => {
    if (!startDeviceId || !endDeviceId) {
        toast({ title: 'Missing Devices', description: 'Please select both a start and end device.', variant: 'destructive'});
        return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const traceResult = await runTraceRoute({ startDeviceId, endDeviceId });
      setResult(traceResult);
      if (traceResult.path.length > 0) {
        toast({
          title: 'Trace Complete!',
          description: `Path found with ${traceResult.path.length} hops.`,
        });
        const pathData = encodeURIComponent(JSON.stringify(traceResult.path));
        router.push(`/map?path=${pathData}`);
        setIsOpen(false);
        onTraceComplete?.();
      } else {
         toast({
          title: 'Trace Failed',
          description: traceResult.notes,
           variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run trace route.',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full justify-start">
        <Route className="mr-2 h-4 w-4" />
        AI Trace Route
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
              <Bot className="text-primary" /> AI Fiber Trace
            </DialogTitle>
            <DialogDescription>
              Select a start and end device to trace the physical fiber path. The AI will find the route and highlight it on the map.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="start-device">Start Device</Label>
                <Select value={startDeviceId} onValueChange={setStartDeviceId}>
                    <SelectTrigger id="start-device"><SelectValue placeholder={loadingOlts ? "Loading..." : "Select a starting OLT..."} /></SelectTrigger>
                    <SelectContent>
                        {olts.map(device => (
                            <SelectItem key={device.id} value={device.id}>{device.name} ({device.id})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="end-device">End Device</Label>
                <Select value={endDeviceId} onValueChange={setEndDeviceId}>
                    <SelectTrigger id="end-device"><SelectValue placeholder={loadingOnus ? "Loading..." : "Select a target ONU..."} /></SelectTrigger>
                    <SelectContent>
                        {onus.map(device => (
                            <SelectItem key={device.id} value={device.id}>{device.name} ({device.id})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
          
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4">Tracing path...</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTrace} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tracing...
                </>
              ) : (
                <>
                  <Route className="mr-2 h-4 w-4" />
                  Trace and View on Map
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
