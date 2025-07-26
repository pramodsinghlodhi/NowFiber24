
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
import { Bell, User, LogOut, Settings as SettingsIcon, Coffee, Timer, ChevronDown, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "../ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTheme } from "next-themes";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(true);
  const { setTheme } = useTheme();


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
    return names[0].substring(0, 2).toUpperCase();
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold font-headline">{getPageTitle()}</h1>
      </div>
      <SidebarTrigger className="md:hidden" />
      <div className="flex w-full items-center gap-2 md:ml-auto">
        <div className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            {user?.role === 'Technician' && (
                <div className="flex items-center gap-2">
                     <Button variant={isClockedIn ? 'destructive' : 'default'} size="sm" onClick={handleClockInOut}>
                        <Timer />
                        <span>{isClockedIn ? 'Clock Out' : 'Clock In'}</span>
                    </Button>
                     {isClockedIn && (
                        <Button variant={isOnBreak ? 'secondary' : 'outline'} size="sm" onClick={handleToggleBreak}>
                            <Coffee />
                            <span>{isOnBreak ? 'End Break' : 'Take a Break'}</span>
                        </Button>
                    )}
                </div>
            )}
          </div>
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
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border">
                {user && (
                    <>
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} />
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
