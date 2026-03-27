'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { CgProfile } from "react-icons/cg";
import { FaHome } from "react-icons/fa";
import { MdOutlineManageSearch } from "react-icons/md";
import { IoDocumentSharp } from "react-icons/io5";
import { PiUsersFill } from "react-icons/pi";
import { MdPhotoLibrary } from "react-icons/md";
// NOTE: I added MdPhotoLibrary on top, but the import block is on line 10, so let's do this properly in another tool call. I will just replace Estatísticas with Galeria and MdLeaderboard with MdPhotoLibrary.
import { MdLogout } from "react-icons/md";
import { IoChatbox } from "react-icons/io5";
import LoadingPopup from './LoadingPopup';
import { useLoading } from '@/components/hooks/useLoading';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Only stop loading if pathname actually changed
    if (prevPathnameRef.current !== pathname) {
      stopLoading();
      prevPathnameRef.current = pathname;
    }
  }, [pathname, stopLoading]);

  const handleNavigation = (route: string) => {
    startLoading();
    router.push(route);
  };

  const isActive = (route: string) => pathname === route;

  const navButtonClass = (route: string) => `
    group relative p-3 rounded-lg flex items-center justify-start space-x-3 h-12
    transition-all duration-200 ease-in-out
    ${isActive(route)
      ? 'bg-white/10 text-white shadow-lg'
      : 'bg-black/30 hover:bg-black/40 hover:translate-x-1'
    }
  `;

  return (
    <>
      <LoadingPopup isOpen={isLoading} />

      <div className="w-64 text-gray-300 flex flex-col justify-between pt-8 text-sm z-10 backdrop-blur-lg">
        <div className="w-64 text-gray-300 flex px-4 flex-col space-y-2">
          <button
            onClick={() => handleNavigation('/main')}
            className={navButtonClass('/main')}
          >
            <FaHome size={20} className={isActive('/main') ? 'text-white' : 'text-gray-300 group-hover:text-white transition-colors'} />
            <span className={isActive('/main') ? 'font-medium' : ''}>Página Inicial</span>
            {isActive('/main') && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
          </button>

          <button
            onClick={() => handleNavigation('/search')}
            className={navButtonClass('/search')}
            data-onboarding-id="search"
          >
            <MdOutlineManageSearch size={20} className={isActive('/search') ? 'text-white' : 'text-gray-300 group-hover:text-white transition-colors'} />
            <span className={isActive('/search') ? 'font-medium' : ''}>Pesquisar</span>
            {isActive('/search') && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
          </button>

          <button
            onClick={() => handleNavigation('/upload')}
            className={navButtonClass('/upload')}
            data-onboarding-id="upload"
          >
            <IoDocumentSharp size={20} className={isActive('/upload') ? 'text-white' : 'text-gray-300 group-hover:text-white transition-colors'} />
            <span className={isActive('/upload') ? 'font-medium' : ''}>Enviar documentos</span>
            {isActive('/upload') && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
          </button>

          <button
            onClick={() => handleNavigation('/users')}
            className={navButtonClass('/users')}
            data-onboarding-id="users"
          >
            <PiUsersFill size={20} className={isActive('/users') ? 'text-white' : 'text-gray-300 group-hover:text-white transition-colors'} />
            <span className={isActive('/users') ? 'font-medium' : ''}>Gerenciar usuários</span>
            {isActive('/users') && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
          </button>

          <button
            onClick={() => handleNavigation('/statistics')}
            className={navButtonClass('/statistics')}
          >
            <MdPhotoLibrary size={20} className={isActive('/statistics') ? 'text-white' : 'text-gray-300 group-hover:text-white transition-colors'} />
            <span className={isActive('/statistics') ? 'font-medium' : ''}>Galeria</span>
            {isActive('/statistics') && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
          </button>

          <button
            onClick={() => handleNavigation('/chat')}
            className={navButtonClass('/chat')}
            data-onboarding-id="chat"
          >
            <IoChatbox size={20} className={isActive('/chat') ? 'text-white' : 'text-gray-300 group-hover:text-white transition-colors'} />
            <span className={isActive('/chat') ? 'font-medium' : ''}>Chat</span>
            {isActive('/chat') && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
          </button>
        </div>

        <div className="w-64 text-gray-300 flex px-4 flex-col space-y-2 pb-8 border-t border-white/10 pt-4 mt-4">
          <button
            onClick={() => {
              startLoading();
              localStorage.removeItem('token');
              router.push('/login');
            }}
            className="group bg-black/30 hover:bg-red-500/20 p-3 rounded-lg flex items-center justify-start space-x-3 transition-all duration-200 ease-in-out hover:translate-x-1"
          >
            <MdLogout size={20} className='text-red-400 group-hover:text-red-300 transition-colors' />
            <span className="text-red-400 group-hover:text-red-300 transition-colors">Logout</span>
          </button>

          <button
            onClick={() => handleNavigation('/profile')}
            className={navButtonClass('/profile')}
          >
            <CgProfile size={20} className={isActive('/profile') ? 'text-white' : 'text-gray-300 group-hover:text-white transition-colors'} />
            <span className={isActive('/profile') ? 'font-medium' : ''}>Perfil</span>
            {isActive('/profile') && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
          </button>
        </div>
      </div>
    </>
  );
}