

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
import { Technician, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface TechnicianFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (technician: Omit<Technician, 'id'> & { id: string }, user: Omit<User, 'uid' | 'id'> & { id: string; password?: string }) => void;
  technician: Technician | null;
  allUsers: User[];
}

export default function TechnicianForm({ isOpen, onOpenChange, onSave, technician, allUsers }: TechnicianFormProps) {
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
    if (isOpen) {
        if (technician) {
            setName(technician.name);
            setId(technician.id);
            setRole(technician.role);
            setContact(technician.contact);
            setAvatarUrl(technician.avatarUrl || `https://i.pravatar.cc/150?u=${technician.id}`);
            setPassword(''); 
        } else {
            setName('');
            const newId = `tech-${String(allUsers.filter(u => u.role === 'Technician').length + 1).padStart(3, '0')}`;
            setId(newId);
            setPassword('');
            setContact('');
            setRole('Field Engineer');
            setAvatarUrl(`https://i.pravatar.cc/150?u=${newId}`);
        }
    }
  }, [technician, isOpen, allUsers]);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value;
    setId(newId);
    if (!isEditing) {
      setAvatarUrl(`https://i.pravatar.cc/150?u=${newId}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !id) {
        toast({ title: 'Missing Fields', description: 'Please fill out all required fields.', variant: 'destructive'});
        return;
    }
    
    if (!isEditing && !password) {
        toast({ title: 'Missing Password', description: 'Password is required for new technicians.', variant: 'destructive'});
        return;
    }

    if (!isEditing && allUsers.some(u => u.id === id)) {
        toast({ title: 'ID already exists', description: 'This technician ID is already in use. Please choose another.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    const techData: Omit<Technician, 'id'> & { id: string } = {
        id: id,
        name,
        role,
        contact,
        avatarUrl,
        lat: technician?.lat || 34.0522,
        lng: technician?.lng || -118.2437,
        isActive: technician?.isActive || false,
        status: technician?.status || 'available',
        path: technician?.path || [],
    };
    
    const userData: Omit<User, 'uid' | 'id'> & { id: string; password?: string } = {
        id: id,
        name,
        role: 'Technician',
        avatarUrl,
        isBlocked: isEditing ? allUsers.find(u => u.id === technician!.id)?.isBlocked || false : false,
        password: password || undefined,
    };

    onSave(techData, userData);
    setIsLoading(false);
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

        <form onSubmit={handleSubmit} >
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl || `https://i.pravatar.cc/150?u=${id}`} alt={name} />
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
                    <Input id="id" value={id} onChange={handleIdChange} placeholder="e.g., tech-004" required disabled={isEditing} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!isEditing} placeholder={isEditing ? "Leave blank to keep unchanged" : ""} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number</Label>
                    <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g., +11234567890" />
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
            <Button type="submit" disabled={isLoading} >
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isEditing ? 'Save Changes' : 'Add Technician'}
</Button>

          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
