'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { isAdministrator, type UserRole } from '@/types';
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
  Zap,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
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
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose: () => void;
  variant: 'desktop' | 'mobile';
}

export function Sidebar({ collapsed, onToggle, onMobileClose, variant: sidebarVariant }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

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
      items: g.items.filter((item) => !item.adminOnly || isAdministrator(user?.role as UserRole)),
    }))
    .filter((g) => g.items.length > 0);

  const compact = collapsed && sidebarVariant === 'desktop';

  const renderNav = () => (
    <div className="flex flex-col h-full">
      <div className={cn('flex items-center gap-3 px-3 py-4', compact && 'justify-center px-2')}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
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
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      onMobileClose();
                      router.push(item.href);
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all duration-200',
                      'hover:bg-accent/80 hover:text-accent-foreground',
                      active ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10' : 'text-muted-foreground',
                      compact && 'justify-center px-2',
                    )}
                  >
                    <span className={cn('shrink-0', active && 'text-foreground')}>{item.icon}</span>
                    {!compact && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
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
