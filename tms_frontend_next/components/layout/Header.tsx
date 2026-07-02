'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ROUTES, BACKEND_URL } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme, type ThemeVariant } from '@/hooks/useAppTheme';
import { Button } from '@/components/ui/button';
import { isAdministrator } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Menu, X, LogOut, LayoutDashboard, FolderKanban, CheckSquare, Users, User, Settings, ShieldCheck, Zap, ChevronDown, Palette, ListTodo, Timer, Bell, GitBranch, Code2, GitPullRequest, MessageSquare, MoreHorizontal } from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  group?: 'Main' | 'Agile' | 'Code' | 'Admin' | 'User';
};

const navGroups: Record<string, string> = {
  Main: 'Main',
  Agile: 'Agile',
  Code: 'Code',
  Admin: 'Admin',
  User: 'User',
};

const PRIMARY_ITEMS = new Set([
  'Dashboard',
  'Tasks',
  'Projects',
  'Pull Requests',
  'Code Reviews',
  'Teams',
]);

export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { theme, setTheme, variant, setVariant } = useAppTheme();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Main: true,
    Agile: false,
    Code: false,
    Admin: false,
    User: false,
  });
  const lastScrollY = useRef(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const previousY = lastScrollY.current;
      if (currentY > previousY && currentY > 96) setIsVisible(false);
      else if (currentY < previousY - 8 || currentY < 16) setIsVisible(true);
      lastScrollY.current = Math.max(currentY, 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.LOGIN);
    router.refresh();
  };

  const themes: { value: ThemeVariant; label: string; description: string }[] = [
    { value: 'slate', label: 'Slate', description: 'Cool blue-grey tones' },
    { value: 'zinc', label: 'Zinc', description: 'Pure neutral grey' },
    { value: 'neutral', label: 'Neutral', description: 'Warm minimal tones' },
  ];

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" />, group: 'Main' },
    { label: 'Tasks', href: ROUTES.TASKS, icon: <CheckSquare className="h-4 w-4" />, group: 'Main' },
    { label: 'Projects', href: ROUTES.PROJECTS, icon: <FolderKanban className="h-4 w-4" />, group: 'Main' },
    { label: 'Epics', href: ROUTES.EPICS, icon: <ListTodo className="h-4 w-4" />, group: 'Agile' },
    { label: 'Sprints', href: ROUTES.SPRINTS, icon: <Timer className="h-4 w-4" />, group: 'Agile' },
    { label: 'Branches', href: ROUTES.BRANCHES, icon: <GitBranch className="h-4 w-4" />, group: 'Code' },
    { label: 'Commits', href: ROUTES.COMMITS, icon: <Code2 className="h-4 w-4" />, group: 'Code' },
    { label: 'Pull Requests', href: ROUTES.PULL_REQUESTS, icon: <GitPullRequest className="h-4 w-4" />, group: 'Code' },
    { label: 'Code Reviews', href: ROUTES.CODE_REVIEWS, icon: <MessageSquare className="h-4 w-4" />, group: 'Code' },
    { label: 'Teams', href: ROUTES.TEAMS, icon: <Users className="h-4 w-4" />, group: 'Admin' },
    { label: 'Users', href: ROUTES.USERS, icon: <ShieldCheck className="h-4 w-4" />, adminOnly: true, group: 'Admin' },
    { label: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: <Bell className="h-4 w-4" />, group: 'User' },
    { label: 'Profile', href: ROUTES.PROFILE, icon: <User className="h-4 w-4" />, group: 'User' },
    { label: 'Settings', href: ROUTES.SETTINGS, icon: <Settings className="h-4 w-4" />, group: 'User' },
  ];

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdministrator(user?.role as any));

  const primaryItems = visibleNavItems.filter((item) => PRIMARY_ITEMS.has(item.label));
  const moreItems = visibleNavItems.filter((item) => !PRIMARY_ITEMS.has(item.label));

  if (isLoading) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
        </div>
      </header>
    );
  }

  const themeLabel = themes.find((t) => t.value === variant)?.label ?? 'Slate';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <nav className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME} className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Zap className="h-5 w-5" />
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-bold tracking-tight text-foreground">TMS</p>
            <p className="text-[11px] font-medium leading-3 text-muted-foreground">Task Management</p>
          </div>
        </Link>

        {isAuthenticated ? (
          <>
            <div className="hidden items-center gap-1 lg:flex flex-wrap">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="hidden items-center gap-1 md:flex lg:hidden">
              {primaryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 h-9 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                    <span>More</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {moreItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                        {item.icon}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-9">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.avatar ? `${BACKEND_URL}${user.avatar}` : ''} alt={user?.name || 'User'} />
                      <AvatarFallback className="text-xs">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden lg:inline">{user?.name || 'User'}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(ROUTES.PROFILE)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(ROUTES.SETTINGS)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9">
                    <Palette className="h-4 w-4" />
                    <span className="sr-only">Theme options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Theme</p>
                      <p className="text-xs leading-none text-muted-foreground">{themeLabel} / {theme === 'dark' ? 'Dark' : 'Light'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Palette className="mr-2 h-4 w-4" />
                      Color Theme
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={variant} onValueChange={(val) => setVariant(val as ThemeVariant)}>
                        {themes.map((th) => (
                          <DropdownMenuRadioItem key={th.value} value={th.value}>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{th.label}</span>
                              <span className="text-xs text-muted-foreground">{th.description}</span>
                            </div>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    <Zap className="mr-2 h-4 w-4" />
                    {theme === 'dark' ? 'Light' : 'Dark'} mode
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground h-9 w-9"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href={ROUTES.REQUEST_ACCESS}>
              <Button size="sm">Request Access</Button>
            </Link>
          </div>
        )}
      </nav>

      {mobileOpen && isAuthenticated && (
        <div className="fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4 mx-4 mt-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar ? `${BACKEND_URL}${user.avatar}` : ''} alt={user?.name || 'User'} />
                <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {Object.entries(navGroups).map(([groupName]) => {
                const groupItems = visibleNavItems.filter((item) => item.group === groupName);
                if (groupItems.length === 0) return null;
                const isExpanded = expandedGroups[groupName] ?? true;
                return (
                  <div key={groupName}>
                    <button
                      type="button"
                      className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                      onClick={() => setExpandedGroups((prev) => ({ ...prev, [groupName]: !isExpanded }))}
                    >
                      <span>{groupName}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
                    </button>
                    {isExpanded && (
                      <div className="ml-2 space-y-1 py-1">
                        {groupItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setMobileOpen(false)}
                          >
                            {item.icon}
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border px-4 py-4 space-y-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Color: {themeLabel}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-full">
                  <DropdownMenuRadioGroup value={variant} onValueChange={(val) => { setVariant(val as ThemeVariant); }}>
                    {themes.map((th) => (
                      <DropdownMenuRadioItem key={th.value} value={th.value}>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{th.label}</span>
                          <span className="text-xs text-muted-foreground">{th.description}</span>
                        </div>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
