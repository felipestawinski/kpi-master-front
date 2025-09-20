'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthGuard check, token:', token);
    
    if (!token) {
      router.push('/login'); // Redirect to login page
      alert('You must be logged in to access this page.');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000); // current time in seconds
      console.log(payload)
      if (payload.exp < now) {
        localStorage.removeItem('token'); // clear expired token
        alert('Session has expired. Please log in again.');
        router.push('/login');
        return;
      }

      } catch (error) {
      console.error('Invalid token');
      localStorage.removeItem('token');
      router.push('/login');
    }

    // Optional: Validate token with your backend
    // You can add token validation logic here
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}