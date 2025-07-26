'use client';

import {usePathname, useRouter} from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {LayoutDashboard, HardHat, Network, ListTodo, AlertTriangle, BarChart, Settings, LogOut, ExternalLink, ShieldQuestion, Briefcase} from 'lucide-react';
import {useAuth} from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const menuItemsTop = [
    {href: '/', icon: LayoutDashboard, label: 'Dashboard'},
    {href: '/alerts', icon: AlertTriangle, label: 'PODA Portal'},
    {href: '/inventory', icon: Network, label: 'App Provider Portal'},
    {href: '/tasks', icon: ListTodo, label: 'DOT Registration'},
    {href: '/reports', icon: BarChart, label: 'PN-WANI Guideline'},
];

export default function AppSidebar() {
  const pathname = usePathname();
  const {user, logout} = useAuth();
  const router = useRouter();

  const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarContent className="p-4">
        <SidebarMenu>
            <SidebarMenuItem className='mb-4'>
                <SidebarMenuButton href="/" tooltip="POD Portal" isActive={pathname === '/'} variant="default" className='bg-primary/10 text-primary hover:bg-primary/20 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground'>
                    <Briefcase />
                    POD Portal
                </SidebarMenuButton>
            </SidebarMenuItem>

          {menuItemsTop.map(
            (item) =>
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton href={item.href} isActive={pathname === item.href} tooltip={item.label} className="text-gray-600 hover:bg-gray-100 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold">
                    <item.icon />
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="flex flex-col gap-2 p-4">
        {user && (
             <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.id}@untitled.com</p>
                </div>
                <button onClick={logout}>
                    <LogOut className="h-5 w-5 text-gray-500 hover:text-destructive" />
                </button>
            </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
