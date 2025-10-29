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

            <div className='absolute flex top-4 left-4 space-x-4 z-10'>
                <button
                    onClick={() => handleNavigation('/login')}
                    className="bg-gray-100/50 hover:bg-gray-100/70 p-3 rounded flex items-center justify-start space-x-2 h-12 z-1 text-black"
                    >
                    <span>Login</span>
                </button>

                <button
                    onClick={() => handleNavigation('/main')}
                    className="bg-gray-100/50 hover:bg-gray-100/70 p-3 rounded flex items-center justify-start space-x-2 h-12 z-1 text-black"
                    >
                    <span>Register</span>
                </button>
            </div>

            <h1 className="text-2xl font-bold z-10">Welcome to the KPI project</h1>

        </header>
    )
}