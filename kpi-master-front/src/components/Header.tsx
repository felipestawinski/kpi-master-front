'use client';
import Silk from './Silk';
import { useRouter } from 'next/navigation';

export default function Header() {
    const router = useRouter();

    const handleNavigation = (route: string) => {
        router.push(route);
    };

    return (
        <header className="h-[60vh] flex flex-col items-center justify-center bg-gray-800 text-white relative overflow-hidden">
            <div className='absolute inset-0 z-0'>
                <Silk
                    speed={3}
                    scale={0.9}
                    color="#1e2938"
                    noiseIntensity={1.0}
                    rotation={0}
                />
            </div>

            {/* Navigation buttons with slide-in animation */}
            <div className='absolute flex top-6 left-6 space-x-3 z-10 animate-on-load animate-slide-in-left'>
                <button
                    onClick={() => handleNavigation('/login')}
                    className="group bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-lg"
                >
                    <span className="text-white font-medium">Logar</span>
                </button>

                <button
                    onClick={() => handleNavigation('/register')}
                    className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-orange-500/25"
                >
                    <span className="text-white font-medium">Registrar</span>
                </button>
            </div>

            {/* Main title with fade-in-up animation */}
            <div className="z-10 text-center space-y-4">
                <h1 className="text-5xl font-bold tracking-tight drop-shadow-2xl text-gray-150 animate-on-load animate-fade-in-up">
                    Bem vindo ao projeto <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">KPI</span>
                </h1>
                <p className="text-white/80 text-lg font-light animate-on-load animate-fade-in-up animation-delay-200">
                    Construindo o futuro da análise e gerenciamento de KPIs
                </p>
            </div>
        </header>
    )
}