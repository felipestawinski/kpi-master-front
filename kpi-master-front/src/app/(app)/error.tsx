'use client';

import { useEffect } from 'react';

export default function Error({
 error,
 reset,
}: {
 error: Error & { digest?: string };
 reset: () => void;
}) {
 useEffect(() => {
  console.error('App route error:', error);
 }, [error]);

 return (
  <div className="min-h-screen flex items-center justify-center p-6">
   <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md w-full">
    <div className="text-center">
     <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
     </div>
     <h2 className="text-2xl font-bold text-gray-900 mb-2">Algo deu errado</h2>
     <p className="text-gray-600 mb-6">
      Ocorreu um erro inesperado. Por favor, tente novamente.
     </p>
     <div className="space-y-3">
      <button
       onClick={reset}
       className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
      >
       Tentar novamente
      </button>
      <button
       onClick={() => window.location.href = '/main'}
       className="w-full py-3 bg-white text-gray-700 font-medium rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
      >
       Voltar para o início
      </button>
     </div>
    </div>
   </div>
  </div>
 );
}