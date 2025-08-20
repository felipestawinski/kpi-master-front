'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineCloudUpload } from "react-icons/ai";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { CgFileDocument } from "react-icons/cg";
import { FcStatistics } from "react-icons/fc";

export default function MainPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');

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

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <div className="flex min-h-screen p-11">

      {/* Welcome message */}
      <div className="flex-1 bg-gray-100 flex flex-col ">
        <div className='flex-initial'>
          <h1 className="text-4xl font-semibold text-gray-600 ">Hello,</h1>
          <h1 className="text-5xl font-semibold text-amber-500">{username}</h1>
          <p className="text-3xl mt-4 text-gray-700">Welcome to your dashboard.</p>
        </div>

        {/* Introduction */}
        <div className='flex-1 flex items-center flex-col justify-center space-y-4'>
        <p className="text-gray-600">Aqui você pode...</p>
          <div className='flex flex-row space-x-10'>  
              <div className='flex flex-col'>
                <button className='bg-amber-500 p-8 hover:bg-amber-700 rounded text-gray-800 flex justify-center items-center flex-col'>
                  Pesquisar documentos
                  <HiMagnifyingGlass size={30} color='black'/>
                </button>
  
              </div>
              <div className='flex flex-col'>
                <button className='bg-amber-500 p-8 hover:bg-amber-700 rounded text-gray-800 flex justify-center items-center flex-col'>
                  Carregar documentos
                  <AiOutlineCloudUpload size={30} color='black'/>
                </button>
              </div>
              <div className='flex flex-col'>
                <button className='bg-amber-500 p-8 hover:bg-amber-700 rounded text-gray-800 flex justify-center items-center flex-col'>
                  Gerar estatísticas
                  <FcStatistics size={30} color='black' />
                </button>
              </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
