'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme, type ThemeVariant } from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  ListTodo,
  Timer,
  GitBranch,
  Code2,
  GitPullRequest,
  MessageSquare,
  Users,
  ShieldCheck,
  Bell,
  User,
  Settings,
  Zap,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Palette,
  X,
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

const navGroups: NavGroup[] = [
  {
    title: 'Main',
    defaultOpen: true,
    items: [
      { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: 'Tasks', href: ROUTES.TASKS, icon: <CheckSquare className="h-5 w-5" /> },
      { label: 'Projects', href: ROUTES.PROJECTS, icon: <FolderKanban className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Agile',
    defaultOpen: false,
    items: [
      { label: 'Epics', href: ROUTES.EPICS, icon: <ListTodo className="h-5 w-5" /> },
      { label: 'Sprints', href: ROUTES.SPRINTS, icon: <Timer className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Code',
    defaultOpen: false,
    items: [
      { label: 'Branches', href: ROUTES.BRANCHES, icon: <GitBranch className="h-5 w-5" /> },
      { label: 'Commits', href: ROUTES.COMMITS, icon: <Code2 className="h-5 w-5" /> },
      { label: 'Pull Requests', href: ROUTES.PULL_REQUESTS, icon: <GitPullRequest className="h-5 w-5" /> },
      { label: 'Code Reviews', href: ROUTES.CODE_REVIEWS, icon: <MessageSquare className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Admin',
    defaultOpen: false,
    items: [
      { label: 'Teams', href: ROUTES.TEAMS, icon: <Users className="h-5 w-5" />, adminOnly: true },
      { label: 'Users', href: ROUTES.USERS, icon: <ShieldCheck className="h-5 w-5" />, adminOnly: true },
    ],
  },
  {
    title: 'User',
    defaultOpen: false,
    items: [
      { label: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: <Bell className="h-5 w-5" /> },
      { label: 'Profile', href: ROUTES.PROFILE, icon: <User className="h-5 w-5" /> },
      { label: 'Settings', href: ROUTES.SETTINGS, icon: <Settings className="h-5 w-5" /> },
    ],
  },
];

const themes: { value: ThemeVariant; label: string; description: string }[] = [
  { value: 'slate', label: 'Slate', description: 'Cool blue-grey tones' },
  { value: 'zinc', label: 'Zinc', description: 'Pure neutral grey' },
  { value: 'neutral', label: 'Neutral', description: 'Warm minimal tones' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
  variant: 'desktop' | 'mobile';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Sidebar({ collapsed, onToggle, mobileOpen: _mobileOpen, onMobileClose, variant: sidebarVariant }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme, variant, setVariant } = useAppTheme();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of navGroups) initial[g.title] = g.defaultOpen ?? false;
    for (const g of navGroups) if (g.items.some((i) => i.href === pathname)) initial[g.title] = true;
    return initial;
  });

  useEffect(() => {
    for (const g of navGroups) {
      if (g.items.some((i) => i.href === pathname)) setOpenGroups((p) => ({ ...p, [g.title]: true }));
    }
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  const visibleNavGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => !item.adminOnly || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
    }))
    .filter((g) => g.items.length > 0);

  const compact = collapsed && sidebarVariant === 'desktop';

  const renderNav = () => (
    <div className="flex flex-col h-full">
      <div className={cn('flex items-center gap-3 px-3 py-4', compact && 'justify-center px-2')}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
          <Zap className="h-5 w-5" />
        </span>
        {!compact && (
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-foreground">TMS</p>
            <p className="text-[11px] font-medium leading-3 text-muted-foreground">Task Management</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {visibleNavGroups.map((group) => (
          <div key={group.title} className="mb-1">
            {!compact && (
              <button
                type="button"
                onClick={() => setOpenGroups((p) => ({ ...p, [group.title]: !p[group.title] }))}
                className="flex items-center justify-between w-full px-2 py-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="truncate">{group.title}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform duration-200',
                    openGroups[group.title] ? '' : '-rotate-90',
                  )}
                />
              </button>
            )}
            <div className={cn('space-y-0.5', compact ? '' : openGroups[group.title] ? '' : 'hidden')}>
              {group.items.map((item) => {
                const active = isActive(item.href);
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                      compact && 'justify-center px-2',
                    )}
                  >
                    <span className={cn('shrink-0', active && 'text-foreground')}>{item.icon}</span>
                    {!compact && <span className="truncate">{item.label}</span>}
                  </Link>
                );

                if (compact) {
                  return link;
                }
                return link;
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-border p-3 space-y-2', compact && 'p-2 space-y-1')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={cn('w-full', compact && 'h-8 w-8 p-0 justify-center')}>
              <Palette className="h-4 w-4" />
              {!compact && <span className="ml-2">Theme</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
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
          </DropdownMenuContent>
        </DropdownMenu>

        {!compact && (
          <>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Zap className="h-4 w-4 mr-2" />
                {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
              <Button variant="destructive" size="sm" className="flex-1" onClick={async () => { await logout(); window.location.href = ROUTES.LOGIN; }}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || ''} alt={user?.name || 'User'} />
                <AvatarFallback className="text-xs">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (sidebarVariant === 'mobile') {
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
        <aside className="fixed inset-y-0 left-0 w-72 bg-background border-r border-border shadow-xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold">Menu</span>
            <Button variant="ghost" size="icon" onClick={onMobileClose} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {renderNav()}
          </div>
        </aside>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r border-border bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {renderNav()}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-16 h-6 w-6 rounded-full border border-border bg-background shadow-sm z-50"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
      </Button>
    </aside>
  );
}
