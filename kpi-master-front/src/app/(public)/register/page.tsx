'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRedirecting(true);
    setRegisterError(null);

    try {
      const response = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.text();
      if (!response.ok) throw new Error(result || 'Falha ao registrar');

      localStorage.setItem('isNewUser', 'true');
      setTimeout(() => { router.push('/login'); }, 1000);
    } catch (error: any) {
      console.error('Erro:', error);
      setRegisterError(error.message || 'Falha no registro.');
      setIsRedirecting(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700
    text-zinc-100 placeholder:text-zinc-600 text-sm
    focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
    disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150`;

  const labelClass = 'block text-xs font-medium text-zinc-400 mb-1.5';

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-900 py-10 relative">

      {/* Card */}
      <div className="w-full max-w-sm px-8 py-10 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 shadow-2xl shadow-black/40">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-500 mb-2">
            Projeto KPI
          </p>
          <h1 className="text-2xl font-bold text-zinc-100">Criar conta</h1>
          <p className="mt-1 text-sm text-zinc-500">Preencha seus dados para começar</p>
        </div>

        {/* Error inline */}
        {registerError && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {registerError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>E-mail</label>
            <input type="email" name="email" placeholder="voce@exemplo.com"
              value={formData.email} onChange={handleChange}
              required disabled={isRedirecting} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Senha</label>
            <input type="password" name="password" placeholder="Crie uma senha forte"
              value={formData.password} onChange={handleChange}
              required disabled={isRedirecting} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Nome de usuário</label>
            <input type="text" name="username" placeholder="Escolha um nome de usuário"
              value={formData.username} onChange={handleChange}
              required disabled={isRedirecting} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Instituição</label>
            <input type="text" name="institution" placeholder="Sua instituição"
              value={formData.institution} onChange={handleChange}
              disabled={isRedirecting} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Cargo</label>
            <input type="text" name="role" placeholder="Seu cargo"
              value={formData.role} onChange={handleChange}
              disabled={isRedirecting} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Tipo de acesso</label>
            <input type="text" name="accessType" placeholder="Tipo de acesso"
              value={formData.accessType} onChange={handleChange}
              disabled={isRedirecting} className={inputClass} />
          </div>

          <button
            type="submit"
            disabled={isRedirecting}
            className="w-full mt-2 py-2.5 rounded-lg font-semibold text-sm text-zinc-900
                       bg-amber-500 hover:bg-amber-400
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors duration-200 shadow-lg shadow-amber-500/20"
          >
            {isRedirecting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Criando conta...
              </span>
            ) : 'Criar conta'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-xs text-zinc-600">ou</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        <Link
          href="/login"
          className="block w-full py-2.5 rounded-lg font-semibold text-sm text-center
                     text-amber-500 border border-amber-500/50
                     hover:bg-amber-500/10 transition-colors duration-200"
        >
          Já tenho uma conta
        </Link>

        <p className="mt-6 text-center text-xs text-zinc-600">
          <Link href="/lobby" className="hover:text-zinc-400 transition-colors">← Voltar ao início</Link>
        </p>
      </div>
    </main>
  );
}