import Header from '@/components/Header';
import About from '@/components/About';
import WhatIsIPFS from '@/components/IPFS';

export default function LobbyPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <About />
      <WhatIsIPFS />
    </main>
  );
}
