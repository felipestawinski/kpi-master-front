'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineCloudUpload } from "react-icons/ai";
import { MdOutlineManageSearch, MdPhotoLibrary } from "react-icons/md";
import { IoChatbox } from "react-icons/io5";
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
                <div className={`flex-initial space-y-5 items-center text-center transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}>
                    <h1 className="text-4xl font-light text-gray-400">Olá,</h1>
                    <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-500 to-amber-500 bg-clip-text text-transparent leading-normal pb-1">{username}</h1>
                    <p className="text-2xl mt-4 text-gray-400 font-light">Bem vindo ao seu painel.</p>
                </div>

                {/* Bento grid */}
                <div className='flex-1 flex items-center flex-col justify-center space-y-6'>
                    <p className={`text-sm uppercase tracking-[0.25em] text-gray-500 font-medium transition-all duration-1000 delay-300 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}>
                        Acesso rápido
                    </p>

                    {/* Bento grid: 4 cols × 2 rows */}
                    <div className='grid grid-cols-4 grid-rows-2 gap-3 w-full max-w-3xl px-4' style={{ height: '280px' }}>

                        {/* BIG — Chat IA (left half, spans 2 rows) */}
                        <div
                            className={`group relative col-span-2 row-span-2 overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 ease-out
                                bg-gradient-to-br from-slate-800/60 to-slate-900/80 hover:from-slate-700/70 hover:to-slate-800/90
                                border border-slate-700/30 hover:border-amber-500/50
                                hover:shadow-xl hover:shadow-amber-500/10
                                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                            `}
                            style={{ transitionDelay: '400ms' }}
                            onClick={() => handleNavigation('/chat')}
                        >
                            {/* Background icon */}
                            <IoChatbox
                                size={140}
                                className="absolute -top-8 -right-8 text-slate-700/20 group-hover:text-amber-500/15 group-hover:scale-110 transition-all duration-500 pointer-events-none"
                            />

                            {/* Left accent bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500/0 group-hover:bg-gradient-to-b group-hover:from-amber-400 group-hover:to-amber-600 transition-all duration-300" />

                            <button className="relative z-10 flex flex-col justify-end h-full w-full p-7 text-left">
                                <div>
                                    <span className="block text-xl font-semibold text-gray-200 group-hover:text-white transition-colors duration-300">
                                        Chat IA
                                    </span>
                                    <span className="block text-sm text-gray-500 group-hover:text-gray-400 transition-colors duration-300 mt-1">
                                        Converse com a inteligência artificial
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* MEDIUM — Pesquisar (right-upper, spans 2 cols × 1 row) */}
                        <div
                            className={`group relative col-span-2 row-span-1 overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 ease-out
                                bg-gradient-to-br from-slate-800/50 to-slate-900/70 hover:from-slate-700/60 hover:to-slate-800/80
                                border border-slate-700/30 hover:border-amber-500/40
                                hover:shadow-lg hover:shadow-amber-500/8
                                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                            `}
                            style={{ transitionDelay: '550ms' }}
                            onClick={() => handleNavigation('/search')}
                        >
                            {/* Background icon */}
                            <MdOutlineManageSearch
                                size={100}
                                className="absolute -top-6 -right-6 text-slate-700/20 group-hover:text-amber-500/15 group-hover:scale-110 transition-all duration-500 pointer-events-none"
                            />

                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-amber-500/0 group-hover:bg-amber-500 transition-all duration-300" />

                            <button className="relative z-10 flex flex-col justify-end h-full w-full px-6 py-5 text-left">
                                <span className="block text-base font-semibold text-gray-300 group-hover:text-white transition-colors duration-300">
                                    Pesquisar
                                </span>
                                <span className="block text-xs text-gray-600 group-hover:text-gray-400 transition-colors duration-300 mt-0.5">
                                    Buscar documentos rapidamente
                                </span>
                            </button>
                        </div>

                        {/* SMALL — Upload (right-bottom-left) */}
                        <div
                            className={`group relative col-span-1 row-span-1 overflow-hidden rounded-xl cursor-pointer transition-all duration-500 ease-out
                                bg-slate-800/40 hover:bg-slate-800/70
                                border border-slate-700/30 hover:border-amber-500/40
                                hover:shadow-lg hover:shadow-amber-500/5
                                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                            `}
                            style={{ transitionDelay: '700ms' }}
                            onClick={() => handleNavigation('/upload')}
                        >
                            {/* Background icon */}
                            <AiOutlineCloudUpload
                                size={72}
                                className="absolute -top-4 -right-4 text-slate-700/20 group-hover:text-amber-500/15 group-hover:scale-110 transition-all duration-500 pointer-events-none"
                            />

                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-amber-500/0 group-hover:bg-amber-500 transition-all duration-300" />

                            <button className="relative z-10 flex flex-col justify-end h-full w-full p-4 text-left">
                                <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors duration-300">
                                    Upload
                                </span>
                            </button>
                        </div>

                        {/* SMALL — Galeria (right-bottom-right) */}
                        <div
                            className={`group relative col-span-1 row-span-1 overflow-hidden rounded-xl cursor-pointer transition-all duration-500 ease-out
                                bg-slate-800/40 hover:bg-slate-800/70
                                border border-slate-700/30 hover:border-amber-500/40
                                hover:shadow-lg hover:shadow-amber-500/5
                                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                            `}
                            style={{ transitionDelay: '850ms' }}
                            onClick={() => handleNavigation('/statistics')}
                        >
                            {/* Background icon */}
                            <MdPhotoLibrary
                                size={72}
                                className="absolute -top-4 -right-4 text-slate-700/20 group-hover:text-amber-500/15 group-hover:scale-110 transition-all duration-500 pointer-events-none"
                            />

                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-amber-500/0 group-hover:bg-amber-500 transition-all duration-300" />

                            <button className="relative z-10 flex flex-col justify-end h-full w-full p-4 text-left">
                                <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors duration-300">
                                    Galeria
                                </span>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}