'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/users.service';
import { isAdministrator, type User, type UserRole } from '@/types';
import { Plus, Search, Trash2, Users2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function UsersPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'EMPLOYEE' as UserRole });

  const isAdmin = isAdministrator(user?.role);

  const loadUsers = useCallback(async () => {
    setError(null);
    try {
      const response = await userService.getAll({
        search: search || undefined,
        page,
        limit: 10,
      });
      setUsersList(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    }
  }, [search, page]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated, loadUsers]);

  const handleCreate = async () => {
    if (!newUser.email || !newUser.password) return;
    setCreating(true);
    setError(null);
    try {
      const created = await userService.create({
        email: newUser.email,
        password: newUser.password,
        name: newUser.name || undefined,
        role: newUser.role,
      });
      setUsersList((prev) => [created, ...prev]);
      setNewUser({ email: '', password: '', name: '', role: 'EMPLOYEE' });
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await userService.update(userId, { role: newRole });
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await userService.delete(userId);
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'default';
      case 'ADMIN': return 'secondary';
      case 'MANAGER': return 'outline';
      default: return 'secondary';
    }
  };

  if (authLoading || !isAuthenticated) {
        return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
  );
}

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Team administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Users</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage workspace members and keep access aligned with your operating model.</p>
          </div>
          {isAdmin && (
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Add User
                </Button>
              </DialogTrigger>
               <DialogContent onPointerDownOutside={(e) => {
                 const target = e.target as HTMLElement;
                 if (target.closest('[role="listbox"]') || target.closest('[role="option"]') || target.closest('[data-radix-popper-content-wrapper]')) {
                   e.preventDefault();
                 }
               }}>
                <DialogHeader>
                  <DialogTitle>Add User</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <Input id="user-email" type="email" value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} placeholder="user@company.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Full name</Label>
                    <Input id="user-name" value={newUser.name} onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-password">Password</Label>
                    <Input id="user-password" type="password" value={newUser.password} onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-role">Role</Label>
                     <Select value={newUser.role} onValueChange={(val) => setNewUser((prev) => ({ ...prev, role: val as UserRole }))}>
                       <SelectTrigger className="relative z-[200]">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="relative z-[200]">
                         <SelectItem value="EMPLOYEE">Employee</SelectItem>
                         <SelectItem value="MANAGER">Manager</SelectItem>
                         <SelectItem value="ADMIN">Admin</SelectItem>
                         <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                       </SelectContent>
                     </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadUsers}>Retry</Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">All Users</CardTitle>
                <p className="text-sm text-muted-foreground">View the full team roster and adjust access quickly.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2 px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">User</TableHead>
                    <TableHead className="min-w-[120px]">Role</TableHead>
                    <TableHead className="min-w-[140px]">Department</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="text-right min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {usersList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8">
                        <Users2 className="h-8 w-8" />
                        <p className="font-medium text-foreground">No users found</p>
                        <p className="text-sm">Try a different search term or invite a teammate to get started.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  usersList.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{u.name}</p>
                          <p className="text-base text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(u.role)}>
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.department || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? 'default' : 'secondary'} className="text-sm">
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isAdmin && (
                              <Select value={u.role} onValueChange={(val) => handleRoleChange(u.id, val as UserRole)}>
                                <SelectTrigger className="h-10 w-[140px] relative z-[200]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="relative z-[200]">
                                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                  <SelectItem value="MANAGER">Manager</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                          )}
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive" onClick={() => handleDelete(u.id)} aria-label="Delete user">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
              </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-base text-muted-foreground">
                    Showing {usersList.length} of {totalItems} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <span className="text-base text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
            )}
           </CardContent>
          </Card>
      </div>
  );
}

