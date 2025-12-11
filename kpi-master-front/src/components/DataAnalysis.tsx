'use client'

import { useScrollAnimation } from './hooks/useScrollAnimation';

export default function DataAnalysis() {
    const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });

    return (
        <section
            ref={ref}
            className="min-h-screen flex items-center justify-center py-16 px-4 relative bg-gray-100"
        >
            <div className="max-w-3xl w-full relative z-10">
                {/* Header with gradient */}
                <div className="text-center mb-16">
                    {/* Icon with scale animation */}
                    <div
                        className={`inline-block mb-6 transition-all duration-700 ease-out ${isVisible
                                ? 'opacity-100 scale-100'
                                : 'opacity-0 scale-75'
                            }`}
                    >
                        <img
                            src="/6291252.png"
                            alt="Data Analysis Icon"
                            className={`h-24 w-24 object-contain mx-auto drop-shadow-2xl transition-transform duration-300 hover:scale-110 ${isVisible ? 'animate-float-glow' : ''
                                }`}
                        />
                    </div>

                    {/* Title with fade-in */}
                    <h2
                        className={`text-6xl font-bold text-gray-900 mb-8 tracking-wider transition-all duration-700 ease-out delay-100 ${isVisible
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-8'
                            }`}
                    >
                        Análise de Dados
                    </h2>

                    <div className="text-left space-y-8 text-gray-900 max-w-2xl mx-auto">
                        {/* Subtitle */}
                        <p
                            className={`text-2xl leading-relaxed font-light text-center mb-8 tracking-wide transition-all duration-700 ease-out delay-200 ${isVisible
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 translate-y-8'
                                }`}
                        >
                            A Importância da Análise de Dados no <span className="text-orange-500">Esporte Competitivo</span>
                        </p>

                        {/* List items with staggered slide-in from right */}
                        <ul className="space-y-6 text-lg tracking-wide">
                            <li
                                className={`flex items-start transition-all duration-700 ease-out delay-300 ${isVisible
                                        ? 'opacity-100 translate-x-0'
                                        : 'opacity-0 translate-x-8'
                                    }`}
                            >
                                <span className="mr-3 mt-1.5 text-orange-500 text-3xl">•</span>
                                <span>Permite identificar padrões de desempenho e pontos de melhoria através de métricas objetivas e KPIs específicos</span>
                            </li>

                            <li
                                className={`flex items-start transition-all duration-700 ease-out delay-[400ms] ${isVisible
                                        ? 'opacity-100 translate-x-0'
                                        : 'opacity-0 translate-x-8'
                                    }`}
                            >
                                <span className="mr-3 mt-1.5 text-orange-500 text-3xl">•</span>
                                <span>Auxilia na tomada de decisões estratégicas baseadas em evidências, otimizando treinamentos e táticas de jogo</span>
                            </li>

                            <li
                                className={`flex items-start transition-all duration-700 ease-out delay-500 ${isVisible
                                        ? 'opacity-100 translate-x-0'
                                        : 'opacity-0 translate-x-8'
                                    }`}
                            >
                                <span className="mr-3 mt-1.5 text-orange-500 text-3xl">•</span>
                                <span>Possibilita a prevenção de lesões e o monitoramento da carga física dos atletas em tempo real</span>
                            </li>

                            <li
                                className={`flex items-start transition-all duration-700 ease-out delay-[600ms] ${isVisible
                                        ? 'opacity-100 translate-x-0'
                                        : 'opacity-0 translate-x-8'
                                    }`}
                            >
                                <span className="mr-3 mt-1.5 text-orange-500 text-3xl">•</span>
                                <span>Oferece vantagem competitiva ao analisar adversários e adaptar estratégias de forma dinâmica</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}
