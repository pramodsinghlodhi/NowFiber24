
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';

const deviceStatusData = [
    { status: 'Online', count: 487, fill: 'var(--color-online)' },
    { status: 'Offline', count: 3, fill: 'var(--color-offline)' },
    { status: 'Maintenance', count: 1, fill: 'var(--color-maintenance)' },
];

const tasksCompletedData = [
    { date: 'Mon', completed: 8 },
    { date: 'Tue', completed: 12 },
    { date: 'Wed', completed: 15 },
    { date: 'Thu', completed: 10 },
    { date: 'Fri', completed: 14 },
    { date: 'Sat', completed: 5 },
    { date: 'Sun', completed: 2 },
];

const chartConfig = {
    completed: {
      label: 'Tasks Completed',
      color: 'hsl(var(--chart-1))',
    },
    online: {
        label: 'Online',
        color: 'hsl(var(--chart-2))',
    },
    offline: {
        label: 'Offline',
        color: 'hsl(var(--chart-3))',
    },
    maintenance: {
        label: 'Maintenance',
        color: 'hsl(var(--chart-4))',
    }
  }

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'Admin') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'Admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Unauthorized. Redirecting...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Task Completion</CardTitle>
                    <CardDescription>Number of tasks completed each day this week.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={tasksCompletedData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                             <YAxis
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="completed" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Device Status Overview</CardTitle>
                    <CardDescription>Current status of all network devices.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <PieChart>
                             <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel/>} />
                            <Pie data={deviceStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={120} label>
                                {deviceStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
