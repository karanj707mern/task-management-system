'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Card component
 */
export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow-md p-6 border border-gray-200', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('mb-4 pb-4 border-b border-gray-200', className)}>{children}</div>;
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('', className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return <div className={cn('mt-4 pt-4 border-t border-gray-200', className)}>{children}</div>;
}
