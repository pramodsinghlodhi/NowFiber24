

'use client';

import { Task, Technician, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, HardHat, Camera } from 'lucide-react';
import ProofOfWorkForm from '@/components/tasks/proof-of-work-form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState, useMemo }from 'react';
import { reassignTask, updateTaskStatus } from '@/app/actions';
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
  
  const findTechnicianByUid = (uid: string) => {
    return technicians.find(t => t.id === uid);
  }
  
  const assignedTechnician = useMemo(() => {
    if (user?.role === 'Technician') return user;
    // For Admins, find the tech by UID from the technicians list
    const tech = technicians.find(t => t.id === task.tech_id);
    if (tech) return tech;
    // Fallback for older tasks that might still have custom ID
    return technicians.find(t => t.id === task.tech_id);
  }, [technicians, task.tech_id, user]);

  const [assignedTechId, setAssignedTechId] = useState(assignedTechnician?.id || '');


  const handleStatusChange = async (newStatus: Task['status']) => {
    const result = await updateTaskStatus(task.id, newStatus);
    if (result.success) {
        toast({
            title: `Task Updated`,
            description: `${task.title} marked as ${newStatus}.`,
        });
    } else {
        toast({ title: 'Error', description: 'Failed to update task status.', variant: 'destructive'});
    }
  };

  const handleReassign = async (newTechCustomId: string) => {
    const techName = technicians.find(t => t.id === newTechCustomId)?.name;
    const result = await reassignTask(task.id, newTechCustomId, task.title);

    if (result.success) {
        setAssignedTechId(newTechCustomId);
        toast({
            title: "Task Re-assigned",
            description: `${task.title} has been assigned to ${techName}.`
        });
    } else {
        toast({ title: 'Error', description: 'Failed to re-assign task.', variant: 'destructive'});
    }
  }

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
            {task.status === 'Completed' && user?.role === 'Technician' && (
                <ProofOfWorkForm task={task} />
            )}
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
