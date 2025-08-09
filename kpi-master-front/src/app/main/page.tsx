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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-amber-800 text-white flex flex-col justify-between">
        <div className="w-64 bg-amber-800 text-white flex p-4 flex-col space-y-4">
          <h2 className="text-lg font-semibold mb-4">Navigation</h2>
          <button
            onClick={() => handleNavigation('/page1')}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
          >
            Página Inicial
          </button>
          <button
            onClick={() => handleNavigation('/search')}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
          >
            Pesquisar documentos
          </button>
          <button
            onClick={() => handleNavigation('/page3')}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
          >
            Enviar documentos
          </button>
          <button
            onClick={() => handleNavigation('/page4')}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
          >
            Gerenciar usuários
          </button>
        </div>

        <div className="w-64 bg-amber-800 text-white flex p-4 flex-col space-y-4">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/login');
            }}
            className="mt-auto bg-red-600 hover:bg-red-500 p-3 rounded text-white"
            >
              Logout
          </button>

          <button
              onClick={() => handleNavigation('/profile')}
              className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
            >
              Perfil
          </button> 
        </div>
     </div>

      {/* Main content */}
      <div className="flex-1 p-8 bg-gray-100">
        <h1 className="text-3xl font-semibold text-amber-500">Hello, {username}</h1>
        <p className="mt-4 text-gray-700">Welcome to your dashboard.</p>
      </div>
    </div>
  );
}
