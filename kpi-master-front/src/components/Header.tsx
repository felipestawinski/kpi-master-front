'use client';
import Silk from './Silk';

export default function Header () {
    return (
        <header className="h-[40vh] flex flex-col items-center justify-center bg-gray-800 text-white relative overflow-hidden">
            <div className='absolute inset-0 z-0'>
                <Silk
                speed={5}
                scale={1}
                color="#7B7481"
                noiseIntensity={1.5}
                rotation={0}
                /> 
            </div>
            <h1 className="text-2xl font-bold z-10">Welcome to the KPI project</h1>
        </header>
    )
}