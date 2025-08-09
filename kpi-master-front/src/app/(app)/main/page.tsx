'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MainPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("User not logged in")
      router.push('/login');
      return;
    }
 
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000); // current time in seconds
      const username = localStorage.getItem('username');
      console.log(payload)
      if (payload.exp < now) {
        localStorage.removeItem('token'); // clear expired token
        router.push('/login');
        return;
      }

      setUsername(payload.sub || 'User');
      } catch (error) {
      console.error('Invalid token');
      localStorage.removeItem('token');
      router.push('/login');
    }
    

  }, [router]);

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <div className="flex">

      {/* Main content */}
      <div className="flex-1 p-8 bg-gray-100">
        <h1 className="text-3xl font-semibold text-amber-500">Hello, {username}</h1>
        <p className="mt-4 text-gray-700">Welcome to your dashboard.</p>
      </div>
    </div>
  );
}
