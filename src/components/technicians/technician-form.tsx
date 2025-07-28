

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
import { Technician, User, mockUsers, mockTechnicians } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

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
  const [contact, setContact] = useState('');
  const [role, setRole] = useState<Technician['role']>('Field Engineer');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!technician;

  useEffect(() => {
    if (technician) {
      setName(technician.name);
      setId(technician.id);
      setRole(technician.role);
      setContact(technician.contact);
      setAvatarUrl(technician.avatarUrl || '');
      const user = mockUsers.find(u => u.id === technician.id);
      setPassword(user?.password || '');
    } else {
      // Reset form for new entry
      setName('');
      setId('');
      setPassword('');
      setContact('');
      setRole('Field Engineer');
      setAvatarUrl(`https://i.pravatar.cc/150?u=`);
    }
  }, [technician, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !id || !password || !contact) {
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
        const existingTechnician = isEditing ? mockTechnicians.find(t => t.id === id) : undefined;
        const newOrUpdatedTechnician: Technician = {
            id,
            name,
            role,
            contact,
            avatarUrl,
            lat: existingTechnician?.lat || 34.0522,
            lng: existingTechnician?.lng || -118.2437,
            isActive: existingTechnician?.isActive || false,
            status: existingTechnician?.status || 'available',
        };
        
        const existingUser = isEditing ? mockUsers.find(u => u.id === id) : undefined;
        const newOrUpdatedUser: User = {
            id,
            name,
            password,
            role: 'Technician',
            contact,
            avatarUrl,
            isBlocked: existingUser?.isBlocked || false,
        };

        onSave(newOrUpdatedTechnician, newOrUpdatedUser);
        setIsLoading(false);
    }, 500);
  };
  
  const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
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
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl} alt={name} />
                    <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className="w-full space-y-2">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Smith" required />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="id">Technician ID (Login ID)</Label>
                    <Input id="id" value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g., tech-004" required disabled={isEditing} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number</Label>
                    <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g., +11234567890" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(value) => setRole(value as any)} required>
                        <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Field Engineer">Field Engineer</SelectItem>
                            <SelectItem value="Splicing Technician">Splicing Technician</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
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
