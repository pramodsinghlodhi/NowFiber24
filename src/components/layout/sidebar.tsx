'use client';

import {usePathname} from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {LayoutDashboard, HardHat, Network, ListTodo, AlertTriangle, BarChart, Settings} from 'lucide-react';
import Logo from '@/components/icons/logo';
import FaultDetector from '@/components/dashboard/fault-detector';
import {useAuth} from '@/contexts/auth-context';
import {Button} from '../ui/button';

export default function AppSidebar() {
  const pathname = usePathname();
  const {user, logout} = useAuth();

  const menuItems = [
    {href: '/', icon: LayoutDashboard, label: 'Dashboard', tooltip: 'Dashboard'},
    {href: '/tasks', icon: ListTodo, label: 'Tasks', tooltip: 'Tasks'},
    {href: '/alerts', icon: AlertTriangle, label: 'Alerts', tooltip: 'Alerts'},
    {href: '/technicians', icon: HardHat, label: 'Technicians', tooltip: 'Technicians', roles: ['Admin']},
    {href: '/inventory', icon: Network, label: 'Inventory', tooltip: 'Inventory', roles: ['Admin']},
    {href: '/reports', icon: BarChart, label: 'Reports', tooltip: 'Reports', roles: ['Admin']},
  ];

  const hasAccess = (item: any) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold font-headline text-primary">FiberVision</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map(
            item =>
              hasAccess(item) && (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton href={item.href} isActive={pathname === item.href} tooltip={item.tooltip}>
                    <item.icon />
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="flex flex-col gap-2 p-2">
        <FaultDetector />
        <SidebarMenu>
          {hasAccess({roles: ['Admin']}) && (
            <SidebarMenuItem>
              <SidebarMenuButton href="/settings" isActive={pathname === '/settings'} tooltip="Settings">
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <Button variant="outline" className="w-full justify-start" onClick={logout}>
              Log Out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
