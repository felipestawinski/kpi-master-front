'use client';

import { useRouter } from 'next/navigation';
import { CgProfile } from "react-icons/cg";
import { FaHome } from "react-icons/fa";
import { MdOutlineManageSearch } from "react-icons/md";
import { IoDocumentSharp } from "react-icons/io5";
import { PiUsersFill } from "react-icons/pi";
import { MdLeaderboard } from "react-icons/md";
import { MdLogout } from "react-icons/md";
import { IoChatbox } from "react-icons/io5";
import LoadingPopup from './LoadingPopup';
import { useLoading } from '@/components/hooks/useLoading';

export default function Sidebar() {
  const router = useRouter();
  const { isLoading, startLoading, stopLoading } = useLoading();

  const handleNavigation = (route: string) => {
    startLoading();
    router.push(route);
    setTimeout(() => stopLoading(), 500);
  };

  return (
    <>
      <LoadingPopup isOpen={isLoading} />

      <div className=" w-64 text-white flex flex-col justify-between pt-8 text-sm z-10 backdrop-blur-lg">
        <div className="w-64 text-white flex p-4 flex-col space-y-4">
          <button
            onClick={() => handleNavigation('/main')}
            className="bg-black/50 hover:bg-black/60 p-3 rounded flex items-center justify-start space-x-2 h-12"
          >
            <FaHome size={20} color='white' />
            <span>Página Inicial</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/search')}
            className="bg-black/50 hover:bg-black/60 p-3 rounded flex items-center justify-start space-x-2 h-12"
          >
            <MdOutlineManageSearch size={20} color='white' />
            <span>Pesquisar</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/upload')}
            className="bg-black/50 hover:bg-black/60 p-3 rounded flex items-center justify-start space-x-2 h-12"
          >
            <IoDocumentSharp size={20} color='white' />
            <span>Enviar documentos</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/users')}
            className="bg-black/50 hover:bg-black/60 p-3 rounded flex items-center justify-start space-x-2 h-12"
          >
            <PiUsersFill size={20} color='white' />
            <span>Gerenciar usuários</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/statistics')}
            className="bg-black/50 hover:bg-black/60 p-3 rounded flex items-center justify-start space-x-2 h-12"
          >
            <MdLeaderboard size={20} color='white' />
            <span>Estatísticas</span>
          </button>

          <button
            onClick={() => handleNavigation('/chat')}
            className="bg-black/50 hover:bg-black/60 p-3 rounded flex items-center justify-start space-x-2 h-12"
          >
            <IoChatbox size={20} color='white' />
            <span>Chat</span>
          </button>
        </div>

        <div className="w-64 text-white flex p-4 flex-col space-y-4 pb-8">
          <button
            onClick={() => {
              startLoading();
              localStorage.removeItem('token');
              router.push('/login');
              setTimeout(() => stopLoading(), 500);
            }}
            className="bg-black/50 hover:bg-black/60 p-3 rounded flex items-center justify-start space-x-2 text-red"
          >
            <MdLogout size={20} color='white' />
            <span>Logout</span>
          </button>

          <button
            onClick={() => handleNavigation('/profile')}
            className="bg-black/50 hover:bg-black/60 p-3 rounded flex items-center justify-start space-x-2"
          >
            <CgProfile size={20} color='white' className='inline '/>
            <p>Perfil</p>
          </button> 
        </div>
      </div>
    </>
  );
}