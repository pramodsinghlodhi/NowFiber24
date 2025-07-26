import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { mockAlerts, mockTasks, mockDevices, mockTechnicians, mockStats } from '@/lib/data';
import StatsCard from '@/components/dashboard/stats-card';
import MapView from '@/components/dashboard/map-view';
import AlertsList from '@/components/dashboard/alerts-list';
import TasksList from '@/components/dashboard/tasks-list';

export default function Home() {
  const stats = mockStats;
  const devices = mockDevices;
  const technicians = mockTechnicians;
  const alerts = mockAlerts;
  const tasks = mockTasks;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Online Devices" value={stats.onlineDevices} icon="wifi" />
            <StatsCard title="Active Alerts" value={stats.activeAlerts} icon="siren" variant="destructive" />
            <StatsCard title="Technicians On-Duty" value={stats.techniciansOnDuty} icon="users" />
            <StatsCard title="Tasks Completed" value={stats.tasksCompletedToday} icon="check-circle" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-1 lg:col-span-4">
              <MapView devices={devices} technicians={technicians} alerts={alerts} />
            </div>
            <div className="col-span-1 lg:col-span-3">
              <div className="flex flex-col gap-4">
                <AlertsList alerts={alerts} />
                <TasksList tasks={tasks} />
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
