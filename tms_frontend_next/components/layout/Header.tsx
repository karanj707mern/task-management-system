'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui/Button';

/**
 * Header/Navigation component
 */
export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={ROUTES.HOME} className="text-xl font-bold text-blue-600">
            TMS
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex gap-6">
              <Link href={ROUTES.PROJECTS} className="text-gray-600 hover:text-gray-900">
                Projects
              </Link>
              <Link href={ROUTES.TASKS} className="text-gray-600 hover:text-gray-900">
                Tasks
              </Link>
              <Link href={ROUTES.TEAMS} className="text-gray-600 hover:text-gray-900">
                Teams
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button size="sm">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
