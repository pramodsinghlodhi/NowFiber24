
'use client';

import { Task, Technician } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, User, HardHat } from 'lucide-react';
import MaterialsAnalyzer from './materials-analyzer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState, useMemo } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react';


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
  const [assignedTechId, setAssignedTechId] = useState(task.tech_id);

  const handleStatusChange = async (newStatus: Task['status']) => {
    const taskDocRef = doc(db, 'tasks', task.id);
    try {
        const updateData: any = { status: newStatus };
        if (newStatus === 'Completed') {
            updateData.completionTimestamp = serverTimestamp();
        }
        await updateDoc(taskDocRef, updateData);
        toast({
            title: `Task Updated`,
            description: `${task.title} marked as ${newStatus}.`,
        });
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to update task status.', variant: 'destructive'});
        console.error("Failed to update task status: ", error);
    }
  };

  const handleReassign = async (newTechId: string) => {
    const techName = technicians.find(t => t.id === newTechId)?.name;
    const taskDocRef = doc(db, 'tasks', task.id);

    try {
        await updateDoc(taskDocRef, { tech_id: newTechId });
        setAssignedTechId(newTechId);
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
    return technicians.find(t => t.id === assignedTechId);
  }, [technicians, assignedTechId]);


  return (
    <div className="flex flex-col p-3 rounded-lg hover:bg-muted/50 transition-colors border-b last:border-b-0">
        <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
                <span className="mt-1">{getStatusIcon(task.status)}</span>
                <div className="flex-1">
                    <p className="font-semibold leading-tight">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 {task.status !== 'Completed' && <MaterialsAnalyzer task={task} /> }
            </div>
        </div>
         <div className="flex items-center justify-between mt-3 pl-9">
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <HardHat className="h-4 w-4" />
                <span>{assignedTechnician?.name || 'Unassigned'}</span>
            </div>
            {user?.role === 'Admin' && task.status !== 'Completed' && (
                 <Select value={assignedTechId} onValueChange={handleReassign}>
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

            {user?.role === 'Technician' && task.status !== 'Completed' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                            Update Status <MoreHorizontal className="h-4 w-4 ml-2"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         {task.status === 'Pending' && (
                            <DropdownMenuItem onClick={() => handleStatusChange('In Progress')}>
                                Mark as In Progress
                            </DropdownMenuItem>
                         )}
                         {task.status === 'In Progress' && (
                             <DropdownMenuItem onClick={() => handleStatusChange('Completed')}>
                                Mark as Completed
                            </DropdownMenuItem>
                         )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    </div>
  );
}

export default function TasksList({tasks, technicians}: {tasks: Task[], technicians: Technician[]}) {
  if (!tasks || tasks.length === 0) {
    return <p className="text-muted-foreground text-sm p-4 text-center">No tasks in this category.</p>;
  }
  
  return (
    <div className="space-y-1 -m-3">
        {tasks.map(task => (
            <TaskItem key={task.id} task={task} technicians={technicians} />
        ))}
    </div>
  );
}
