'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { teamService } from '@/services/teams.service';
import { userService } from '@/services/users.service';
import { Team, TeamMember, User, TeamMemberRole } from '@/types';
import { ROUTES, ERROR_MESSAGES } from '@/constants';
import { Plus, Users, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { isAdministrator } from '@/types';

export default function TeamsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [membersByTeamId, setMembersByTeamId] = useState<Record<string, TeamMember[]>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', department: '' });
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRole, setMemberRole] = useState<TeamMemberRole>(TeamMemberRole.MEMBER);

  const isAdmin = isAdministrator(user?.role);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await teamService.getAll({ limit: 100 });
      setTeams(response.data);
      const members = await Promise.all(
        response.data.map(async (team) => {
          const result = await teamService.getMembers(team.id);
          return { teamId: team.id, members: result.data };
        }),
      );
      setMembersByTeamId(
        members.reduce((acc, item) => {
          acc[item.teamId] = item.members;
          return acc;
        }, {} as Record<string, TeamMember[]>),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getAll({ limit: 100 });
      setUsers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTeams();
      loadUsers();
    }
  }, [isAuthenticated, loadTeams, loadUsers]);

  const openEdit = (team: Team) => {
    setFormData({ name: team.name, description: team.description || '', department: team.department || '' });
    setSelectedTeam(team);
    setShowEdit(true);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const team = await teamService.create({ name: formData.name.trim(), description: formData.description.trim() || undefined });
      setTeams((prev) => [team, ...prev]);
      setShowCreate(false);
      setFormData({ name: '', description: '', department: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTeam) return;
    setCreating(true);
    setError(null);
    try {
      await teamService.update(selectedTeam.id, { name: formData.name.trim(), description: formData.description.trim() || undefined });
      setTeams((prev) => prev.map((t) => (t.id === selectedTeam.id ? { ...t, name: formData.name, description: formData.description } : t)));
      setShowEdit(false);
      setFormData({ name: '', description: '', department: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('Delete this team?')) return;
    setError(null);
    try {
      await teamService.delete(teamId);
      setTeams((prev) => prev.filter((team) => team.id !== teamId));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !memberUserId) return;
    setError(null);
    try {
      const member = await teamService.addMember(selectedTeam.id, memberUserId, memberRole);
      setMembersByTeamId((prev) => ({
        ...prev,
        [selectedTeam.id]: [...(prev[selectedTeam.id] || []), member],
      }));
      setMemberUserId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    if (!confirm('Remove this member from the team?')) return;
    setError(null);
    try {
      await teamService.removeMember(teamId, userId);
      setMembersByTeamId((prev) => ({
        ...prev,
        [teamId]: (prev[teamId] || []).filter((member) => member.userId !== userId),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  const handleMemberRoleChange = async (teamId: string, userId: string, role: TeamMemberRole) => {
    setError(null);
    try {
      await teamService.updateMemberRole(teamId, userId, role);
      setMembersByTeamId((prev) => ({
        ...prev,
        [teamId]: (prev[teamId] || []).map((member) => (member.userId === userId ? { ...member, role } : member)),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  if (authLoading || loading) {
        return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const teamMembers = selectedTeam ? membersByTeamId[selectedTeam.id] || [] : [];
  const availableUsers = users.filter((u) => !teamMembers.some((m) => m.userId === u.id));

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Teams</h1>
            <p className="mt-1 text-base text-muted-foreground">Manage team membership and ownership.</p>
          </div>
          {isAdmin && (
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-5 w-5" />
                  New Team
                </Button>
              </DialogTrigger>
             <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('[role="listbox"]') || target.closest('[role="option"]') || target.closest('[data-radix-popper-content-wrapper]')) {
                  e.preventDefault();
                }
              }}>
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team name</Label>
                  <Input id="team-name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Team name" required />
                 </div>
                 <div className="space-y-2">
                  <Label htmlFor="team-description">Description</Label>
                  <Textarea id="team-description" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} placeholder="Team description" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-department">Department</Label>
                  <Input id="team-department" value={formData.department} onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))} placeholder="Department" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </div>
             </DialogContent>
            </Dialog>
          )}
{isAdmin && (
            <Dialog open={showEdit} onOpenChange={setShowEdit}>
              <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('[role="listbox"]') || target.closest('[role="option"]') || target.closest('[data-radix-popper-content-wrapper]')) {
                    e.preventDefault();
                  }
                }}>
                <DialogHeader>
                  <DialogTitle>Edit Team</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-team-name">Team name</Label>
                    <Input id="edit-team-name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Team name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-team-description">Description</Label>
                    <Textarea id="edit-team-description" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} placeholder="Team description" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-team-department">Department</Label>
                    <Input id="edit-team-department" value={formData.department} onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))} placeholder="Department" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
                   <Button onClick={handleUpdate} disabled={creating}>
                     {creating ? 'Saving...' : 'Save'}
                   </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadTeams}>Retry</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {teams.length === 0 && !error && (
            <Card className="col-span-full border-dashed">
              <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
                No teams yet. Create one to get started.
              </CardContent>
            </Card>
          )}
          {teams.map((team) => (
            <Card key={team.id} className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold truncate">{team.name}</CardTitle>
                    {team.description && <CardDescription className="mt-1 line-clamp-2">{team.description}</CardDescription>}
                     {team.department && <p className="text-sm text-muted-foreground mt-2 truncate">{team.department}</p>}
                   </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => { setSelectedTeam(team); setShowMembers(true); }} aria-label="View members">
                        <Users className="h-5 w-5" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => openEdit(team)} aria-label="Edit team">
                            <Pencil className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive" onClick={() => handleDelete(team.id)} aria-label="Delete team">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-base text-muted-foreground">
                  <span>{membersByTeamId[team.id]?.length || 0} members</span>
                  <Badge variant={team.isActive ? 'default' : 'secondary'} className="text-sm">
                    {team.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
</div>
      </div>

      <Dialog open={showMembers && !!selectedTeam} onOpenChange={setShowMembers}>
         <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => {
           const target = e.target as HTMLElement;
           if (target.closest('[role="listbox"]') || target.closest('[role="option"]') || target.closest('[data-radix-popper-content-wrapper]')) {
             e.preventDefault();
           }
         }}>
          <DialogHeader>
            <DialogTitle>{selectedTeam?.name} members</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-base font-medium">User</Label>
                <Select value={memberUserId || undefined} onValueChange={(val) => setMemberUserId(val || '')}>
                  <SelectTrigger className="relative z-[200]">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="relative z-[200]">
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                 <Label className="text-base font-medium">Role</Label>
                <Select value={memberRole} onValueChange={(val) => setMemberRole(val as TeamMemberRole)}>
                  <SelectTrigger className="relative z-[200]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="relative z-[200]">
                    <SelectItem value={TeamMemberRole.MEMBER}>Member</SelectItem>
                    <SelectItem value={TeamMemberRole.LEAD}>Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddMember} disabled={!memberUserId} size="sm">Add Member</Button>

            <div className="space-y-2 mt-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border/60 bg-muted/20">
                 <div className="min-w-0">
                   <p className="font-medium text-base text-foreground truncate">{member.user?.name || member.userId}</p>
                   <p className="text-sm text-muted-foreground truncate">{member.user?.email || ''}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <Select value={member.role} onValueChange={(val) => handleMemberRoleChange(selectedTeam!.id, member.userId, val as TeamMemberRole)}>
                     <SelectTrigger className="h-10 w-[100px] relative z-[200]">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="relative z-[200]">
                       <SelectItem value={TeamMemberRole.MEMBER}>Member</SelectItem>
                       <SelectItem value={TeamMemberRole.LEAD}>Lead</SelectItem>
                     </SelectContent>
                   </Select>
                     <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive shrink-0" onClick={() => handleRemoveMember(selectedTeam!.id, member.userId)} aria-label="Remove member">
                       <Trash2 className="h-5 w-5" />
                     </Button>
                 </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
       </Dialog>
     </div>
   );
}

