'use client';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white shadow rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        <form>
          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 px-3 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-3 px-3 py-2 border rounded"
          />
          <button
            type="submit"
            className="w-full py-2 mb-3 bg-green-500 text-white rounded"
          >
            Login
          </button>
        </form>
        <button
          onClick={() => router.push('/register')}
          className="w-full py-2 bg-gray-200 text-gray-800 rounded"
        >
          Don’t have an account? Register
        </button>
      </div>
    </div>
  );
}
