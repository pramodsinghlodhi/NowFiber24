
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Technician, User, mockUsers } from '@/lib/data';
import { Loader2 } from 'lucide-react';

interface TechnicianFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (technician: Technician, user: User) => void;
  technician: Technician | null;
}

export default function TechnicianForm({ isOpen, onOpenChange, onSave, technician }: TechnicianFormProps) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!technician;

  useEffect(() => {
    if (technician) {
      setName(technician.name);
      setId(technician.id);
      const user = mockUsers.find(u => u.id === technician.id);
      setPassword(user?.password || '');
    } else {
      // Reset form for new entry
      setName('');
      setId('');
      setPassword('');
    }
  }, [technician, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !id || !password) {
        toast({ title: 'Missing Fields', description: 'Please fill out all required fields.', variant: 'destructive'});
        return;
    }

    if (!isEditing && mockUsers.some(u => u.id === id)) {
        toast({ title: 'ID already exists', description: 'This technician ID is already in use. Please choose another.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    // Simulate saving
    setTimeout(() => {
        const newOrUpdatedTechnician: Technician = {
            ...(technician || { lat: 34.0522, lng: -118.2437, onDuty: false, status: 'available' }), // Provide defaults for new tech
            id,
            name,
        };
        
        const newOrUpdatedUser: User = {
            id,
            name,
            password,
            role: 'Technician',
        };

        onSave(newOrUpdatedTechnician, newOrUpdatedUser);
        setIsLoading(false);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Technician' : 'Add New Technician'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update details for ${technician?.name}.` : 'Enter the details for the new technician.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Smith" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id">Technician ID (Login ID)</Label>
              <Input id="id" value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g., tech-004" required disabled={isEditing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Technician'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
