'use client';

import { useRouter } from 'next/navigation';
import { CgProfile } from "react-icons/cg";

export default function Sidebar() {
  const router = useRouter();

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <div className=" w-64 bg-amber-500 text-white flex flex-col justify-between pt-8 border-r-4 border-amber-600">
        <div className="w-64 text-white flex p-4 flex-col space-y-4">

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
          <button
            onClick={() => handleNavigation('/permissions')}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded"
          >
            Estatísticas
          </button>
        </div>

        <div className="w-64 text-white flex p-4 flex-col space-y-4 pb-8">
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
              className="bg-gray-700 hover:bg-gray-600 p-3 rounded flex items-center justify-center space-x-1"
            >
            <CgProfile size={20} color='white' className='inline '/>
            <p>Perfil</p>
          </button> 
        </div>
     </div>
  );
}
