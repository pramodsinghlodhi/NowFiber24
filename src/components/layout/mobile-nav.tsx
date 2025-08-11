
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Map, ListTodo, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', tech: true, admin: true },
    { href: '/map', icon: Map, label: 'Map', tech: true, admin: true },
    { href: '/tasks', icon: ListTodo, label: 'Tasks', tech: true, admin: true },
    { href: '/alerts', icon: AlertTriangle, label: 'Alerts', tech: true, admin: true },
];

export default function MobileNav() {
    const pathname = usePathname();
    const { user } = useAuth();

    if (!user) {
        return null;
    }
    
    // Only show mobile nav for technicians on app pages
    if (user.role !== 'Technician') {
        return null;
    }
    
    const isNavItemVisible = (item: { admin: boolean, tech: boolean }) => {
        if (!user) return false;
        if (user.role === 'Admin' && item.admin) return true;
        if (user.role === 'Technician' && item.tech) return true;
        return false;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
            <div className="grid h-16 grid-cols-4 items-center justify-center">
                {menuItems.map(item => isNavItemVisible(item) && (
                    <Link href={item.href} key={item.href} className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                        <item.icon className={cn("h-6 w-6", pathname === item.href && "text-primary")} />
                        <span className={cn("text-xs", pathname === item.href && "text-primary")}>{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
