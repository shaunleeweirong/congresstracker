'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  fallback = null, 
  redirectTo = '/login',
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        // Redirect to login with callback URL
        const currentPath = window.location.pathname + window.location.search;
        const redirectUrl = `${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`;
        router.push(redirectUrl);
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  // If user should not be authenticated (like login/register pages) but is authenticated
  if (!requireAuth && isAuthenticated) {
    router.push('/');
    return null;
  }

  return <>{children}</>;
}

// Convenience wrapper for pages that require authentication
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    redirectTo?: string;
  }
) {
  const AuthenticatedComponent = (props: P) => {
    return (
      <ProtectedRoute 
        fallback={options?.fallback}
        redirectTo={options?.redirectTo}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
}

// Convenience wrapper for public pages (login/register) that redirect if authenticated
export function withoutAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  const PublicComponent = (props: P) => {
    return (
      <ProtectedRoute requireAuth={false}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  PublicComponent.displayName = `withoutAuth(${Component.displayName || Component.name})`;
  
  return PublicComponent;
}