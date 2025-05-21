'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MainPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Decode token manually (assuming it's a JWT and payload is base64-encoded)
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUsername(payload.username || 'User');
  }, [router]);

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4 flex flex-col space-y-4">
        <h2 className="text-lg font-semibold mb-4">Navigation</h2>
        <button
          onClick={() => handleNavigation('/page1')}
          className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
        >
          Page 1
        </button>
        <button
          onClick={() => handleNavigation('/page2')}
          className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
        >
          Page 2
        </button>
        <button
          onClick={() => handleNavigation('/page3')}
          className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
        >
          Page 3
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 bg-gray-100">
        <h1 className="text-3xl font-semibold">Hello, {username}</h1>
        <p className="mt-4 text-gray-700">Welcome to your dashboard.</p>
      </div>
    </div>
  );
}
