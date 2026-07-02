'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme, type ThemeVariant } from '@/hooks/useAppTheme';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Menu, Palette, Zap, ChevronDown, LogOut, User, Settings, Bell } from 'lucide-react';
import { ROUTES, BACKEND_URL } from '@/constants';
import { notificationService } from '@/services/notifications.service';

const themes: { value: ThemeVariant; label: string; description: string }[] = [
  { value: 'slate', label: 'Slate', description: 'Cool blue-grey tones' },
  { value: 'zinc', label: 'Zinc', description: 'Pure neutral grey' },
  { value: 'neutral', label: 'Neutral', description: 'Warm minimal tones' },
  { value: 'blue', label: 'Ocean Blue', description: 'Rich oceanic blues' },
  { value: 'green', label: 'Forest', description: 'Natural green tones' },
  { value: 'violet', label: 'Violet', description: 'Creative purple hues' },
  { value: 'rose', label: 'Rose', description: 'Warm rose accents' },
];

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme, variant, setVariant } = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    notificationService.getUnreadCount().then((res) => {
      if (!cancelled) setUnreadCount(res.unread);
    });
    return () => { cancelled = true; };
  }, [pathname]);

  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last) return 'Dashboard';
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
  };

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden h-11 w-11" onClick={onMenuClick} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-11 w-11 relative"
            onClick={() => router.push(ROUTES.NOTIFICATIONS)}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-5 rounded-full px-1 text-[10px] font-semibold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-11 w-11"
            onClick={() => router.push(ROUTES.PROFILE)}
            aria-label="Profile"
          >
            <User className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-11 w-11"
            onClick={() => router.push(ROUTES.SETTINGS)}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground h-11 w-11" aria-label="Theme options">
                <Palette className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-base font-medium leading-none">Theme</p>
                  <p className="text-sm leading-none text-muted-foreground">{themes.find((t) => t.value === variant)?.label} / {theme === 'dark' ? 'Dark' : 'Light'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 h-5 w-5" />
                  Color Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={variant} onValueChange={(val) => setVariant(val as ThemeVariant)}>
                    {themes.map((th) => (
                      <DropdownMenuRadioItem key={th.value} value={th.value}>
                        <div className="flex flex-col">
                          <span className="text-base font-medium">{th.label}</span>
                          <span className="text-sm text-muted-foreground">{th.description}</span>
                        </div>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                <Zap className="mr-2 h-5 w-5" />
                {theme === 'dark' ? 'Light' : 'Dark'} mode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 h-11">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar ? `${BACKEND_URL}${user.avatar}` : ''} alt={user?.name || 'User'} />
                  <AvatarFallback className="text-sm">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-base font-medium hidden lg:inline">{user?.name || 'User'}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-base font-medium leading-none">{user?.name || 'User'}</p>
                  <p className="text-sm leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => { await logout(); router.push(ROUTES.LOGIN); }} className="text-destructive">
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
