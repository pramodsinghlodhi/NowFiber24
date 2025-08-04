
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
import { Infrastructure } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '@/contexts/auth-context';

interface DeviceFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (device: Omit<Infrastructure, 'id'>, isEditing: boolean) => void;
  device: Infrastructure | null;
}

const fiberTubeColors = ['Blue', 'Orange', 'Green', 'Brown', 'Slate', 'White', 'Red', 'Black', 'Yellow', 'Violet', 'Rose', 'Aqua'];
const fiberCoreColors = ['Blue', 'Orange', 'Green', 'Brown', 'Slate', 'White', 'Red', 'Black', 'Yellow', 'Violet', 'Rose', 'Aqua'];


export default function DeviceForm({ isOpen, onOpenChange, onSave, device }: DeviceFormProps) {
  const { user } = useAuth();
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<Infrastructure['type']>('ONU');
  const [ip, setIp] = useState('');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [status, setStatus] = useState<Infrastructure['status']>('online');
  const [attributes, setAttributes] = useState<Infrastructure['attributes']>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [quantity, setQuantity] = useState<number | undefined>(undefined);


  const isEditing = !!device;
  const isTechnician = user?.role === 'Technician';

  useEffect(() => {
    if (device) {
      setId(device.id);
      setName(device.name);
      setType(device.type);
      setIp(device.ip || '');
      setLat(device.lat);
      setLng(device.lng);
      setStatus(device.status);
      setAttributes(device.attributes || {});
      setQuantity(device.quantity);
    } else {
      // Reset form for new entry
      setId('');
      setName('');
      setType('ONU');
      setIp('');
      setLat(34.0522);
      setLng(-118.2437);
      setStatus('online');
      setAttributes({});
      setQuantity(undefined);
    }
  }, [device, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !type || !lat || !lng || !name) {
        toast({ title: 'Missing Fields', description: 'Please fill out all required fields.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    const newOrUpdatedDevice: Omit<Infrastructure, 'id'> = {
        id,
        projectId: 'ftth001', // Default project for now
        name,
        type,
        ip,
        lat,
        lng,
        status,
        quantity,
        attributes,
        connectedBy: isEditing ? device?.connectedBy : user?.name,
        connectionDate: isEditing ? device?.connectionDate : new Date().toISOString(),
    };

    onSave(newOrUpdatedDevice, isEditing);
    setIsLoading(false);
  };

  const handleAttributeChange = (key: keyof NonNullable<Infrastructure['attributes']>, value: string | number) => {
    setAttributes(prev => ({...prev, [key]: value}));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Device' : 'Add New Device'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update details for ${device?.name}.` : 'Enter the details for the new network device.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">Device ID</Label>
                <Input id="id" value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g., ONU-106" required disabled={isEditing || isTechnician} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="name">Device Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Customer ONU" required disabled={isTechnician}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Device Type</Label>
                    <Select value={type} onValueChange={(value) => setType(value as any)} required disabled={isTechnician}>
                        <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Datacenter">Datacenter</SelectItem>
                            <SelectItem value="Core Switch">Core Switch</SelectItem>
                            <SelectItem value="OLT">OLT</SelectItem>
                            <SelectItem value="switch">Switch</SelectItem>
                            <SelectItem value="Splice Box">Splice Box</SelectItem>
                            <SelectItem value="ONU">ONU</SelectItem>
                            <SelectItem value="Pole">Pole</SelectItem>
                            <SelectItem value="Customer Premise">Customer Premise</SelectItem>
                            <SelectItem value="fiber">Fiber Cable</SelectItem>
                            <SelectItem value="splitter">Splitter</SelectItem>
                            <SelectItem value="joint_box">Joint Box</SelectItem>
                            <SelectItem value="router">Router</SelectItem>
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
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="installed">Installed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             {type === 'fiber' && (
                <div className="space-y-2">
                    <Label htmlFor="quantity">Length (meters)</Label>
                    <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} placeholder="e.g., 2000" />
                </div>
             )}
            <div className="space-y-2">
                <Label htmlFor="ip">IP Address</Label>
                <Input id="ip" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="e.g., 10.0.1.106" disabled={isTechnician}/>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input id="lat" type="number" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} placeholder="e.g., 34.0522" required disabled={isTechnician}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input id="lng" type="number" value={lng} onChange={(e) => setLng(parseFloat(e.target.value))} placeholder="e.g., -118.2437" required disabled={isTechnician}/>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-sm">Device Attributes</h4>
                 <div className="space-y-2">
                    <Label htmlFor="assetLabel">Asset Label</Label>
                    <Input id="assetLabel" value={attributes?.assetLabel || ''} onChange={(e) => handleAttributeChange('assetLabel', e.target.value)} placeholder="e.g., LA1-OLT-01" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="powerLevel">Power Level (dBm)</Label>
                    <Input id="powerLevel" value={attributes?.powerLevel || ''} onChange={(e) => handleAttributeChange('powerLevel', e.target.value)} placeholder="e.g., -24.5 dBm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tubeColor">Tube Color</Label>
                        <Select value={attributes?.tubeColor || ''} onValueChange={(v) => handleAttributeChange('tubeColor', v)}>
                            <SelectTrigger id="tubeColor"><SelectValue placeholder="Select tube color" /></SelectTrigger>
                            <SelectContent>
                                {fiberTubeColors.map(color => <SelectItem key={color} value={color}>{color}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="fiberColor">Fiber Color</Label>
                        <Select value={attributes?.fiberColor || ''} onValueChange={(v) => handleAttributeChange('fiberColor', v)}>
                            <SelectTrigger id="fiberColor"><SelectValue placeholder="Select fiber color" /></SelectTrigger>
                            <SelectContent>
                                {fiberCoreColors.map(color => <SelectItem key={color} value={color}>{color}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fiberCapacity">Fiber Capacity</Label>
                    <Select value={attributes?.fiberCapacity || ''} onValueChange={(v) => handleAttributeChange('fiberCapacity', v)}>
                        <SelectTrigger id="fiberCapacity"><SelectValue placeholder="Select capacity" /></SelectTrigger>
                        <SelectContent>
                            {['2F', '4F', '8F', '12F', '24F', '48F', '96F'].map(cap => <SelectItem key={cap} value={cap}>{cap}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="openPorts">Open Ports</Label>
                    <Input id="openPorts" type="number" value={attributes?.openPorts || ''} onChange={(e) => handleAttributeChange('openPorts', parseInt(e.target.value, 10))} placeholder="e.g., 4" />
                </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
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
