export default function WhatIsIPFS() {
    return (
        <section className="min-h-screen flex items-center justify-center py-16 px-4">
            <div className="max-w-4xl w-full">
                {/* Header with gradient */}
                <div className="text-center mb-12">
                    <div className="inline-block mb-4">
                        <img 
                            src="/ipfs-logo.png" 
                            alt="IPFS Logo" 
                            className="h-20 w-20 object-contain mx-auto drop-shadow-lg"
                        />
                    </div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        O que é IPFS?
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
                </div>

                {/* Content cards */}
                <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
                        <p className="text-gray-700 leading-relaxed text-lg">
                            IPFS (InterPlanetary File System) é um protocolo de rede peer-to-peer projetado para criar um sistema de armazenamento e compartilhamento de arquivos distribuído e descentralizado. Ele permite que os usuários armazenem e acessem arquivos de maneira eficiente, utilizando uma rede global de nós.
                        </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
                        <p className="text-gray-700 leading-relaxed text-lg">
                            Diferente dos sistemas tradicionais de armazenamento baseados em servidores centralizados, o IPFS utiliza uma abordagem distribuída, onde os arquivos são divididos em pequenos pedaços e armazenados em vários nós na rede. Cada arquivo é identificado por um hash criptográfico único, o que garante a integridade e a autenticidade dos dados.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100">
                        <p className="text-gray-700 leading-relaxed text-lg">
                            O IPFS oferece várias vantagens, como maior resistência à censura, redução de custos de armazenamento e maior eficiência na distribuição de conteúdo. Ele é amplamente utilizado em aplicações descentralizadas (dApps), compartilhamento de arquivos e outras soluções que requerem um sistema de armazenamento robusto e confiável.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}