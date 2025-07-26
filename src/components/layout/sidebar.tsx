"use client";

import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  HardHat,
  Network,
  ListTodo,
  AlertTriangle,
  BarChart,
  Settings,
  LogOut,
  Bot,
} from "lucide-react";
import Logo from "@/components/icons/logo";
import FaultDetector from "@/components/dashboard/fault-detector";
import { useAuth } from '@/contexts/auth-context';

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/tasks", icon: ListTodo, label: "Tasks" },
    { href: "/technicians", icon: HardHat, label: "Technicians", roles: ['Admin'] },
    { href: "/inventory", icon: Network, label: "Inventory", roles: ['Admin'] },
    { href: "/alerts", icon: AlertTriangle, label: "Alerts" },
    { href: "/reports", icon: BarChart, label: "Reports", roles: ['Admin'] },
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
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => hasAccess(item) && (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton href={item.href} isActive={pathname === item.href}>
                <item.icon />
                {item.label}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-2">
        <FaultDetector />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="/settings" isActive={pathname === '/settings'}>
              <Settings />
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="/login">
              <LogOut />
              Logout
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
