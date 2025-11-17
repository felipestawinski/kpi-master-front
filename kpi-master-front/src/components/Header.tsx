'use client';
import Silk from './Silk';
import { useRouter } from 'next/navigation';

export default function Header () {
    const router = useRouter();

    const handleNavigation = (route: string) => {
        router.push(route);
    };

    return (
        <header className="h-[40vh] flex flex-col items-center justify-center bg-gray-800 text-white relative overflow-hidden">
            <div className='absolute inset-0 z-0'>
                <Silk
                    speed={3}
                    scale={1}
                    color="#fe9a00"
                    noiseIntensity={1.0}
                    rotation={0}
                /> 
            </div>

            <div className='absolute flex top-6 left-6 space-x-3 z-10'>
                <button
                    onClick={() => handleNavigation('/login')}
                    className="group bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
                >
                    <span className="text-white font-medium">Login</span>
                </button>

                <button
                    onClick={() => handleNavigation('/main')}
                    className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
                >
                    <span className="text-white font-medium">Register</span>
                </button>
            </div>

            <div className="z-10 text-center space-y-4">
                <h1 className="text-5xl font-bold tracking-tight drop-shadow-2xl">
                    Welcome to the <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">KPI</span> project
                </h1>
                <p className="text-white/80 text-lg font-light">Building the future of decentralized data management</p>
            </div>
        </header>
    )
}