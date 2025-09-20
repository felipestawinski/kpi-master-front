'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';

// type ApiFile = {
//   id: number;
//   filename: string;
//   institution: string;
//   writer: string;
//   date: string;
//   fileAddress: string;
// };

type ApiUser = {
  ID: number;
  Email: string;
  Username: string;
  Institution: string;
}


function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

   // fetch once we have a token
  useEffect(() => {
    if (token !== null) {
      fetchUsers();
    }
  }, [token]);

  useEffect(()=> {
    setToken(localStorage.getItem('token'));
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('http://localhost:8080/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `${token}` } : {}),
        },
      });

      console.log('Response status:', res.status);

      const data: ApiUser[] = await res.json();
      setUsers(data);
    
    } catch (err) {
      setError('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 ">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Usuários</h1>
          </div>
        </div>

        {loading && <div className="rounded-lg p-6 shadow">Carregando Usuários</div>}

        {!loading && error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="rounded-lg p-6 text-gray-600 shadow">
            No users found.
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="overflow-hidden rounded-lg shadow ring-1">
            <table className="min-w-full divide-y backdrop-blur-sm rounded-lg bg-white/25">
              <thead className="backdrop-blur-sm rounded-lg bg-black/20">
                <tr>
                  <Th>Email</Th>
                  <Th>username</Th>
                  <Th>Instituição</Th>
                </tr>
              </thead>
              <tbody className="divide-y backdrop-blur-sm rounded-lg">
                {users.map((f) => (
                  console.log(typeof(f)),       
                  <tr key={f.id} className="hover:bg-white/20">
                    <Td className="font-medium text-gray-900">{f.email}</Td>
                    <Td>{f.username}</Td>
                    <Td>{f.institution}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedUsersPage() {
  return (
    <AuthGuard>
      <UsersPage />
    </AuthGuard>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
      {children}
    </th>
  );
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-4 py-3 text-sm text-gray-700 ${className}`}>{children}</td>;
}