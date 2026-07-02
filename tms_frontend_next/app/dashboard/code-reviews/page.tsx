'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { codeReviewService } from '@/services/code-reviews.service';
import { pullRequestService } from '@/services/pull-requests.service';
import { userService } from '@/services/users.service';
import { isManagerOrAbove as hasManagerAccess, type CodeReview, type User } from '@/types';
import { ROUTES, ERROR_MESSAGES } from '@/constants';
import { Plus, Pencil, Trash2, MessageSquare, GitPullRequest } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const REVIEW_STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'PENDING', label: 'Pending', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'CHANGES_REQUESTED', label: 'Changes Requested', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'COMMENTED', label: 'Commented', color: 'bg-blue-100 text-blue-700 border-blue-200' },
];

export default function CodeReviewsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [prs, setPrs] = useState<{ id: string; title: string; authorId: string }[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<CodeReview | null>(null);
  const [formData, setFormData] = useState({
    prId: '',
    reviewerId: '',
    status: '',
    comments: '',
  });
  const [saving, setSaving] = useState(false);

  const isManagerOrAbove = hasManagerAccess(user?.role);

  const loadReviews = useCallback(async () => {
    setPageLoading(true);
    setError(null);
    try {
      const response = await codeReviewService.getAll();
      setReviews(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setPageLoading(false);
    }
  }, []);

  const loadPRs = useCallback(async () => {
    try {
      const response = await pullRequestService.getAll();
      setPrs(Array.isArray(response.data) ? response.data.map((p) => ({ id: p.id, title: p.title, authorId: p.authorId })) : []);
    } catch {
      // silently fail
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getAll({ isActive: true, limit: 100 });
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  /* eslint-disable react-hooks/set-state-in-effect -- Data loading on auth change uses async loaders */
  useEffect(() => {
    if (isAuthenticated) {
      loadReviews();
      loadPRs();
      loadUsers();
    }
  }, [isAuthenticated, loadReviews, loadPRs, loadUsers]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openCreate = () => {
    setEditingReview(null);
    setFormData({ prId: '', reviewerId: '', status: 'PENDING', comments: '' });
    setShowForm(true);
  };

  const openEdit = (review: CodeReview) => {
    setEditingReview(review);
    setFormData({
      prId: review.prId,
      reviewerId: review.reviewerId,
      status: review.status,
      comments: review.comments || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.prId || !formData.reviewerId) return;
    setSaving(true);
    setError(null);
    try {
      if (editingReview) {
        const updated = await codeReviewService.update(editingReview.id, {
          status: formData.status || undefined,
          comments: formData.comments.trim() || undefined,
        });
        setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await codeReviewService.create({
          prId: formData.prId,
          reviewerId: formData.reviewerId,
          status: formData.status || undefined,
          comments: formData.comments.trim() || undefined,
        });
        setReviews((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setEditingReview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Delete this code review? This action cannot be undone.')) return;
    setError(null);
    try {
      await codeReviewService.delete(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = REVIEW_STATUS_OPTIONS.find((o) => o.value === status);
    if (!option) return <Badge variant="outline">{status}</Badge>;
    return <Badge className={option.color} variant="outline">{option.label}</Badge>;
  };

  const canEditReview = (review: CodeReview) => {
    if (!user) return false;
    if (isManagerOrAbove) return true;
    if (review.reviewerId === user.id) return true;
    const pr = prs.find((p) => p.id === review.prId);
    if (pr) return review.pullRequest?.authorId === user.id;
    return false;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Code Reviews</h1>
            <p className="mt-1 text-base text-muted-foreground">Manage code reviews for pull requests.</p>
          </div>
          {isManagerOrAbove && (
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="h-5 w-5" />
            New Code Review
          </Button>
          )}
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadReviews}>Retry</Button>
            </CardContent>
          </Card>
        )}

        {pageLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="border border-border/60 bg-card/80 backdrop-blur rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/60">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Pull Request</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Reviewer</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Comments</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Created At</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground w-36"></th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No code reviews yet. {isManagerOrAbove ? 'Create one to get started.' : ''}
                      </td>
                    </tr>
                  )}
                  {reviews.map((review) => (
                    <tr key={review.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <GitPullRequest className="h-5 w-5 text-muted-foreground" />
                          <span
                            className="font-medium cursor-pointer hover:text-primary"
                            onClick={() => router.push(ROUTES.PULL_REQUESTS)}
                          >
                            {review.pullRequest?.title || 'Unknown PR'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-base">
                        {review.reviewer?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-base">{getStatusBadge(review.status)}</td>
                      <td className="px-4 py-3 text-base text-muted-foreground max-w-[250px]">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{review.comments || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-base text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {(canEditReview(review)) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => openEdit(review)}
                              title="Edit"
                            >
                              <Pencil className="h-5 w-5" />
                            </Button>
                          )}
                          {isManagerOrAbove && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(review.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[role="listbox"]') || target.closest('[role="option"]') || target.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}>
            <DialogHeader>
              <DialogTitle>{editingReview ? 'Edit Code Review' : 'Create Code Review'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="review-pr">Pull Request *</Label>
                <Select
                  value={formData.prId}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, prId: val }))}
                  disabled={!!editingReview}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pull request" />
                  </SelectTrigger>
                  <SelectContent>
                    {prs.map((pr) => (
                      <SelectItem key={pr.id} value={pr.id}>{pr.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-reviewer">Reviewer *</Label>
                <Select
                  value={formData.reviewerId}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, reviewerId: val }))}
                  disabled={!!editingReview}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => u.isActive)
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-status">Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-comments">Comments</Label>
                <Textarea
                  id="review-comments"
                  value={formData.comments}
                  onChange={(e) => setFormData((prev) => ({ ...prev, comments: e.target.value }))}
                  placeholder="Reviewer comments..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingReview ? 'Save Changes' : 'Create Review'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}
