'use client';

import {useState, useRef} from 'react';
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
import {UserPlus, Loader2, Pin} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {Input} from '../ui/input';
import {Label} from '../ui/label';
import {Textarea} from '../ui/textarea';

export default function ReferCustomer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();

  const handleReferral = async () => {
    setIsLoading(true);
    // Simulate API call and Geolocation
    setTimeout(() => {
        setIsLoading(false);
        setIsOpen(false);
        toast({
            title: 'Referral Submitted!',
            description: 'The sales team has been notified of the new lead. Location captured.',
        });
    }, 1500)
  };

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      setIsOpen(open);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start">
            <UserPlus className="mr-2 h-4 w-4" />
            Refer a Customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <UserPlus className="text-primary" /> New Customer Referral
          </DialogTitle>
          <DialogDescription>
            Found a potential new customer? Submit their details here. Your current location will be logged with the referral.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input id="name" placeholder="e.g., John Smith" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="e.g., (555) 123-4567" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="address">Address / Location</Label>
                <Input id="address" placeholder="e.g., 123 Main St, Los Angeles" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="e.g., Customer is interested in the 1 Gig plan." />
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleReferral} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Pin className="mr-2 h-4 w-4" />
                Submit Referral
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
