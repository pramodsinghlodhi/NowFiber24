
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAuth } from '@/contexts/auth-context';
import {
  mockTechnicians,
  mockTasks,
  mockAssignments,
  mockReferrals,
  mockMaterials,
  Technician,
  Task,
  MaterialAssignment,
  Referral,
  Material,
} from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Clock, UserPlus, ListChecks, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

export default function TechnicianReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const techId = params.id as string;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'Admin') {
      router.push('/');
    }
  }, [user, router]);

  const technician = useMemo(() => mockTechnicians.find(t => t.id === techId), [techId]);
  const tasks = useMemo(() => mockTasks.filter(t => t.tech_id === techId), [techId]);
  const assignments = useMemo(() => mockAssignments.filter(a => a.technicianId === techId), [techId]);
  const referrals = useMemo(() => mockReferrals.filter(r => r.tech_id === techId), [techId]);

  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'Completed').length, [tasks]);
  const completionRate = useMemo(() => (tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0), [tasks, completedTasks]);

  if (!user || user.role !== 'Admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Unauthorized. Redirecting...</p>
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
                                    const material = mockMaterials.find(m => m.id === assignment.materialId);
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
