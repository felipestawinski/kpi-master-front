'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

type AuthStatus = 'loading' | 'authenticated' | 'no-token' | 'expired' | 'invalid';

export default function AuthGuard({ children }: AuthGuardProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setAuthStatus('no-token');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);


      if (payload.exp < now) {
        localStorage.removeItem('token');
        setAuthStatus('expired');
        return;
      }
    } catch (error) {
      console.error('Invalid token');
      localStorage.removeItem('token');
      setAuthStatus('invalid');
      return;
    }

    setAuthStatus('authenticated');
  }, [router]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (authStatus === 'loading' || authStatus === 'authenticated') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [authStatus, router]);

  const handleRedirect = useCallback(() => {
    router.push('/login');
  }, [router]);

  // Loading state
  if (authStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-white/60 text-sm font-medium tracking-wide">Carregando...</p>
        </div>
      </div>
    );
  }

  // Authenticated
  if (authStatus === 'authenticated') {
    return <>{children}</>;
  }

  // Session expired / no token / invalid token modal
  const modalConfig = {
    'no-token': {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      title: 'Acesso Restrito',
      message: 'Você precisa estar autenticado para acessar esta página.',
    },
    'expired': {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: 'Sessão Expirada',
      message: 'Sua sessão expirou. Por favor, faça login novamente para continuar.',
    },
    'invalid': {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" x2="12" y1="9" y2="13" />
          <line x1="12" x2="12.01" y1="17" y2="17" />
        </svg>
      ),
      title: 'Token Inválido',
      message: 'Seu token de autenticação é inválido. Por favor, faça login novamente.',
    },
  };

  const config = modalConfig[authStatus];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm"
        style={{ animation: 'authFadeIn 0.3s ease-out forwards' }}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-sm mx-4"
        style={{ animation: 'authScaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl">
          {/* Amber glow accent at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

          {/* Content */}
          <div className="px-8 pt-8 pb-6 flex flex-col items-center text-center">
            {/* Icon container */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5"
              style={{ animation: 'authPulseGlow 2s ease-in-out infinite' }}
            >
              {config.icon}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
              {config.title}
            </h2>

            {/* Message */}
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              {config.message}
            </p>

            {/* Redirect button */}
            <button
              onClick={handleRedirect}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 cursor-pointer"
            >
              Ir para o Login
            </button>

            {/* Countdown */}
            <p className="mt-4 text-white/30 text-xs">
              Redirecionando em{' '}
              <span className="text-amber-500/70 font-semibold tabular-nums">{countdown}s</span>
            </p>
          </div>
        </div>
      </div>

      {/* Inline keyframes */}
      <style jsx global>{`
        @keyframes authFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes authScaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes authPulseGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
          }
          50% {
            box-shadow: 0 0 20px 2px rgba(245, 158, 11, 0.15);
          }
        }
      `}</style>
    </div>
  );
}