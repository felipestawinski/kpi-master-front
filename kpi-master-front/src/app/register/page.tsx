'use client';

import { useState } from 'react';

export default function RegisterPage() {
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
    } catch (error) {
      console.error('Error:', error);
      alert('Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white shadow rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded text-gray-900"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded text-gray-900"
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded text-gray-900"
            required
          />
          <input
            type="text"
            name="institution"
            placeholder="Institution"
            value={formData.institution}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded text-gray-900"
          />
          <input
            type="text"
            name="role"
            placeholder="Role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded text-gray-900"
          />
          <input
            type="text"
            name="accessType"
            placeholder="Access Type"
            value={formData.accessType}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded text-gray-900"
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
