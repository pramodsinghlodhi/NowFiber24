
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  Technician,
  Task,
  MaterialAssignment,
  Referral,
  Material,
} from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, ListChecks, Star, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { getTechnician } from '@/app/actions';

function ReportSkeleton() {
    return (
        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
                <Card><CardHeader><Skeleton className="h-4 w-24 mb-2"/><Skeleton className="h-8 w-12"/></CardHeader></Card>
                <Card><CardHeader><Skeleton className="h-4 w-24 mb-2"/><Skeleton className="h-8 w-12"/></CardHeader></Card>
                <Card><CardHeader><Skeleton className="h-4 w-24 mb-2"/><Skeleton className="h-8 w-12"/></CardHeader></Card>
                <Card><CardHeader><Skeleton className="h-4 w-24 mb-2"/><Skeleton className="h-8 w-12"/></CardHeader></Card>
            </div>
             <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center justify-between"><Skeleton className="h-5 w-40" /><Skeleton className="h-5 w-20" /></div>
                       <div className="flex items-center justify-between"><Skeleton className="h-5 w-48" /><Skeleton className="h-5 w-20" /></div>
                       <div className="flex items-center justify-between"><Skeleton className="h-5 w-32" /><Skeleton className="h-5 w-20" /></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center justify-between"><Skeleton className="h-5 w-40" /><Skeleton className="h-5 w-20" /></div>
                       <div className="flex items-center justify-between"><Skeleton className="h-5 w-48" /><Skeleton className="h-5 w-20" /></div>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}


export default function TechnicianReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const techId = params.id as string;
  
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loadingTechnician, setLoadingTechnician] = useState(true);

  const tasksQuery = useMemo(() => techId ? query(collection(db, 'tasks'), where('tech_id', '==', techId)) : null, [techId]);
  const assignmentsQuery = useMemo(() => techId ? query(collection(db, 'assignments'), where('technicianId', '==', techId)) : null, [techId]);
  const referralsQuery = useMemo(() => techId ? query(collection(db, 'referrals'), where('tech_id', '==', techId)) : null, [techId]);
  const materialsQuery = useMemo(() => collection(db, 'materials'), []);
  
  const { data: tasks, loading: loadingTasks } = useFirestoreQuery<Task>(tasksQuery);
  const { data: assignments, loading: loadingAssignments } = useFirestoreQuery<MaterialAssignment>(assignmentsQuery);
  const { data: referrals, loading: loadingReferrals } = useFirestoreQuery<Referral>(referralsQuery);
  const { data: materials, loading: loadingMaterials } = useFirestoreQuery<Material>(materialsQuery);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user?.role !== 'Admin') {
      router.push('/');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (techId) {
      const fetchTechnician = async () => {
        setLoadingTechnician(true);
        const tech = await getTechnician(techId);
        setTechnician(tech);
        setLoadingTechnician(false);
      };
      fetchTechnician();
    }
  }, [techId]);
  
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'Completed').length, [tasks]);
  const completionRate = useMemo(() => (tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0), [tasks, completedTasks]);

  const renderTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return 'Invalid Date';
    }
  };
  
  const loading = authLoading || loadingTechnician || loadingTasks || loadingAssignments || loadingReferrals || loadingMaterials;
  
  if (loading || !user || user.role !== 'Admin') {
    return <ReportSkeleton />;
  }

  if (!technician) {
    return (
        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                    <CardDescription>Technician not found.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>The technician with ID "{techId}" could not be found. They may have been deleted.</p>
                </CardContent>
            </Card>
        </main>
    );
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 border-2">
          <AvatarImage src={technician.avatarUrl} alt={technician.name} />
          <AvatarFallback>{technician.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold font-headline">{technician.name}'s Report</h1>
          <p className="text-muted-foreground">A deep dive into performance and activity.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Assigned</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(0)}%</div>
            <Progress value={completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referrals</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referrals.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Task History</CardTitle>
                <CardDescription>A log of all tasks assigned to {technician.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.length > 0 ? tasks.map(task => (
                            <TableRow key={task.id}>
                                <TableCell>
                                    <div className="font-medium">{task.title}</div>
                                    <div className="text-sm text-muted-foreground">{task.description}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={task.status === 'Completed' ? 'secondary' : 'default'} className={
                                        task.status === 'Completed' ? 'bg-green-500/20 text-green-700 border-green-400' :
                                        task.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-400' : ''
                                    }>{task.status}</Badge>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={2} className="text-center">No tasks found for this technician.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Material Usage</CardTitle>
                    <CardDescription>All materials requested or assigned to the technician.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments.length > 0 ? assignments.map(assignment => {
                                const material = materials.find(m => m.id === assignment.materialId);
                                return (
                                    <TableRow key={assignment.id}>
                                        <TableCell className="font-medium">{material?.name || 'N/A'}</TableCell>
                                        <TableCell>{assignment.quantityAssigned}</TableCell>
                                        <TableCell>{assignment.status}</TableCell>
                                    </TableRow>
                                )
                            }) : (
                                 <TableRow><TableCell colSpan={3} className="text-center">No material assignments found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Referral History</CardTitle>
                    <CardDescription>Customers referred by {technician.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referrals.length > 0 ? referrals.map(referral => (
                                <TableRow key={referral.id}>
                                    <TableCell className="font-medium">{referral.customer_name}</TableCell>
                                    <TableCell>{renderTimestamp(referral.timestamp)}</TableCell>
                                    <TableCell>{referral.status}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={3} className="text-center">No referrals found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
