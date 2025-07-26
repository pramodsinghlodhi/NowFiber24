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
import {LayoutDashboard, HardHat, Network, ListTodo, AlertTriangle, BarChart, Settings, LogOut, ExternalLink, ShieldQuestion} from 'lucide-react';
import Logo from '@/components/icons/logo';
import {useAuth} from '@/contexts/auth-context';
import ReferCustomer from '../dashboard/refer-customer';
import FaultDetector from '../dashboard/fault-detector';

const menuItemsTop = [
    {href: '/', icon: LayoutDashboard, label: 'Dashboard'},
    {href: '/alerts', icon: AlertTriangle, label: 'Alerts'},
    {href: '/inventory', icon: Network, label: 'Inventory'},
    {href: '/tasks', icon: ListTodo, label: 'Tasks'},
    {href: '/technicians', icon: HardHat, label: 'Technicians'},
    {href: '/reports', icon: BarChart, label: 'Reports'},
];

const menuItemsBottom = [
  {href: '/settings', icon: Settings, label: 'Settings'},
  {href: '/support', icon: ShieldQuestion, label: 'Support'},
];

export default function AppSidebar() {
  const pathname = usePathname();
  const {user, logout} = useAuth();
  const router = useRouter();

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
              // Conditionally render based on user role
              (item.href !== '/inventory' && item.href !== '/technicians' && item.href !== '/reports' && item.href !== '/settings' || user?.role === 'Admin') && (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton href={item.href} isActive={pathname === item.href} tooltip={item.label}>
                    <item.icon />
                    {item.label}
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
                (item.href !== '/settings' || user?.role === 'Admin') && (
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
