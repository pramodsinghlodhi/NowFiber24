
"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Label, LabelList } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task, Technician, Alert, Infrastructure } from '@/lib/types';


const chartConfigSeverity = {
    count: { label: 'Alerts' },
    Critical: { label: 'Critical', color: 'hsl(var(--destructive))' },
    High: { label: 'High', color: 'hsl(var(--chart-3))' },
    Medium: { label: 'Medium', color: 'hsl(var(--chart-4))' },
    Low: { label: 'Low', color: 'hsl(var(--chart-5))' },
};

const chartConfigTaskStatus = {
    count: { label: 'Tasks' },
    Completed: { label: 'Completed', color: 'hsl(var(--chart-2))' },
    'In Progress': { label: 'In Progress', color: 'hsl(var(--chart-4))' },
    Pending: { label: 'Pending', color: 'hsl(var(--muted-foreground))' },
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { data: tasks, loading: loadingTasks } = useFirestoreQuery<Task>(collection(db, 'tasks'));
  const { data: technicians, loading: loadingTechs } = useFirestoreQuery<Technician>(collection(db, 'technicians'));
  const { data: alerts, loading: loadingAlerts } = useFirestoreQuery<Alert>(collection(db, 'alerts'));
  const { data: infrastructure, loading: loadingInfra } = useFirestoreQuery<Infrastructure>(collection(db, 'infrastructure'));
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user?.role !== 'Admin') {
      router.push('/');
    }
  }, [authLoading, user, router]);

  const technicianPerformance = useMemo(() => {
    return technicians.map(tech => {
        const assignedTasks = tasks.filter(t => t.tech_id === tech.id);
        const completedTasks = assignedTasks.filter(t => t.status === 'Completed');
        const completionRate = assignedTasks.length > 0 ? (completedTasks.length / assignedTasks.length) * 100 : 0;
        return {
            techId: tech.id,
            name: tech.name,
            assignedTasks: assignedTasks.length,
            completedTasks: completedTasks.length,
            completionRate: Math.round(completionRate)
        };
    });
  }, [technicians, tasks]);
  
  const alertsBySeverity = useMemo(() => {
      const severityCounts = alerts.reduce((acc, alert) => {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      return (Object.keys(chartConfigSeverity) as (keyof typeof chartConfigSeverity)[])
        .filter(key => key !== 'count')
        .map(severity => ({ severity, count: severityCounts[severity] || 0 }));
  }, [alerts]);

  const taskStatusDistribution = useMemo(() => {
      const statusCounts = tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      return Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
  }, [tasks]);

  const alertsByType = useMemo(() => {
      const typeCounts = alerts.reduce((acc, alert) => {
          const device = infrastructure.find(d => d.id === alert.device_id);
          const type = device?.type || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
  }, [alerts, infrastructure]);
  
  const totalAlerts = useMemo(() => alerts.length, [alerts]);
  const loading = authLoading || loadingTasks || loadingTechs || loadingAlerts || loadingInfra;

  if (loading || !user || user.role !== 'Admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading Reports...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Technician Performance</CardTitle>
                        <CardDescription>Overview of task completion rates for each technician.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                            {technicianPerformance.map(tech => (
                                <Card key={tech.techId} className="p-4">
                                    <p className="font-semibold">{tech.name}</p>
                                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                                        <span>{tech.completedTasks} / {tech.assignedTasks} Tasks</span>
                                        <span>{tech.completionRate}%</span>
                                    </div>
                                    <Progress value={tech.completionRate} className="h-2 mt-2" />
                                </Card>
                            ))}
                        </div>

                        {/* Desktop View */}
                        <Table className="hidden md:table">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Technician</TableHead>
                                    <TableHead>Assigned</TableHead>
                                    <TableHead>Completed</TableHead>
                                    <TableHead className="w-[120px]">Completion Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {technicianPerformance.map(tech => (
                                    <TableRow key={tech.techId}>
                                        <TableCell className="font-medium">{tech.name}</TableCell>
                                        <TableCell>{tech.assignedTasks}</TableCell>
                                        <TableCell>{tech.completedTasks}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress value={tech.completionRate} className="h-2" />
                                                <span className="text-muted-foreground text-xs">{tech.completionRate}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Alerts by Severity</CardTitle>
                        <CardDescription>Distribution of network alerts by severity level.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfigSeverity} className="h-[250px] w-full">
                            <BarChart data={alertsBySeverity} layout="vertical" accessibilityLayer>
                                <YAxis 
                                    dataKey="severity"
                                    type="category"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    className="text-sm"
                                    tickFormatter={(value) => chartConfigSeverity[value as keyof typeof chartConfigSeverity]?.label}
                                />
                                <XAxis dataKey="count" type="number" hide />
                                <CartesianGrid horizontal={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="count" layout="vertical" radius={4}>
                                    {alertsBySeverity.map((entry) => (
                                        <Cell key={entry.severity} fill={chartConfigSeverity[entry.severity as keyof typeof chartConfigSeverity]?.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Task Status Distribution</CardTitle>
                        <CardDescription>Current status of all assigned tasks.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center pb-0">
                       <ChartContainer config={chartConfigTaskStatus} className="h-[250px] w-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                                <Pie data={taskStatusDistribution} dataKey="count" nameKey="status">
                                     <LabelList
                                        dataKey="status"
                                        className="fill-background text-sm font-medium"
                                        formatter={(value: keyof typeof chartConfigTaskStatus) => chartConfigTaskStatus[value]?.label}
                                    />
                                     {taskStatusDistribution.map((entry) => (
                                        <Cell key={entry.status} fill={chartConfigTaskStatus[entry.status as keyof typeof chartConfigTaskStatus]?.color} />
                                    ))}
                                </Pie>
                                 <ChartLegend
                                    content={<ChartLegendContent nameKey="status" />}
                                    className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                                    />
                            </PieChart>
                       </ChartContainer>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Alerts Breakdown by Type</CardTitle>
                    <CardDescription>Frequency of different types of network alerts.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={{}} className="h-[300px] w-full">
                        <PieChart>
                             <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie 
                                data={alertsByType} 
                                dataKey="count" 
                                nameKey="type" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={90}
                                innerRadius={60}
                            >
                                <Label
                                    content={({viewBox}) => {
                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                            return (
                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                    <tspan x={viewBox.cx} y={viewBox.cy} className="text-3xl font-bold fill-foreground">{totalAlerts.toLocaleString()}</tspan>
                                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="text-sm fill-muted-foreground">Alerts</tspan>
                                                </text>
                                            )
                                        }
                                    }}
                                />
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="type" />} />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
