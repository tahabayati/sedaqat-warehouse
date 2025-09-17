'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't protect the invoice-tool route
    if (pathname === '/invoice-tool') {
      return;
    }

    // Don't protect the login route
    if (pathname === '/login') {
      return;
    }

    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Don't protect the invoice-tool route
  if (pathname === '/invoice-tool') {
    return children;
  }

  // Don't protect the login route
  if (pathname === '/login') {
    return children;
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        در حال بارگذاری...
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect to login)
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated, render children
  return children;
}
