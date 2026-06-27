/**
 * Utility functions for the frontend
 */

import type { TaskStatus, TaskPriority } from '@/types';

export function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateRelative(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return formatDate(date);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function truncateText(text: string, length: number = 50): string {
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  );
}

export function generateQueryString(params: unknown): string {
  const query = new URLSearchParams();
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export function cn(...classes: unknown[]): string {
  return classes.filter((cls): cls is string => typeof cls === 'string' && cls.length > 0).join(' ');
}

export function getStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    TODO: 'bg-gray-100 text-gray-700 border-gray-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    IN_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
    DONE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    BLOCKED: 'bg-red-100 text-red-700 border-red-200',
    CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return colors[status];
}

export function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    LOW: 'text-emerald-600',
    MEDIUM: 'text-amber-600',
    HIGH: 'text-orange-600',
    URGENT: 'text-red-600',
  };
  return colors[priority];
}
