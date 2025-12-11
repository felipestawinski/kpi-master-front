'use client'

import { useScrollAnimation } from './hooks/useScrollAnimation';

export default function WhatIsIPFS() {
    const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });

    return (
        <section
            ref={ref}
            className="min-h-screen flex items-center justify-center py-16 px-4 relative"
            style={{ backgroundColor: '#1e2938' }}
        >
            <div className="max-w-3xl w-full relative z-10">
                {/* Header with gradient */}
                <div className="text-center mb-16">
                    {/* Logo with float animation */}
                    <div
                        className={`inline-block mb-6 transition-all duration-700 ease-out ${isVisible
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-75'
                            }`}
                    >
                        <img
                            src="/ipfs.tsx.svg"
                            alt="IPFS Logo"
                            className="h-24 w-24 object-contain mx-auto drop-shadow-2xl [filter:brightness(0)_invert(1)] transition-transform duration-300 hover:scale-110 ${isVisible ? 'animate-float-glow' : ''}"
                        />
                    </div>

                    {/* Title with fade-in */}
                    <h2
                        className={`text-6xl font-bold text-gray-100 mb-8 tracking-wider transition-all duration-700 ease-out delay-100 ${isVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-8'
                            }`}
                    >
                        IPFS?
                    </h2>

                    <div className="text-left space-y-8 text-gray-100 max-w-2xl mx-auto">
                        {/* Subtitle */}
                        <p
                            className={`text-2xl leading-relaxed font-light text-center mb-8 tracking-wide transition-all duration-700 ease-out delay-200 ${isVisible
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-8'
                                }`}
                        >
                            <span className="text-orange-500">I</span>nter<span className="text-orange-500">P</span>lanetary <span className="text-orange-500">F</span>ile <span className="text-orange-500">S</span>ystem
                        </p>

                        {/* List items with staggered animations */}
                        <ul className="space-y-6 text-lg tracking-wide">
                            <li
                                className={`flex items-start transition-all duration-700 ease-out delay-300 ${isVisible
                                    ? 'opacity-100 translate-x-0'
                                    : 'opacity-0 -translate-x-8'
                                    }`}
                            >
                                <span className="mr-3 mt-1.5 text-orange-500 text-3xl">•</span>
                                <span>Um protocolo peer-to-peer descentralizado para armazenamento e compartilhamento de arquivos</span>
                            </li>

                            <li
                                className={`flex items-start transition-all duration-700 ease-out delay-[400ms] ${isVisible
                                    ? 'opacity-100 translate-x-0'
                                    : 'opacity-0 -translate-x-8'
                                    }`}
                            >
                                <span className="mr-3 mt-1.5 text-orange-500 text-3xl">•</span>
                                <span>Cada arquivo é identificado por um hash criptográfico único, garantindo integridade e autenticidade</span>
                            </li>

                            <li
                                className={`flex items-start transition-all duration-700 ease-out delay-500 ${isVisible
                                    ? 'opacity-100 translate-x-0'
                                    : 'opacity-0 -translate-x-8'
                                    }`}
                            >
                                <span className="mr-3 mt-1.5 text-orange-500 text-3xl">•</span>
                                <span>Maior resistência à censura, custos reduzidos e distribuição eficiente de conteúdo</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}