'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRedirecting(true);

    try {
      const response = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Falha ao registrar');
      }

      const result = await response.text();
      console.log(result)
      if (!response.ok) {
        throw new Error(result);
      }

      console.log('Sucesso:', result);
      alert('Registro realizado com sucesso!');
      localStorage.setItem('isNewUser', 'true')
      
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (error) {
      console.error('Erro:', error);
      alert('Falha no registro.');
      setIsRedirecting(false);
    }
  };

  const handleLoginNavigation = () => {
    setIsRedirecting(true);
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Brand section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1e2938] via-[#2a3848] to-[#1e2938] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              Entre para o<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                KPI Master
              </span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              Comece a acompanhar e otimizar suas métricas de desempenho hoje.
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-300">Análises em tempo real</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-300">Dashboards intuitivos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-300">Área de trabalho colaborativa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form section */}
      <div className="flex-1 flex items-center justify-center bg-white relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #1e2938 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative z-10 w-full max-w-md px-8 py-8">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1e2938] mb-2">Criar conta</h2>
            <p className="text-gray-500">Preencha seus dados para começar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                placeholder="voce@exemplo.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl 
                         text-[#1e2938] placeholder:text-gray-400
                         focus:outline-none focus:border-orange-500 focus:bg-white
                         transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={isRedirecting}
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                name="password"
                placeholder="Crie uma senha forte"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl 
                         text-[#1e2938] placeholder:text-gray-400
                         focus:outline-none focus:border-orange-500 focus:bg-white
                         transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={isRedirecting}
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome de usuário</label>
              <input
                type="text"
                name="username"
                placeholder="Escolha um nome de usuário"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl 
                         text-[#1e2938] placeholder:text-gray-400
                         focus:outline-none focus:border-orange-500 focus:bg-white
                         transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={isRedirecting}
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Instituição</label>
              <input
                type="text"
                name="institution"
                placeholder="Sua instituição"
                value={formData.institution}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl 
                         text-[#1e2938] placeholder:text-gray-400
                         focus:outline-none focus:border-orange-500 focus:bg-white
                         transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRedirecting}
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
              <input
                type="text"
                name="role"
                placeholder="Seu cargo"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl 
                         text-[#1e2938] placeholder:text-gray-400
                         focus:outline-none focus:border-orange-500 focus:bg-white
                         transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRedirecting}
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de acesso</label>
              <input
                type="text"
                name="accessType"
                placeholder="Tipo de acesso"
                value={formData.accessType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl 
                         text-[#1e2938] placeholder:text-gray-400
                         focus:outline-none focus:border-orange-500 focus:bg-white
                         transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRedirecting}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 
                       text-white font-medium rounded-xl 
                       hover:from-orange-600 hover:to-orange-700 
                       focus:outline-none focus:ring-4 focus:ring-orange-500/20
                       transform hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       shadow-lg shadow-orange-500/25 mt-2"
              disabled={isRedirecting}
            >
              {isRedirecting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Criando conta...
                </span>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Já tem uma conta?</span>
              </div>
            </div>

            <button
              onClick={handleLoginNavigation}
              className="w-full mt-6 py-3.5 bg-white border-2 border-gray-200 
                       text-[#1e2938] font-medium rounded-xl 
                       hover:border-[#1e2938] hover:bg-gray-50
                       focus:outline-none focus:ring-4 focus:ring-gray-200
                       transform hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isRedirecting}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isRedirecting && (
        <div className="absolute inset-0 bg-[#1e2938]/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-orange-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-[#1e2938] font-medium">Configurando sua conta...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}