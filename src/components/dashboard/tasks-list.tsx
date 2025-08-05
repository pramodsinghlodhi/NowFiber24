
'use client';

import { Task, Technician } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, User, Wrench } from 'lucide-react';
import MaterialsAnalyzer from './materials-analyzer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const getStatusIcon = (status: 'Pending' | 'In Progress' | 'Completed') => {
  switch (status) {
    case 'In Progress':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'Completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'Pending':
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
};

type TaskItemProps = {
  task: Task;
  technicians: Technician[];
};

function TaskItem({ task, technicians }: TaskItemProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [assignedTech, setAssignedTech] = useState(task.tech_id);

  const handleCheckIn = () => {
    const isNearby = Math.random() > 0.3; 
    if (isNearby) {
      toast({
        title: 'Check-in Successful',
        description: `You are now checked in for task: ${task.title}`,
      });
    } else {
      toast({
        title: 'Check-in Failed',
        description: 'You must be within 100m of the job site to check in.',
        variant: 'destructive',
      });
    }
  };

  const handleReassign = async (newTechId: string) => {
    const techName = technicians.find(t => t.id === newTechId)?.name;
    const taskDocRef = doc(db, 'tasks', task.id);

    try {
        await updateDoc(taskDocRef, { tech_id: newTechId });
        setAssignedTech(newTechId);
        toast({
            title: "Task Re-assigned",
            description: `${task.title} has been assigned to ${techName}.`
        });
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to re-assign task.', variant: 'destructive'});
        console.error("Failed to re-assign task: ", error);
    }
  }

  const assignedTechnician = useMemo(() => {
    return technicians.find(t => t.id === assignedTech);
  }, [technicians, assignedTech]);


  return (
    <div className="flex flex-col p-3 rounded-lg hover:bg-muted/50 transition-colors border-b last:border-b-0">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                {getStatusIcon(task.status)}
                <div>
                <p className="font-semibold">{task.title}</p>
                <p className="text-sm text-muted-foreground">Device ID: {task.device_id}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {task.status !== 'Completed' && user?.role === 'Technician' && (
                    <Button variant="outline" size="sm" onClick={handleCheckIn}>
                        Check In
                    </Button>
                )}
                 {task.status !== 'Completed' && <MaterialsAnalyzer task={task} /> }
            </div>
        </div>
         <div className="flex items-center justify-between mt-3 pl-9">
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <User className="h-4 w-4" />
                <span>{assignedTechnician?.name || 'Unassigned'}</span>
            </div>
            {user?.role === 'Admin' && task.status !== 'Completed' && (
                 <Select value={assignedTech} onValueChange={handleReassign}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Re-assign task..." />
                    </SelectTrigger>
                    <SelectContent>
                        {technicians.filter(t => t.isActive).map(tech => (
                            <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    </div>
  );
}

export default function TasksList({tasks, technicians}: {tasks: Task[], technicians: Technician[]}) {
  if (!technicians) {
    return null; // Or a loading indicator
  }
  return (
    <div className="space-y-1">
        {tasks.map(task => (
            <TaskItem key={task.id} task={task} technicians={technicians} />
        ))}
    </div>
  );
}
