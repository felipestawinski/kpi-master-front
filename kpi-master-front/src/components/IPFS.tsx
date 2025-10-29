export default function WhatIsIPFS() {

    return (
        <section className="h-[100vh] max-w-3xl mx-auto p-6 bg-white/10 backdrop-blur-sm rounded-lg shadow-lg mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">O que é IPFS?</h2>
            <p className="text-gray-700 mb-4">
                IPFS (InterPlanetary File System) é um protocolo de rede peer-to-peer projetado para criar um sistema de armazenamento e compartilhamento de arquivos distribuído e descentralizado. Ele permite que os usuários armazenem e acessem arquivos de maneira eficiente, utilizando uma rede global de nós.
            </p>
            <p className="text-gray-700 mb-4">
                Diferente dos sistemas tradicionais de armazenamento baseados em servidores centralizados, o IPFS utiliza uma abordagem distribuída, onde os arquivos são divididos em pequenos pedaços e armazenados em vários nós na rede. Cada arquivo é identificado por um hash criptográfico único, o que garante a integridade e a autenticidade dos dados.
            </p>
            <p className="text-gray-700">
                O IPFS oferece várias vantagens, como maior resistência à censura, redução de custos de armazenamento e maior eficiência na distribuição de conteúdo. Ele é amplamente utilizado em aplicações descentralizadas (dApps), compartilhamento de arquivos e outras soluções que requerem um sistema de armazenamento robusto e confiável.
            </p>

            {/* Display IPFS image below */}
            <div className="mt-6 flex justify-center">
                <img 
                    src="/ipfs-logo.png" 
                    alt="IPFS Logo" 
                    className="h-24 w-24 object-contain"
                />
            </div>
        </section>
    )
}