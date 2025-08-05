
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
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
import { CheckCircle, Clock, UserPlus, ListChecks, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  
  const { data: tasks, loading: loadingTasks } = useFirestoreQuery<Task>(tasksQuery);
  const { data: assignments, loading: loadingAssignments } = useFirestoreQuery<MaterialAssignment>(assignmentsQuery);
  const { data: referrals, loading: loadingReferrals } = useFirestoreQuery<Referral>(referralsQuery);
  const { data: materials, loading: loadingMaterials } = useFirestoreQuery<Material>(collection(db, 'materials'));

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
        const techDocRef = doc(db, 'technicians', techId);
        const techDoc = await getDoc(techDocRef);
        if (techDoc.exists()) {
          setTechnician({ id: techDoc.id, ...techDoc.data() } as Technician);
        }
        setLoadingTechnician(false);
      };
      fetchTechnician();
    }
  }, [techId]);
  
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'Completed').length, [tasks]);
  const completionRate = useMemo(() => (tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0), [tasks, completedTasks]);

  const loading = authLoading || loadingTechnician || loadingTasks || loadingAssignments || loadingReferrals || loadingMaterials;
  
  if (loading || !user || user.role !== 'Admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading Report...</p>
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Technician not found.</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
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
                            {tasks.map(task => (
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
                            ))}
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
                                {assignments.map(assignment => {
                                    const material = materials.find(m => m.id === assignment.materialId);
                                    return (
                                        <TableRow key={assignment.id}>
                                            <TableCell className="font-medium">{material?.name || 'N/A'}</TableCell>
                                            <TableCell>{assignment.quantityAssigned}</TableCell>
                                            <TableCell>{assignment.status}</TableCell>
                                        </TableRow>
                                    )
                                })}
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
                                {referrals.map(referral => (
                                    <TableRow key={referral.id}>
                                        <TableCell className="font-medium">{referral.customer_name}</TableCell>
                                        <TableCell>{format(new Date(referral.timestamp), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>{referral.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
