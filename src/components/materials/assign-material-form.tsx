
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
import { MaterialAssignment, Technician, Material } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AssignMaterialFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (assignment: Omit<MaterialAssignment, 'id' | 'status'>) => void;
  technicians: Technician[];
  materials: Material[];
}

export default function AssignMaterialForm({ isOpen, onOpenChange, onSave, technicians, materials }: AssignMaterialFormProps) {
  const [technicianId, setTechnicianId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [quantityAssigned, setQuantityAssigned] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
        // Reset form when closed
        setTechnicianId('');
        setMaterialId('');
        setQuantityAssigned(1);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!technicianId || !materialId || quantityAssigned <= 0) {
        toast({ title: 'Missing Fields', description: 'Please fill out all fields correctly.', variant: 'destructive'});
        return;
    }

    const material = materials.find(m => m.id === materialId);
    if (material && material.quantityInStock < quantityAssigned) {
        toast({ title: 'Insufficient Stock', description: `Not enough ${material.name} in stock.`, variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    onSave({
        technicianId,
        materialId,
        quantityAssigned,
        timestamp: new Date().toISOString()
    });
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Material</DialogTitle>
          <DialogDescription>
            Assign a material from the stock to a technician.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="technician">Technician</Label>
                <Select value={technicianId} onValueChange={setTechnicianId} required>
                    <SelectTrigger id="technician"><SelectValue placeholder="Select a technician" /></SelectTrigger>
                    <SelectContent>
                        {technicians.map(tech => (
                            <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select value={materialId} onValueChange={setMaterialId} required>
                    <SelectTrigger id="material"><SelectValue placeholder="Select a material" /></SelectTrigger>
                    <SelectContent>
                        {materials.map(mat => (
                            <SelectItem key={mat.id} value={mat.id} disabled={mat.quantityInStock === 0}>
                                {mat.name} ({mat.quantityInStock} in stock)
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
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
