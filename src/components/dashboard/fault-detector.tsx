'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {Bot, Zap, Loader2} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {runAutoFaultDetection} from '@/app/actions';
import {Alert, AlertTitle, AlertDescription} from '../ui/alert';

export default function FaultDetector() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const {toast} = useToast();

  const handleDetection = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const detectionResult = await runAutoFaultDetection();
      setResult(detectionResult);
      if (detectionResult.alertCreated) {
        toast({
          title: 'Fault Detected!',
          description: detectionResult.issue,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Network Scan Complete',
          description: 'All devices are reachable.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run fault detection.',
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
        <Bot className="mr-2 h-4 w-4" />
        AI Fault Detection
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
              <Zap className="text-primary" /> Automated Fault Detection
            </DialogTitle>
            <DialogDescription>
              Trigger the AI to scan the network for unreachable devices. This will ping a device that is known to be offline and create an alert for any identified faults.
            </DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4">Scanning network... this may take a moment.</p>
            </div>
          )}

          {result && (
            <Alert variant={result.alertCreated ? 'destructive' : 'default'} className="mt-4">
              <AlertTitle>{result.alertCreated ? 'Fault Found!' : 'Scan Complete'}</AlertTitle>
              <AlertDescription>{result.issue || 'All monitored devices are online and reachable.'}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDetection} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Run Scan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
