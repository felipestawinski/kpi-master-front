'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { Users, Mail, Building2, User, Loader2 } from 'lucide-react';


type ApiUser = {
  id: number;
  email: string;
  username: string;
  institution: string;
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

      const data: ApiUser[] = await res.json();
      setUsers(data);
    
    } catch (err) {
      setError('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-h-screen overflow-y-auto">
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .slide-up {
          animation: slideUp 0.4s ease-out;
        }

        .shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 slide-up">
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl border border-white/30 p-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">Gerenciar Usuários</h1>
                <p className="text-white/60 mt-1">Visualize e gerencie todos os usuários do sistema</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl border border-white/30 p-12 fade-in">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 text-amber-400 animate-spin" />
              <p className="text-white/80 text-lg font-semibold">Carregando usuários...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="backdrop-blur-xl bg-red-500/20 rounded-2xl shadow-2xl border border-red-400/50 p-8 fade-in">
            <div className="flex items-center space-x-3 text-red-300">
              <div className="p-2 rounded-full bg-red-500/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-lg font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && users.length === 0 && (
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl border border-white/30 p-12 fade-in">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="p-4 rounded-full bg-white/10">
                <Users className="h-16 w-16 text-white/40" />
              </div>
              <p className="text-white/60 text-lg">Nenhum usuário encontrado</p>
            </div>
          </div>
        )}

        {/* Users Table */}
        {!loading && !error && users.length > 0 && (
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl border border-white/30 overflow-hidden slide-up">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-black/30">
                  <tr>
                    <Th>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-amber-300" />
                        <span>Email</span>
                      </div>
                    </Th>
                    <Th>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-amber-300" />
                        <span>Usuário</span>
                      </div>
                    </Th>
                    <Th>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-amber-300" />
                        <span>Instituição</span>
                      </div>
                    </Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-white/10 transition-all duration-300 fade-in group"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Td className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-all">
                            <Mail className="w-4 h-4 text-amber-300" />
                          </div>
                          <span className="text-white drop-shadow-lg">{user.email}</span>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-white/90">{user.username}</span>
                      </Td>
                      <Td>
                        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-sm font-medium border border-white/20 backdrop-blur-sm">
                          {user.institution || 'N/A'}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer with count */}
            <div className="bg-black/30 px-6 py-4 border-t border-white/10">
              <p className="text-sm text-white/60">
                Total de <span className="font-semibold text-amber-300">{users.length}</span> {users.length === 1 ? 'usuário' : 'usuários'}
              </p>
            </div>
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
    <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-lg">
      {children}
    </th>
  );
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-4 text-sm ${className}`}>{children}</td>;
}