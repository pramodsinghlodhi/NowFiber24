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
import { useAuth } from '@/contexts/auth-context';
import { mockReferrals } from '@/lib/data';

export default function ReferCustomer() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const {toast} = useToast();

  const handleReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
        const newReferral = {
            id: mockReferrals.length + 1,
            tech_id: user.id,
            customer_name: name,
            phone,
            address,
            notes,
            status: 'Pending' as 'Pending' | 'Contacted' | 'Closed',
            timestamp: new Date().toISOString(),
        }
        mockReferrals.push(newReferral);
        
        setIsLoading(false);
        setIsOpen(false);
        resetForm();
        toast({
            title: 'Referral Submitted!',
            description: 'The sales team has been notified of the new lead. Location captured.',
        });
    }, 1000)
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
  }

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      if(!open) resetForm();
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
        <form onSubmit={handleReferral}>
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
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Smith" required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., (555) 123-4567" required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">Address / Location</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g., 123 Main St, Los Angeles" required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Customer is interested in the 1 Gig plan." />
                </div>
            </div>

            <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
