'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineCloudUpload } from "react-icons/ai";
import { MdLeaderboard } from "react-icons/md";
import { MdOutlineManageSearch } from "react-icons/md";
import { useLoading } from '@/components/hooks/useLoading';

export default function MainPage() {
  const router = useRouter();
  const { stopLoading } = useLoading();
  const [username, setUsername] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Stop any loading state immediately
    stopLoading();

    const token = localStorage.getItem('token');
    if (!token) {
      alert("User not logged in")
      router.push('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000); // current time in seconds
      const username = localStorage.getItem('username');
      console.log(payload)
      if (payload.exp < now) {
        localStorage.removeItem('token'); // clear expired token
        router.push('/login');
        return;
      }

      setUsername(payload.sub || 'User');
    } catch (error) {
      console.error('Invalid token');
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router, stopLoading]);

  useEffect(() => {
    const backgroundTimer = setTimeout(() => {
      setBackgroundVisible(true);
    }, 150);
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => {
      clearTimeout(backgroundTimer);
      clearTimeout(timer);
    };
  }, []);

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  const [backgroundVisible, setBackgroundVisible] = useState(false);

  return (
    <div className={`relative flex min-h-screen p-11 overflow-hidden transition-all duration-1000 ease-out transform ${backgroundVisible ? 'opacity-100' : 'opacity-0'
      }`}>
      {/* Subtle animated background pattern */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div> */}

      {/* Welcome message */}
      <div className="relative z-10 flex-1 flex flex-col">
        <div className={`flex-initial space-y-5 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
          <h1 className="text-4xl font-light text-gray-400">Olá,</h1>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-500 to-amber-500 bg-clip-text text-transparent">{username}</h1>
          <p className="text-2xl mt-4 text-gray-400 font-light">Bem vindo ao seu painel.</p>
        </div>

        {/* Introduction */}
        <div className='flex-1 flex items-center flex-col justify-center space-y-8'>
          <p className={`text-xl text-gray-400 font-light transition-all duration-1000 delay-300 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
            O que você gostaria de fazer?
          </p>

          <div className='flex flex-row gap-8 w-full max-w-5xl px-4'>
            <div
              className={`group flex-1 backdrop-blur-md rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:from-slate-700/90 hover:to-slate-800/90 border border-slate-700/50 hover:border-amber-500/50 cursor-pointer transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
              style={{ transitionDelay: '500ms' }}
              onClick={() => handleNavigation('/search')}
            >
              <button className="p-10 text-gray-300 flex justify-center items-center flex-col w-full space-y-4 transition-all duration-300">
                <div className="p-4 rounded-full bg-slate-700/50 group-hover:bg-amber-500/20 transition-all duration-300 group-hover:scale-105">
                  <MdOutlineManageSearch size={56} className="text-gray-400 group-hover:text-amber-400 transition-colors duration-300" />
                </div>
                <span className="text-lg font-medium group-hover:text-amber-400 transition-colors duration-300">Pesquisar documentos</span>
                <span className="text-sm text-gray-500 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Encontre documentos rapidamente
                </span>
              </button>
            </div>

            <div
              className={`group flex-1 backdrop-blur-md rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:from-slate-700/90 hover:to-slate-800/90 border border-slate-700/50 hover:border-amber-500/50 cursor-pointer transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
              style={{ transitionDelay: '700ms' }}
              onClick={() => handleNavigation('/upload')}
            >
              <button className="p-10 text-gray-300 flex justify-center items-center flex-col w-full space-y-4 transition-all duration-300">
                <div className="p-4 rounded-full bg-slate-700/50 group-hover:bg-amber-500/20 transition-all duration-300 group-hover:scale-105">
                  <AiOutlineCloudUpload size={56} className="text-gray-400 group-hover:text-amber-400 transition-colors duration-300" />
                </div>
                <span className="text-lg font-medium group-hover:text-amber-400 transition-colors duration-300">Carregar documentos</span>
                <span className="text-sm text-gray-500 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Faça upload de novos arquivos
                </span>
              </button>
            </div>

            <div
              className={`group flex-1 backdrop-blur-md rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:from-slate-700/90 hover:to-slate-800/90 border border-slate-700/50 hover:border-amber-500/50 cursor-pointer transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
              style={{ transitionDelay: '900ms' }}
              onClick={() => handleNavigation('/statistics')}
            >
              <button className="p-10 text-gray-300 flex justify-center items-center flex-col w-full space-y-4 transition-all duration-300">
                <div className="p-4 rounded-full bg-slate-700/50 group-hover:bg-amber-500/20 transition-all duration-300 group-hover:scale-105">
                  <MdLeaderboard size={56} className="text-gray-400 group-hover:text-amber-400 transition-colors duration-300" />
                </div>
                <span className="text-lg font-medium group-hover:text-amber-400 transition-colors duration-300">Gerar estatísticas</span>
                <span className="text-sm text-gray-500 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Visualize insights e métricas
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}