import Header from '@/components/Header';
import About from '@/components/About';
import WhatIsIPFS from '@/components/IPFS';
import DataAnalysis from '@/components/DataAnalysis';

export default function LobbyPage() {
 return (
  <main className="min-h-screen">
   <Header />
   <About />
   <WhatIsIPFS />
   <DataAnalysis />
  </main>
 );
}
