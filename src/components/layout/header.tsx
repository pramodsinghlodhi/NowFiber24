
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User, LogOut, Settings as SettingsIcon, Coffee, Timer, ChevronDown, Moon, Sun, AlertTriangle, ListTodo, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "../ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTheme } from "next-themes";
import { mockNotifications, Notification } from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocationTracker } from "@/hooks/use-location-tracker";

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'New Alert':
            return <AlertTriangle className="h-4 w-4 text-destructive" />;
        case 'Task Assigned':
            return <ListTodo className="h-4 w-4 text-primary" />;
        case 'Material Approved':
            return <Wrench className="h-4 w-4 text-green-500" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
}

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(true);
  const { setTheme } = useTheme();
  const [notifications, setNotifications] = useState(() => mockNotifications);
  
  // Activate location tracking for technicians
  useLocationTracker(user?.role === 'Technician' ? user.id : null, isClockedIn);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    const page = pathname.split('/')[1];
    return page.charAt(0).toUpperCase() + page.slice(1);
  }

  const handleToggleBreak = () => {
    const onBreak = !isOnBreak;
    setIsOnBreak(onBreak);
    toast({
        title: onBreak ? "You are now on break" : "You are back from break",
        description: onBreak ? "Enjoy your coffee!" : "Welcome back to work.",
    })
  }

  const handleClockInOut = () => {
    const clockedIn = !isClockedIn;
    setIsClockedIn(clockedIn);
    toast({
        title: clockedIn ? "Clocked In" : "Clocked Out",
        description: clockedIn ? "Your 8-hour shift has started." : "You have successfully clocked out.",
    })
  }

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, read: true} : n));
    if (notification.href) {
        router.push(notification.href);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold font-headline">{getPageTitle()}</h1>
      </div>
      <SidebarTrigger className="md:hidden" />
      <div className="flex w-full items-center gap-2 md:ml-auto">
        <div className="flex-1 md:flex-grow-0 ml-auto">
          {user?.role === 'Technician' && (
              <div className="flex items-center gap-2">
                    <Button variant={isClockedIn ? 'destructive' : 'default'} size="sm" onClick={handleClockInOut}>
                      <Timer className="mr-0 md:mr-2" />
                      <span className="hidden md:inline">{isClockedIn ? 'Clock Out' : 'Clock In'}</span>
                  </Button>
                    {isClockedIn && (
                      <Button variant={isOnBreak ? 'secondary' : 'outline'} size="sm" onClick={handleToggleBreak}>
                          <Coffee className="mr-0 md:mr-2"/>
                          <span className="hidden md:inline">{isOnBreak ? 'End Break' : 'Take a Break'}</span>
                      </Button>
                  )}
              </div>
          )}
        </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Toggle notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 items-center justify-center text-[10px] text-white bg-red-500">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[350px]">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <DropdownMenuItem key={notification.id} onClick={() => handleNotificationClick(notification)} className={cn("flex items-start gap-3", !notification.read && "bg-accent/50")}>
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1">
                                <p className="text-sm font-medium">{notification.message}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</p>
                            </div>
                            {!notification.read && <div className="h-2 w-2 rounded-full bg-primary mt-1"></div>}
                        </DropdownMenuItem>
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-muted-foreground">No new notifications</p>
                )}
                 <DropdownMenuSeparator />
                 <DropdownMenuItem className="justify-center text-primary">
                    View All Notifications
                 </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border">
                {user && (
                    <>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user && (
                <>
                <DropdownMenuLabel className="flex flex-col">
                    <span>{user.name}</span>
                    <Badge variant="outline" className="mt-1 w-fit">{user.role}</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                </>
            )}
            {user?.role === 'Admin' && (
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push('/support')}>
                <User className="mr-2 h-4 w-4" />
                Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
