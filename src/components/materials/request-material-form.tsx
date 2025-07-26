
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { mockMaterials, mockAssignments, MaterialAssignment } from '@/lib/data';
import { Loader2, Wrench } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '@/contexts/auth-context';

export default function RequestMaterial() {
  const [isOpen, setIsOpen] = useState(false);
  const [materialId, setMaterialId] = useState('');
  const [quantityAssigned, setQuantityAssigned] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ title: 'Not Authenticated', description: 'You must be logged in to make a request.', variant: 'destructive'});
        return;
    }
    if (!materialId || quantityAssigned <= 0) {
        toast({ title: 'Missing Fields', description: 'Please select a material and quantity.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    // Simulate saving
    setTimeout(() => {
        const newRequest: MaterialAssignment = {
            id: mockAssignments.length + 1,
            technicianId: user.id,
            materialId,
            quantityAssigned,
            timestamp: new Date().toISOString(),
            status: 'Requested'
        }
        mockAssignments.unshift(newRequest);
        
        setIsLoading(false);
        setIsOpen(false);
        toast({ title: 'Request Submitted', description: 'Your material request has been sent to the administrator for approval.' });
    }, 500);
  };

  useEffect(() => {
    if (!isOpen) {
        // Reset form when closed
        setMaterialId('');
        setQuantityAssigned(1);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            <Button className="w-full justify-start">
                <Wrench className="mr-2 h-4 w-4" />
                Request Material
            </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Material</DialogTitle>
          <DialogDescription>
            Select a material and quantity to request from the main office.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select value={materialId} onValueChange={setMaterialId} required>
                    <SelectTrigger id="material"><SelectValue placeholder="Select a material" /></SelectTrigger>
                    <SelectContent>
                        {mockMaterials.map(mat => (
                            <SelectItem key={mat.id} value={mat.id}>
                                {mat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                    id="quantity" 
                    type="number" 
                    value={quantityAssigned} 
                    onChange={(e) => setQuantityAssigned(parseInt(e.target.value))} 
                    min="1"
                    required 
                />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
