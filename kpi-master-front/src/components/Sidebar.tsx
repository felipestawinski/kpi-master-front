'use client';

import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <div className=" w-64 bg-amber-500 text-white flex flex-col justify-between">
        <div className="w-64 bg-amber-500 text-white flex p-4 flex-col space-y-4">

          <button
            onClick={() => handleNavigation('/main')}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
          >
            Página Inicial
          </button>
          <button
            onClick={() => handleNavigation('/search')}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
          >
            Pesquisar documentos
          </button>
          <button
            onClick={() => handleNavigation('/upload')}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
          >
            Enviar documentos
          </button>
          <button
            onClick={() => handleNavigation('/permissions')}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
          >
            Gerenciar usuários
          </button>
        </div>

        <div className="w-64 bg-amber-500 text-white flex p-4 flex-col space-y-4">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/login');
            }}
            className="mt-auto bg-amber-700 hover:bg-red-700 p-3 rounded text-white"
            >
              Logout
          </button>

          <button
              onClick={() => handleNavigation('/profile')}
              className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
            >
              Perfil
          </button> 
        </div>
     </div>
  );
}
