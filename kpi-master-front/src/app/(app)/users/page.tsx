'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { Users, Mail, Building2, User, Loader2, Shield, ChevronDown, Check, Save } from 'lucide-react';

type PermissionValue = 'normal' | 'admin';

type ApiUser = {
 id: string;
 email: string;
 username: string;
 institution: string;
 permission: PermissionValue;
}

type PermissionOption = {
 value: PermissionValue;
 label: string;
 icon: ReactNode;
}

const PERMISSION_OPTIONS: PermissionOption[] = [
 { value: 'normal', label: 'normal', icon: <User className="w-4 h-4" /> },
 { value: 'admin', label: 'admin', icon: <Shield className="w-4 h-4" /> },
];

function normalizePermission(permission?: string): PermissionValue {
 const value = permission?.toLowerCase() ?? '';
 return value === 'admin' || value === 'administrator' || value === 'administrador' ? 'admin' : 'normal';
}

function getUserKey(user: ApiUser) {
 return user.id || user.username;
}

function UsersPage() {
 const [users, setUsers] = useState<ApiUser[]>([]);
 const [originalPermissions, setOriginalPermissions] = useState<Record<string, PermissionValue>>({});
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [saveError, setSaveError] = useState<string | null>(null);
 const [successMessage, setSuccessMessage] = useState<string | null>(null);
 const [token, setToken] = useState<string | null>(null);
 const [openPermissionUserId, setOpenPermissionUserId] = useState<string | null>(null);

 const changedUsers = users.filter((user) => {
  const originalPermission = originalPermissions[getUserKey(user)];
  return originalPermission !== undefined && user.permission !== originalPermission;
 });
 const hasChanges = changedUsers.length > 0;

 const fetchUsers = useCallback(async () => {
  try {
   setLoading(true);
   setError(null);
   setSaveError(null);
   setSuccessMessage(null);

   const res = await fetch('http://localhost:8080/users', {
    method: 'GET',
    headers: {
     'Content-Type': 'application/json',
     ...(token ? { Authorization: `${token}` } : {}),
    },
   });

   const data = await res.json();
   if (!res.ok) {
    throw new Error('Falha ao buscar usuários.');
   }

   const normalizedUsers: ApiUser[] = (Array.isArray(data) ? data : []).map((user) => ({
    id: String(user.id ?? user.username ?? ''),
    email: user.email ?? '',
    username: user.username ?? '',
    institution: user.institution ?? '',
    permission: normalizePermission(user.permission),
   }));

   const permissionSnapshot = normalizedUsers.reduce<Record<string, PermissionValue>>((acc, user) => {
    acc[getUserKey(user)] = user.permission;
    return acc;
   }, {});

   setUsers(normalizedUsers);
   setOriginalPermissions(permissionSnapshot);
  } catch (err) {
   setError(err instanceof Error ? err.message : 'Falha ao buscar usuários.');
  } finally {
   setLoading(false);
  }
 }, [token]);

 useEffect(() => {
  if (token !== null) {
   fetchUsers();
  }
 }, [fetchUsers, token]);

 useEffect(() => {
  setToken(localStorage.getItem('token'));
 }, []);

 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
   const target = event.target as HTMLElement;
   if (!target.closest('[data-permission-dropdown]')) {
    setOpenPermissionUserId(null);
   }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const handlePermissionChange = (userId: string, permission: PermissionValue) => {
  setUsers((currentUsers) =>
   currentUsers.map((user) =>
    getUserKey(user) === userId ? { ...user, permission } : user
   )
  );
  setOpenPermissionUserId(null);
  setSaveError(null);
  setSuccessMessage(null);
 };

 const handleSave = async () => {
  if (!hasChanges || saving) return;

  try {
   setSaving(true);
   setSaveError(null);
   setSuccessMessage(null);

   await Promise.all(
    changedUsers.map(async (user) => {
     const res = await fetch('http://localhost:8080/change-permission', {
      method: 'POST',
      headers: {
       'Content-Type': 'application/json',
       ...(token ? { Authorization: `${token}` } : {}),
      },
      body: JSON.stringify({
       username: user.username,
       permission: user.permission,
      }),
     });

     if (!res.ok) {
      const message = await res.text();
      throw new Error(message || 'Falha ao salvar alterações.');
     }
    })
   );

   setOriginalPermissions((currentPermissions) => {
    const nextPermissions = { ...currentPermissions };
    changedUsers.forEach((user) => {
     nextPermissions[getUserKey(user)] = user.permission;
    });
    return nextPermissions;
   });
   setSuccessMessage('Alterações salvas com sucesso.');
  } catch (err) {
   setSaveError(err instanceof Error ? err.message : 'Falha ao salvar alterações.');
  } finally {
   setSaving(false);
  }
 };

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

    @keyframes slideIn {
     from {
      opacity: 0;
      transform: translateY(-10px);
     }
     to {
      opacity: 1;
      transform: translateY(0);
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

    .dropdown-enter {
     animation: slideIn 0.2s ease-out;
    }

    .dropdown-scrollbar {
     overflow-y: auto;
     scrollbar-width: thin;
     scrollbar-color: rgba(255,255,255,0.88);
    }

    .dropdown-scrollbar::-webkit-scrollbar {
     width: 6px;
    }

    .dropdown-scrollbar::-webkit-scrollbar-track {
     background: transparent;
    }

    .dropdown-scrollbar::-webkit-scrollbar-thumb {
     background: rgba(255,255,255,0.88);
     border-radius: 4px;
     transition: background 0.2s;
    }

    .dropdown-scrollbar::-webkit-scrollbar-thumb:hover {
     background: rgba(255,255,255,0.85);
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
     <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl p-8">
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
     <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl p-12 fade-in">
      <div className="flex flex-col items-center justify-center space-y-4">
       <Loader2 className="h-12 w-12 text-amber-400 animate-spin" />
       <p className="text-white/80 text-lg font-semibold">Carregando usuários...</p>
      </div>
     </div>
    )}

    {/* Error State */}
    {!loading && error && (
     <div className="backdrop-blur-xl bg-red-500/20 rounded-2xl shadow-2xl p-8 fade-in">
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
     <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl p-12 fade-in">
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
     <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl slide-up overflow-visible">
      <div className="overflow-x-auto overflow-y-visible">
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
          <Th>
           <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-300" />
            <span>Permissão</span>
           </div>
          </Th>
         </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
         {users.map((user, index) => {
          const userId = getUserKey(user);
          return (
           <tr
            key={userId}
            className="hover:bg-white/10 fade-in group"
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
             <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-sm font-medium backdrop-blur-sm">
              {user.institution || 'N/A'}
             </span>
            </Td>
            <Td>
             <PermissionDropdown
              value={user.permission}
              isOpen={openPermissionUserId === userId}
              onToggle={() => setOpenPermissionUserId(openPermissionUserId === userId ? null : userId)}
              onChange={(permission) => handlePermissionChange(userId, permission)}
             />
            </Td>
           </tr>
          );
         })}
        </tbody>
       </table>
      </div>

      {/* Footer with count and save action */}
      <div className="bg-black/30 px-6 py-4 border-t border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
       <div>
        <p className="text-sm text-white/60">
         Total de <span className="font-semibold text-amber-300">{users.length}</span> {users.length === 1 ? 'usuário' : 'usuários'}
        </p>
        {saveError && (
         <p className="mt-1 text-sm text-red-300">{saveError}</p>
        )}
        {successMessage && (
         <p className="mt-1 text-sm text-emerald-300">{successMessage}</p>
        )}
       </div>

       <button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className="self-end inline-flex min-w-[120px] items-center justify-center space-x-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
       >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>{saving ? 'Salvando...' : 'Salvar'}</span>
       </button>
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

function PermissionDropdown({
 value,
 isOpen,
 onToggle,
 onChange,
}: {
 value: PermissionValue;
 isOpen: boolean;
 onToggle: () => void;
 onChange: (permission: PermissionValue) => void;
}) {
 const selectedOption = PERMISSION_OPTIONS.find((option) => option.value === value) ?? PERMISSION_OPTIONS[0];

 return (
  <div data-permission-dropdown className="relative min-w-[150px]">
   <button
    type="button"
    onClick={onToggle}
    className="w-full p-3 rounded-xl bg-black/40 text-white backdrop-blur-md hover:bg-black/50 flex items-center justify-between group shadow-xl"
   >
    <div className="flex items-center space-x-3">
     <div className="p-2 rounded-lg bg-amber-500/30 group-hover:bg-amber-500/40 transition-colors shadow-lg">
      {selectedOption.icon}
     </div>
     <div className="font-medium drop-shadow-md">{selectedOption.label}</div>
    </div>
    <ChevronDown
     className={`w-4 h-4 text-white/80 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
    />
   </button>

   {isOpen && (
    <div className="absolute z-50 w-full mt-2 rounded-xl bg-zinc-800 shadow-2xl overflow-hidden dropdown-enter">
     <div className="max-h-64 dropdown-scrollbar">
      {PERMISSION_OPTIONS.map((option, index) => (
       <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`w-full p-3 text-left hover:bg-white/10 flex items-center space-x-3 group ${
         value === option.value ? 'bg-amber-500/20' : ''
        } ${index !== 0 ? 'border-t border-white/10' : ''}`}
       >
        <div className={`p-2 rounded-lg transition-colors ${
         value === option.value
          ? 'bg-amber-500 text-white'
          : 'bg-white/10 text-gray-300 group-hover:bg-amber-500/30'
        }`}>
         {option.icon}
        </div>
        <div className="flex-1 min-w-0">
         <div className="font-medium text-gray-300 truncate">
          {option.label}
         </div>
        </div>
        {value === option.value && (
         <Check className="flex-shrink-0 w-4 h-4 text-amber-400" />
        )}
       </button>
      ))}
     </div>
    </div>
   )}
  </div>
 );
}

function Th({ children }: { children: ReactNode }) {
 return (
  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-lg">
   {children}
  </th>
 );
}

function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
 return <td className={`px-6 py-4 text-sm ${className}`}>{children}</td>;
}
