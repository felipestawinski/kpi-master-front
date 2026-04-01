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
import { HiMenuAlt2 } from 'react-icons/hi';
import LoadingPopup from './LoadingPopup';
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
  ) => (
    <button
      key={route}
      onClick={() => handleNavigation(route)}
      className="group relative w-full flex items-center h-11 px-0 overflow-hidden"
      data-onboarding-id={onboardingId}
      title={isCollapsed ? label : undefined}
      style={{
        color: isActive(route) ? '#ffffff' : '#d1d5db',
        background: isActive(route) ? 'rgba(255,255,255,0.05)' : 'transparent',
        transition: 'background 0.25s ease, color 0.25s ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive(route)) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = '#ffffff';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive(route)) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#d1d5db';
        }
      }}
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
          background: isActive(route)
            ? 'linear-gradient(180deg, #fbbf24, #f59e0b)'
            : 'transparent',
          boxShadow: isActive(route) ? '0 0 8px rgba(251,191,36,0.5)' : 'none',
          opacity: isActive(route) ? 1 : 0,
          transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s ease',
        }}
      />

      {/* Icon — fixed position, never moves */}
      <span className="flex items-center justify-center w-20 shrink-0">
        <span
          style={{
            display: 'flex',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Icon
            size={20}
            style={{
              color: isActive(route) ? '#ffffff' : undefined,
              transition: 'color 0.25s ease',
            }}
          />
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
          fontWeight: isActive(route) ? 500 : 400,
        }}
      >
        {label}
      </span>
    </button>
  );

  return (
    <>
      <LoadingPopup isOpen={isLoading} />

      <div
        style={{
          width: isCollapsed ? '5rem' : '16rem',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="text-gray-300 flex flex-col justify-between pt-6 text-sm z-10 backdrop-blur-lg bg-slate-900/55 border-r border-slate-700/40"
      >
        <div className="text-gray-300 flex flex-col space-y-1">
          {/* Menu toggle button */}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="w-full flex items-center h-11 mb-2 text-gray-300 hover:text-white hover:bg-white/5 px-0"
            title={isCollapsed ? 'Expandir menu' : 'Comprimir menu'}
            style={{ transition: 'background 0.25s ease, color 0.25s ease' }}
          >
            <span className="flex items-center justify-center w-20 shrink-0">
              <span
                style={{
                  display: 'flex',
                  transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <HiMenuAlt2 size={20} />
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
        <div className="text-gray-300 flex flex-col space-y-1 pb-6 pt-4 mt-4"
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
            className="group w-full flex items-center h-11 px-0"
            title={isCollapsed ? 'Logout' : undefined}
            style={{ transition: 'background 0.25s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span className="flex items-center justify-center w-20 shrink-0">
              <span
                style={{
                  display: 'flex',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <MdLogout size={20} className='text-red-400 group-hover:text-red-300 transition-colors' />
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