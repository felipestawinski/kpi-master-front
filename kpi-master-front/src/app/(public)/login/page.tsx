'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const resultText = await response.text();

      if (!response.ok) throw new Error(resultText || 'Login failed');

      // ✅ Save JWT token and username
      const payload = JSON.parse(resultText);
      localStorage.setItem('token', payload.token);
      localStorage.setItem('username', payload.username);
      localStorage.setItem('institution',payload.institution )
      localStorage.setItem('role',payload.role )
      localStorage.setItem('profileImageUrl', payload.profileImageUrl || '' )
      localStorage.setItem('email',payload.email )
      console.log("result text:" + resultText)
      alert('Login successful!');
      router.push('/main');

      // router.push('/dashboard'); // or wherever you want to redirect
    } catch (error: any) {
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white shadow rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4 text-amber-500">Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-amber-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-black"
            required
          />
          <button type="submit" className="w-full py-2 bg-amber-500 text-white rounded">
            Login
          </button>
        </form>
        <button
          onClick={() => router.push('/register')}
          className="w-full mt-3 py-2 bg-gray-200 text-gray-800 rounded"
        >
          Don’t have an account? Register
        </button>
      </div>
    </div>
  );
}
