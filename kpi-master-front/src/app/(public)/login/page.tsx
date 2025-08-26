'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRedirecting(true);

    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const resultText = await response.text();

      if (!response.ok) throw new Error(resultText || 'Login failed');

      const payload = JSON.parse(resultText);
      localStorage.setItem('token', payload.token);
      localStorage.setItem('username', payload.username);
      localStorage.setItem('institution', payload.institution);
      localStorage.setItem('role', payload.role);
      localStorage.setItem('profileImageUrl', payload.profileImageUrl || '');
      localStorage.setItem('email', payload.email);
      
      console.log("result text:" + resultText);
      alert('Login successful!');

      setTimeout(() => {
      router.push('/main');
      }, 1000);

    } catch (error: any) {
      alert('Login failed: ' + error.message);
      setIsRedirecting(false);
    }
  };

  const handleRegisterNavigation = () => {
    setIsRedirecting(true);  
    router.push('/register');
   
  };

  return (
    <div 
      className="finisher-header min-h-screen flex items-center justify-center relative"
      style={{ backgroundColor: '#fe9a00' }} // Fallback background color
    >
      

      <div className="relative z-10 p-8 bg-white/80 backdrop-blur-sm shadow-lg rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4 text-amber-500">Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-amber-500"
            required
            disabled={isRedirecting}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-black"
            required
            disabled={isRedirecting}
          />
          <button 
            type="submit" 
            className="w-full py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isRedirecting}
          >
            {isRedirecting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <button
          onClick={handleRegisterNavigation}
          className="w-full mt-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isRedirecting}
        >
          Don't have an account? Register
        </button>
      </div>

      {/* Loading overlay during redirect */}
      {isRedirecting && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
          <div className="bg-white/90 p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
          </div>
        </div>
      )}
    </div>
  );
}