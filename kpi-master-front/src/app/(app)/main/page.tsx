'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineCloudUpload } from "react-icons/ai";
import { MdLeaderboard } from "react-icons/md";
import { MdOutlineManageSearch } from "react-icons/md";

export default function MainPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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
    

  }, [router]);

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
    <div className={`flex min-h-screen p-11 bg-cover bg-left bg-no-repeat transition-all duration-1000 ease-out transform ${
      backgroundVisible ? 'opacity-100' : 'opacity-0'
    }`}>

      {/* Welcome message */}
      <div className="flex-1 flex flex-col">
        <div className={`flex-initial space-y-5 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h1 className="text-4xl font-semibold text-gray-900">Olá,</h1>
          <h1 className="text-5xl font-semibold text-gray-900">{username}</h1>
          <p className="text-3xl mt-4 text-gray-900">Bem vindo ao seu painel.</p>
        </div>

        {/* Introduction */}
        <div className='flex-1 flex items-center flex-col justify-center space-y-4'>
          <p className={`text-gray-800 transition-all duration-1000 delay-300 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Aqui você pode...
          </p>
          
          <div className='flex flex-row space-x-10'>  
            <div className='flex flex-col flex-1 backdrop-blur-sm rounded-full bg-white/25 hover:bg-white/40 cursor-pointer' onClick={() => handleNavigation('/search')} >
              <button className={` p-8 rounded text-gray-800 flex justify-center items-center flex-col w-full transition-all duration-1000 delay-500 ease-out transform  ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}>
                Pesquisar documentos
                <MdOutlineManageSearch size={50} color='black'/>
              </button>
            </div>
            
            <div className='flex flex-col flex-1 backdrop-blur-sm rounded-full bg-white/25 hover:bg-white/40 cursor-pointer' onClick={() => handleNavigation('/upload')}>
              <button className={`  p-8 rounded text-gray-800 flex justify-center items-center flex-col w-full transition-all 
              duration-1000 delay-700 ease-out transform  ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}>
                Carregar documentos
                <AiOutlineCloudUpload size={50} color='black'/>
              </button>
            </div>
            
            <div className='flex flex-col flex-1 backdrop-blur-sm rounded-full bg-white/25 hover:bg-white/40 cursor-pointer' onClick={() => handleNavigation('/statistics')}>
              <button className={`  p-8  rounded text-gray-800 flex justify-center items-center flex-col w-full transition-all duration-1000 delay-900 ease-out transform  ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}>
                Gerar estatísticas
                <MdLeaderboard size={50} color='black' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}