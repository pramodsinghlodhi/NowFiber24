
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
import { Task, Technician } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface CreateTaskFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (task: Omit<Task, 'id' | 'completionTimestamp'>) => void;
  technicians: Technician[];
}

export default function CreateTaskForm({ isOpen, onOpenChange, onSave, technicians }: CreateTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techId, setTechId] = useState('');
  const [lat, setLat] = useState<number | string>('');
  const [lng, setLng] = useState<number | string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset form when opened
      setTitle('');
      setDescription('');
      setTechId('');
      setLat('');
      setLng('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !techId || !lat || !lng) {
        toast({ title: 'Missing Fields', description: 'Please fill out all fields.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    const newTask: Omit<Task, 'id' | 'completionTimestamp'> = {
        title,
        description,
        tech_id: techId,
        lat: parseFloat(String(lat)),
        lng: parseFloat(String(lng)),
        status: 'Pending',
    };

    onSave(newTask);
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create and assign a new task.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Fix ONU Connectivity" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide a detailed description of the task." required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="techId">Assign to Technician</Label>
                <Select value={techId} onValueChange={setTechId} required>
                    <SelectTrigger id="techId"><SelectValue placeholder="Select a technician" /></SelectTrigger>
                    <SelectContent>
                        {technicians.map(tech => (
                            <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input id="lat" type="number" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g., 34.0522" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input id="lng" type="number" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g., -118.2437" required />
                </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
