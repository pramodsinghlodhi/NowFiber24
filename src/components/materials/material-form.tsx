
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Material } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MaterialFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (material: Omit<Material, 'id'>, materialId?: string) => void;
  material: Material | null;
}

export default function MaterialForm({ isOpen, onOpenChange, onSave, material }: MaterialFormProps) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [quantityInStock, setQuantityInStock] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const materialsQuery = useMemo(() => collection(db, 'materials'), []);
  const { data: materials } = useFirestoreQuery<Material>(materialsQuery);

  const isEditing = !!material;

  useEffect(() => {
    if (material) {
      setId(material.id);
      setName(material.name);
      setDescription(material.description);
      setImageUrl(material.imageUrl);
      setQuantityInStock(material.quantityInStock);
    } else {
      // Reset form for new entry
      setId('');
      setName('');
      setDescription('');
      setImageUrl('https://placehold.co/100x100.png');
      setQuantityInStock(0);
    }
  }, [material, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name) {
        toast({ title: 'Missing Fields', description: 'ID and Name are required.', variant: 'destructive'});
        return;
    }

    if (!isEditing && materials.some(m => m.id === id)) {
        toast({ title: 'ID already exists', description: 'This material ID is already in use.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    const newOrUpdatedMaterial: Omit<Material, 'id'> = {
        id,
        name,
        description,
        imageUrl,
        quantityInStock,
    };

    onSave(newOrUpdatedMaterial, isEditing ? material.id : undefined);
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Material' : 'Add New Material'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update details for ${material?.name}.` : 'Enter the details for the new material.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="id">Material ID</Label>
              <Input id="id" value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g., fiber-24" required disabled={isEditing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Material Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., 24-count Fiber Optic Cable" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Per meter" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://placehold.co/100x100.png" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="quantity">Quantity in Stock</Label>
              <Input id="quantity" type="number" value={quantityInStock} onChange={(e) => setQuantityInStock(parseInt(e.target.value))} required min="0"/>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
