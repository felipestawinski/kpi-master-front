'use client'

export default function WhatIsIPFS() {
    return (
        <section className="min-h-screen flex items-center justify-center py-16 px-4 relative" style={{ backgroundColor: '#1e2938' }}>

            <div className="max-w-3xl w-full relative z-10">
                {/* Header with gradient */}
                <div className="text-center mb-16">
                    <div className="inline-block mb-6">
                        <img 
                            src="/ipfs.tsx.svg" 
                            alt="IPFS Logo" 
                            className="h-24 w-24 object-contain mx-auto drop-shadow-2xl"
                            style={{ filter: 'brightness(0) invert(1)' }}
                        />
                    </div>
                    <h2 className="text-6xl font-bold text-gray-100 mb-8 tracking-wider">
                        IPFS?
                    </h2>
                    
                    <div className="text-left space-y-8 text-gray-100 max-w-2xl mx-auto">
                        <p className="text-2xl leading-relaxed font-light text-center mb-8 tracking-wide">
                            <span className="text-orange-500">I</span>nter<span className="text-orange-500">P</span>lanetary <span className="text-orange-500">F</span>ile <span className="text-orange-500">S</span>ystem
                        </p>
                        
                        <ul className="space-y-6 text-lg tracking-wide">
                            <li className="flex items-start">
                                <span className="mr-3 mt-1.5 text-orange-500 text-3xl">•</span>
                                <span>Um protocolo peer-to-peer descentralizado para armazenamento e compartilhamento de arquivos</span>
                            </li>
                            
                            <li className="flex items-start">
                                <span className="mr-3 mt-1.5 text-orange-500 text-3xl">•</span>
                                <span>Cada arquivo é identificado por um hash criptográfico único, garantindo integridade e autenticidade</span>
                            </li>
                            
                            <li className="flex items-start">
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