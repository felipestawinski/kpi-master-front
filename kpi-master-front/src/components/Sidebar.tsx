'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import { CgProfile } from "react-icons/cg";
import { FaHome } from "react-icons/fa";
import { MdOutlineManageSearch } from "react-icons/md";
import { IoDocumentSharp } from "react-icons/io5";
import { PiUsersFill } from "react-icons/pi";
import { MdPhotoLibrary } from "react-icons/md";
import { MdLogout } from "react-icons/md";
import { IoChatbox } from "react-icons/io5";
import { HiMenu } from 'react-icons/hi';
import TopLoadingBar from './TopLoadingBar';
import { useLoading } from '@/components/hooks/useLoading';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const prevPathnameRef = useRef(pathname);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const renderNavItem = (
    route: string,
    label: string,
    Icon: IconType,
    onboardingId?: string,
    index: number = 0
  ) => {
    const active = isActive(route);

    return (
      <button
        key={route}
        onClick={() => handleNavigation(route)}
        className={`group relative w-full flex items-center h-12 px-0 overflow-hidden ${
          active ? 'text-white bg-white/12' : 'text-gray-300 hover:text-white hover:bg-white/12'
        }`}
        data-onboarding-id={onboardingId}
        title={isCollapsed ? label : undefined}
      >
      {/* Active indicator bar */}
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: '15%',
          bottom: '15%',
          width: '3px',
          borderRadius: '0 4px 4px 0',
          background: active
            ? 'linear-gradient(180deg, #fbbf24, #f59e0b)'
            : 'transparent',
          boxShadow: active ? '0 0 8px rgba(251,191,36,0.5)' : 'none',
          opacity: active ? 1 : 0,
          transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s ease',
        }}
      />

      {/* Icon — fixed position, never moves */}
      <span className="flex items-center justify-center w-20 shrink-0">
        <span className="flex">
          <Icon size={20} />
        </span>
      </span>

      {/* Label with smooth slide + fade */}
      <span
        style={{
          marginLeft: '0.5rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          maxWidth: isCollapsed ? 0 : '180px',
          opacity: isCollapsed ? 0 : 1,
          transform: isCollapsed ? 'translateX(-8px)' : 'translateX(0)',
          transition: `
            max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${isCollapsed ? '0s' : `${0.05 + index * 0.03}s`},
            transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${isCollapsed ? '0s' : `${0.05 + index * 0.03}s`}
          `,
          fontWeight: active ? 500 : 400,
        }}
      >
        {label}
      </span>
      </button>
    );
  };

  return (
    <>
      <TopLoadingBar isVisible={isLoading} />

      <div
        style={{
          width: isCollapsed ? '5rem' : '16rem',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="relative text-gray-300 flex flex-col justify-between pt-6 text-sm z-40 bg-zinc-900/90 border-r border-zinc-700/40"
      >
        <div className="text-gray-300 flex flex-col">
          {/* Menu toggle button */}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="w-full flex items-center h-12 text-gray-300 hover:text-white hover:bg-white/12 px-0"
            title={isCollapsed ? 'Expandir menu' : 'Comprimir menu'}
          >
            <span className="flex items-center justify-center w-20 shrink-0">
              <span
                style={{
                  display: 'flex',
                  transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <HiMenu size={20} />
              </span>
            </span>
          </button>

          {renderNavItem('/main', 'Página Inicial', FaHome, undefined, 0)}
          {renderNavItem('/search', 'Pesquisar', MdOutlineManageSearch, 'search', 1)}
          {renderNavItem('/upload', 'Enviar documentos', IoDocumentSharp, 'upload', 2)}
          {renderNavItem('/users', 'Gerenciar usuários', PiUsersFill, 'users', 3)}
          {renderNavItem('/statistics', 'Galeria', MdPhotoLibrary, undefined, 4)}
          {renderNavItem('/chat', 'Chat', IoChatbox, 'chat', 5)}
        </div>

        {/* Bottom section with divider */}
        <div className="text-gray-300 flex flex-col mt-auto pb-6 pt-2"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Logout button */}
          <button
            onClick={() => {
              startLoading();
              localStorage.removeItem('token');
            router.push('/login');
            }}
            className="group w-full flex items-center h-12 px-0 hover:bg-red-500/15"
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span className="flex items-center justify-center w-20 shrink-0">
              <span className="flex">
                <MdLogout size={20} className='text-red-400 group-hover:text-red-300' />
              </span>
            </span>
            <span
              style={{
                marginLeft: '0.5rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: isCollapsed ? 0 : '180px',
                opacity: isCollapsed ? 0 : 1,
                transform: isCollapsed ? 'translateX(-8px)' : 'translateX(0)',
                transition: `
                  max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${isCollapsed ? '0s' : '0.08s'},
                  transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${isCollapsed ? '0s' : '0.08s'}
                `,
              }}
              className="text-red-400 group-hover:text-red-300"
            >
              Logout
            </span>
          </button>

          {renderNavItem('/profile', 'Perfil', CgProfile, undefined, 7)}
        </div>
      </div>
    </>
  );
}