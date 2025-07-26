
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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {LayoutDashboard, HardHat, Network, ListTodo, AlertTriangle, BarChart, Settings, LogOut, ExternalLink, ShieldQuestion, UserPlus, Wrench} from 'lucide-react';
import Logo from '@/components/icons/logo';
import {useAuth} from '@/contexts/auth-context';
import ReferCustomer from '../dashboard/refer-customer';
import FaultDetector from '../dashboard/fault-detector';
import RequestMaterial from '../materials/request-material-form';
import { mockAssignments } from '@/lib/data';
import { Badge } from '../ui/badge';

const menuItemsTop = [
    {href: '/', icon: LayoutDashboard, label: 'Dashboard', admin: true, tech: true},
    {href: '/alerts', icon: AlertTriangle, label: 'Alerts', admin: true, tech: true},
    {href: '/inventory', icon: Network, label: 'Inventory', admin: true, tech: false},
    {href: '/tasks', icon: ListTodo, label: 'Tasks', admin: true, tech: true},
    {href: '/technicians', icon: HardHat, label: 'Technicians', admin: true, tech: false},
    {href: '/materials', icon: Wrench, label: 'Materials', admin: true, tech: true, notificationKey: 'materials'},
    {href: '/referrals', icon: UserPlus, label: 'Referrals', admin: true, tech: true},
    {href: '/reports', icon: BarChart, label: 'Reports', admin: true, tech: false},
];

const menuItemsBottom = [
  {href: '/settings', icon: Settings, label: 'Settings', admin: true, tech: false},
  {href: '/support', icon: ShieldQuestion, label: 'Support', admin: true, tech: true},
];

export default function AppSidebar() {
  const pathname = usePathname();
  const {user, logout} = useAuth();
  const router = useRouter();

  const isNavItemVisible = (item: { admin: boolean, tech: boolean }) => {
    if (!user) return false;
    if (user.role === 'Admin' && item.admin) return true;
    if (user.role === 'Technician' && item.tech) return true;
    return false;
  }

  const getNotificationCount = (key: string) => {
    if (user?.role !== 'Admin') return 0;
    if (key === 'materials') {
      return mockAssignments.filter(a => a.status === 'Requested').length;
    }
    return 0;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Logo className="w-8 h-8 text-primary" />
          <span className="text-xl font-semibold font-headline">FiberVision</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItemsTop.map(
            (item) =>
              isNavItemVisible(item) && (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton href={item.href} isActive={pathname === item.href} tooltip={item.label}>
                    <div className="flex items-center gap-2 w-full">
                        <item.icon />
                        <span>{item.label}</span>
                         {item.notificationKey && getNotificationCount(item.notificationKey) > 0 && (
                            <Badge className="ml-auto animate-pulse">{getNotificationCount(item.notificationKey)}</Badge>
                        )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="flex flex-col gap-2 p-4">
        {user?.role === 'Technician' && (
          <>
            <RequestMaterial />
            <ReferCustomer />
          </>
        )}
         {user?.role === 'Admin' && (
          <>
            <FaultDetector />
          </>
        )}
        <SidebarMenu>
            {menuItemsBottom.map((item) => (
                isNavItemVisible(item) && (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton href={item.href} isActive={pathname === item.href} tooltip={item.label}>
                            <item.icon />
                            {item.label}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            ))}
             <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} tooltip="Logout">
                    <LogOut />
                    Logout
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
