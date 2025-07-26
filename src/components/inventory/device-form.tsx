
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
import { Device, mockDevices } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface DeviceFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (device: Device) => void;
  device: Device | null;
}

export default function DeviceForm({ isOpen, onOpenChange, onSave, device }: DeviceFormProps) {
  const [id, setId] = useState('');
  const [type, setType] = useState<'OLT' | 'ONU' | 'Switch' | 'Pole'>('ONU');
  const [ip, setIp] = useState('');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [status, setStatus] = useState<'online' | 'offline' | 'maintenance'>('online');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!device;

  useEffect(() => {
    if (device) {
      setId(device.id);
      setType(device.type);
      setIp(device.ip);
      setLat(device.lat);
      setLng(device.lng);
      setStatus(device.status);
    } else {
      // Reset form for new entry
      setId('');
      setType('ONU');
      setIp('');
      setLat(34.0522);
      setLng(-118.2437);
      setStatus('online');
    }
  }, [device, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !type || !lat || !lng) {
        toast({ title: 'Missing Fields', description: 'Please fill out all required fields.', variant: 'destructive'});
        return;
    }

    if (!isEditing && mockDevices.some(d => d.id === id)) {
        toast({ title: 'ID already exists', description: 'This device ID is already in use. Please choose another.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    // Simulate saving
    setTimeout(() => {
        const newOrUpdatedDevice: Device = {
            id,
            type,
            ip,
            lat,
            lng,
            status,
        };

        onSave(newOrUpdatedDevice);
        setIsLoading(false);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Device' : 'Add New Device'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update details for ${device?.id}.` : 'Enter the details for the new network device.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="id">Device ID</Label>
              <Input id="id" value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g., ONU-106" required disabled={isEditing} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Device Type</Label>
                    <Select value={type} onValueChange={(value) => setType(value as any)} required>
                        <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ONU">ONU</SelectItem>
                            <SelectItem value="OLT">OLT</SelectItem>
                            <SelectItem value="Switch">Switch</SelectItem>
                            <SelectItem value="Pole">Pole</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(value) => setStatus(value as any)} required>
                        <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="offline">Offline</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="ip">IP Address</Label>
                <Input id="ip" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="e.g., 10.0.1.106" />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input id="lat" type="number" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} placeholder="e.g., 34.0522" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input id="lng" type="number" value={lng} onChange={(e) => setLng(parseFloat(e.target.value))} placeholder="e.g., -118.2437" required />
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Device'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
