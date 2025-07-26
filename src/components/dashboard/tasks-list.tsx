'use client';

import {Task} from '@/lib/data';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {CheckCircle, Clock} from 'lucide-react';
import MaterialsAnalyzer from './materials-analyzer';
import {useToast} from '@/hooks/use-toast';

const getStatusIcon = (status: 'Pending' | 'In Progress' | 'Completed') => {
  switch (status) {
    case 'In Progress':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'Completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'Pending':
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

type TaskItemProps = {
  task: Task;
};

function TaskItem({task}: TaskItemProps) {
  const {toast} = useToast();

  const handleCheckIn = () => {
    // Mock Geo-fencing logic
    // In a real app, this would use navigator.geolocation
    const isNearby = Math.random() > 0.3; // Simulate being nearby 70% of the time
    if (isNearby) {
      toast({
        title: 'Check-in Successful',
        description: `You are now checked in for task: ${task.title}`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Check-in Failed',
        description: 'You must be within 100m of the job site to check in.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
      <div className="flex items-center gap-4">
        {getStatusIcon(task.status)}
        <div>
          <p className="font-medium">{task.title}</p>
          <p className="text-sm text-muted-foreground">{task.status}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleCheckIn}>
          Check In
        </Button>
        <MaterialsAnalyzer task={task} />
      </div>
    </div>
  );
}

export default function TasksList({tasks}: {tasks: Task[]}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">My Tasks</CardTitle>
        <CardDescription>Your assigned jobs for today.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </CardContent>
    </Card>
  );
}
