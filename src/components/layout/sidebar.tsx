
'use client';

import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {LayoutDashboard, HardHat, Network, ListTodo, AlertTriangle, BarChart, Settings, LogOut, ShieldQuestion, UserPlus, Wrench, Map, Route, Camera, Undo2, MessageSquare} from 'lucide-react';
import Logo from '@/components/icons/logo';
import {useAuth} from '@/contexts/auth-context';
import ReferCustomer from '../dashboard/refer-customer';
import FaultDetector from '../dashboard/fault-detector';
import RequestMaterial from '../materials/request-material-form';
import { Badge } from '../ui/badge';
import { useSidebar } from '@/components/ui/sidebar';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import TraceRoute from '../dashboard/trace-route';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Alert as AlertType, MaterialAssignment } from '@/lib/types';
import { useMemo } from 'react';
import ProofOfReturnForm from '../materials/proof-of-return-form';

const MiniMap = dynamic(() => import('@/components/dashboard/mini-map'), {
  ssr: false,
  loading: () => <div className="h-[150px] w-full bg-muted rounded-md animate-pulse" />,
});


const menuItemsTop = [
    {href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', admin: true, tech: true},
    {href: '/map', icon: Map, label: 'Fullscreen Map', admin: true, tech: true},
    {href: '/alerts', icon: AlertTriangle, label: 'Alerts', admin: true, tech: true},
    {href: '/inventory', icon: Network, label: 'Inventory', admin: true, tech: true},
    {href: '/tasks', icon: ListTodo, label: 'Tasks', admin: true, tech: true},
    {href: '/technicians', icon: HardHat, label: 'Technicians', admin: true, tech: false},
    {href: '/materials', icon: Wrench, label: 'Materials', admin: true, tech: false, notificationKey: 'materials'},
    {href: '/referrals', icon: UserPlus, label: 'Referrals', admin: true, tech: true},
    {href: '/contact', icon: MessageSquare, label: 'Contact Submissions', admin: true, tech: false},
    {href: '/reports', icon: BarChart, label: 'Reports', admin: true, tech: false},
    {href: '/proof-of-work', icon: Camera, label: 'Proof of Work', admin: true, tech: false},
];

const menuItemsBottom = [
  {href: '/settings', icon: Settings, label: 'Settings', admin: true, tech: false},
];

export default function AppSidebar() {
  const pathname = usePathname();
  const {user, logout} = useAuth();
  const { setOpenMobile, state } = useSidebar();
  const router = useRouter();
  
  const alertsQuery = useMemo(() => query(collection(db, 'alerts'), where('severity', '==', 'Critical')), []);
  const { data: criticalAlerts } = useFirestoreQuery<AlertType>(alertsQuery);

  const assignmentsQuery = useMemo(() => query(collection(db, 'assignments'), where('status', '==', 'Requested')), []);
  const { data: requestedAssignments } = useFirestoreQuery<MaterialAssignment>(assignmentsQuery);

  const handleLinkClick = () => {
    setOpenMobile(false);
  }

  const isNavItemVisible = (item: { admin: boolean, tech: boolean }) => {
    if (!user) return false;
    if (user.role === 'Admin' && item.admin) return true;
    if (user.role === 'Technician' && item.tech) return true;
    return false;
  }

  const getNotificationCount = (key: string) => {
    if (user?.role !== 'Admin') return 0;
    if (key === 'materials') {
      return requestedAssignments.length;
    }
    return 0;
  }

  const latestCriticalAlert = criticalAlerts.length > 0 ? criticalAlerts[0] : null;

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
          <Logo className="w-8 h-8 text-primary" />
          <span className="text-xl font-semibold font-headline">NowFiber24</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {state === 'expanded' && latestCriticalAlert && (
             <Card className="mb-2 bg-destructive/10 border-destructive/30">
                <CardHeader className="p-3">
                    <CardTitle className="text-sm font-semibold">Latest Critical Alert</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <MiniMap center={[latestCriticalAlert.lat, latestCriticalAlert.lng]}/>
                    <div className="p-3">
                        <CardDescription>{latestCriticalAlert.issue}</CardDescription>
                        <Button variant="destructive" size="sm" className="w-full mt-2" onClick={() => router.push('/alerts')}>View {criticalAlerts.length} Alerts</Button>
                    </div>
                </CardContent>
            </Card>
        )}
        <SidebarMenu>
          {menuItemsTop.map(
            (item) =>
              isNavItemVisible(item) && (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                    <Link href={item.href} onClick={handleLinkClick}>
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <item.icon />
                                <span>{item.label}</span>
                            </div>
                            {item.notificationKey && getNotificationCount(item.notificationKey) > 0 && (
                                <Badge variant="destructive" className="animate-pulse">{getNotificationCount(item.notificationKey)}</Badge>
                            )}
                        </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="flex flex-col gap-2 p-2">
        {user?.role === 'Technician' && (
          <>
            <ProofOfReturnForm />
            <RequestMaterial />
            <ReferCustomer />
          </>
        )}
         {user?.role === 'Admin' && (
          <>
            <FaultDetector />
            <TraceRoute />
          </>
        )}
        <SidebarMenu>
            {menuItemsBottom.map((item) => (
                isNavItemVisible(item) && (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                           <Link href={item.href} onClick={handleLinkClick}>
                                <item.icon />
                                <span>{item.label}</span>
                           </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            ))}
             <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} tooltip="Logout">
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

    