'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    institution: '',
    role: '',
    accessType: '',
  });

  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to register');
      }

      const result = await response.text();
      console.log(result)
      if (!response.ok) {
        throw new Error(result);
      }

      console.log('Success:', result);
      alert('Registration successful!');
      
      
      router.push('/login');
    } catch (error) {
      console.error('Error:', error);
      alert('Registration failed.');
    }
  };

  const handleLoginNavigation = () => {
    // Clean up before navigation
    router.push('/login');
  };

  return (
    <div className="finisher-header min-h-screen flex items-center justify-center relative bg-amber-500">

      <div className="relative z-10 p-8 bg-white/80 backdrop-blur-sm shadow-lg rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4 text-amber-500">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-amber-500"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-black"
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-black"
            required
          />
          <input
            type="text"
            name="institution"
            placeholder="Institution"
            value={formData.institution}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-black"
          />
          <input
            type="text"
            name="role"
            placeholder="Role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-black"
          />
          <input
            type="text"
            name="accessType"
            placeholder="Access Type"
            value={formData.accessType}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-black"
          />
          <button
            type="submit"
            className="w-full py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
          >
            Register
          </button>
        </form>
        <button
          onClick={handleLoginNavigation}
          className="w-full mt-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}