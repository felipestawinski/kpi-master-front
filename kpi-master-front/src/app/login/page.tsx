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

      // ✅ Save JWT token
      localStorage.setItem('token', resultText);
      console.log(resultText)
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
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded"
            required
          />
          <button type="submit" className="w-full py-2 bg-green-500 text-white rounded">
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
