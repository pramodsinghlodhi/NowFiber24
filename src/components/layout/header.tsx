
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
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User, LogOut, Settings as SettingsIcon, Coffee, Timer, ChevronDown, Moon, Sun, AlertTriangle, ListTodo, Wrench, MessageSquare, CheckCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "../ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { Notification } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocationTracker } from "@/hooks/use-location-tracker";
import { collection, doc, query, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateTechnicianStatus } from "@/app/actions/technician-actions";
import { clearAllNotifications } from "@/app/actions";


const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'New Alert':
            return <AlertTriangle className="h-4 w-4 text-destructive" />;
        case 'Task Assigned':
            return <ListTodo className="h-4 w-4 text-primary" />;
        case 'Material Approved':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'Notice':
             return <MessageSquare className="h-4 w-4 text-yellow-500" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
}

export default function Header() {
  const { user, technician, logout, settings } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const isClockedIn = technician?.isActive ?? false;
  const isGpsTrackingEnabled = settings?.technicianManagement?.enableGpsTracking ?? false;

  // Activate location tracking for technicians only if the setting is enabled and they are clocked in
  useLocationTracker(user?.role === 'Technician' ? user.id : null, isClockedIn && isGpsTrackingEnabled);

  useEffect(() => {
    if (user?.uid) {
        const notifsRef = collection(db, `users/${user.uid}/notifications`);
        const q = query(notifsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(notifs);
        });

        return () => unsubscribe();
    }
  }, [user]);


  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const handleLogout = () => {
    logout();
    router.push('/');
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
    const segments = pathname.split('/').filter(Boolean);
    if(segments.length === 0 || segments[0] !== 'app') {
       const pageName = segments[segments.length -1] || 'dashboard';
        if(pageName === 'dashboard') return 'Dashboard';
        return pageName.charAt(0).toUpperCase() + pageName.slice(1);
    }
     const pageName = segments[segments.length - 1] || 'dashboard';
    if(pageName === 'dashboard') return 'Dashboard';
    return pageName.charAt(0).toUpperCase() + pageName.slice(1);
  }

  const handleToggleBreak = async () => {
    if (!technician) return;
    const newStatus = technician.status === 'on-break' ? 'available' : 'on-break';
    
    const result = await updateTechnicianStatus(technician.id, { status: newStatus });

    if (result.success) {
      toast({
        title: newStatus === 'on-break' ? "You are now on break" : "You are back from break",
        description: newStatus === 'on-break' ? "Enjoy your coffee!" : "Welcome back to work.",
      });
    } else {
      toast({ title: "Error", description: result.message || "Could not update your break status.", variant: "destructive" });
    }
  }

  const handleClockInOut = async () => {
    if (!technician) return;
    const newIsActive = !technician.isActive;
    const result = await updateTechnicianStatus(technician.id, { isActive: newIsActive });

    if (result.success) {
        toast({
            title: newIsActive ? "Clocked In" : "Clocked Out",
            description: newIsActive ? "Your 8-hour shift has started." : "You have successfully clocked out.",
        });
    } else {
        toast({ title: "Error", description: result.message || "Could not update your clock-in status.", variant: "destructive" });
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!user) return;
    
    // Mark as read in Firestore
    if (!notification.read) {
        const notifDocRef = doc(db, `users/${user.uid}/notifications`, notification.id);
        await updateDoc(notifDocRef, { read: true });
    }

    if (notification.href) {
        router.push(notification.href);
    }
  }
  
  const handleClearAllNotifications = async () => {
    if (!user) return;
    const result = await clearAllNotifications(user.uid);
    if (result.success) {
        toast({ title: 'Notifications Cleared', description: 'Your notification list is empty.' });
    } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
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
          {user?.role === 'Technician' && technician && (
              <div className="flex items-center gap-2">
                    <Button variant={isClockedIn ? 'destructive' : 'default'} size="sm" onClick={handleClockInOut}>
                      <Timer className="mr-0 md:mr-2" />
                      <span className="hidden md:inline">{isClockedIn ? 'Clock Out' : 'Clock In'}</span>
                  </Button>
                    {isClockedIn && (
                      <Button variant={technician.status === 'on-break' ? 'secondary' : 'outline'} size="sm" onClick={handleToggleBreak}>
                          <Coffee className="mr-0 md:mr-2"/>
                          <span className="hidden md:inline">{technician.status === 'on-break' ? 'End Break' : 'Take a Break'}</span>
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
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleClearAllNotifications}>
                            <Trash2 className="mr-1 h-3 w-3" />
                            Clear All
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    <DropdownMenuGroup className="max-h-80 overflow-y-auto">
                        {notifications.map(notification => (
                            <DropdownMenuItem key={notification.id} onClick={() => handleNotificationClick(notification)} className={cn("flex items-start gap-3 cursor-pointer", !notification.read && "bg-accent/50")}>
                                {getNotificationIcon(notification.type)}
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">{notification.title}</p>
                                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true })}</p>
                                </div>
                                {!notification.read && <div className="h-2 w-2 rounded-full bg-primary mt-1"></div>}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                ) : (
                    <p className="p-4 text-center text-sm text-muted-foreground">No new notifications</p>
                )}
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
