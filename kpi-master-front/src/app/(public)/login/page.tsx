'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRedirecting(true);
    setLoginError(null);

    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const resultText = await response.text();
      if (!response.ok) throw new Error(resultText || 'Login falhou');

      const payload = JSON.parse(resultText);
      localStorage.setItem('token', payload.token);
      localStorage.setItem('username', payload.username);
      localStorage.setItem('institution', payload.institution);
      localStorage.setItem('role', payload.role);
      localStorage.setItem('profileImageUrl', payload.profileImageUrl || '');
      localStorage.setItem('email', payload.email);
      localStorage.setItem('tokenLimit', String(payload.tokenLimit || 1000000));
      localStorage.setItem('tokensUsed', String(payload.tokensUsed || 0));

      setShowSuccess(true);
      setTimeout(() => { router.push('/main'); }, 1500);
    } catch (error: any) {
      setLoginError(error.message || 'Erro desconhecido');
      setIsRedirecting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-900 relative">

      {/* Card */}
      <div className="w-full max-w-sm px-8 py-10 rounded-2xl bg-zinc-800/60 shadow-2xl shadow-black/40">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-500 mb-2">
            Projeto KPI
          </p>
          <h1 className="text-2xl font-bold text-zinc-100">Entrar</h1>
          <p className="mt-1 text-sm text-zinc-500">Acesse sua conta para continuar</p>
        </div>

        {/* Error inline */}
        {loginError && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {loginError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">E-mail</label>
            <input
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isRedirecting}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700
                         text-zinc-100 placeholder:text-zinc-600 text-sm
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isRedirecting}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700
                         text-zinc-100 placeholder:text-zinc-600 text-sm
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            />
          </div>

          <button
            type="submit"
            disabled={isRedirecting}
            className="w-full mt-2 py-2.5 rounded-lg font-semibold text-sm text-zinc-900
                       bg-amber-500 hover:bg-amber-400
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors duration-200 shadow-lg shadow-amber-500/20"
          >
            {isRedirecting && !showSuccess ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Entrando...
              </span>
            ) : 'Entrar'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-xs text-zinc-600">ou</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        <Link
          href="/register"
          className="block w-full py-2.5 rounded-lg font-semibold text-sm text-center
                     text-amber-500 border border-amber-500/50
                     hover:bg-amber-500/10 transition-colors duration-200"
        >
          Criar uma conta
        </Link>

        <p className="mt-6 text-center text-xs text-zinc-600">
          <Link href="/lobby" className="hover:text-zinc-400 transition-colors">← Voltar ao início</Link>
        </p>
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4"
               style={{ animation: 'popIn 0.3s ease-out' }}>
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold text-zinc-100">Login realizado!</h3>
              <p className="text-sm text-zinc-500 mt-1">Redirecionando...</p>
            </div>
            <div className="w-full h-0.5 bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ animation: 'progress 1.5s ease-in-out forwards' }} />
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      ` }} />
    </main>
  );
}