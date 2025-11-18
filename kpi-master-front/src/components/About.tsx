export default function About() {
    return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center bg-gradient-to-b from-gray-200 to-gray-50 py-20 px-4 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-10 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
            
            <div className="max-w-3xl w-full relative z-10">
                <div className="text-center space-y-3">
                    <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Sobre
                    </h2>
                    
                    <div className="space-y-4 text-gray-600">
                        <p className="text-xl leading-relaxed">
                            Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        </p>
                    </div>
                
                    <div className="flex items-center justify-center space-x-3 mt-8 pt-4">
                        {/* span className="text-lg font-semibold text-gray-700">Ver mais</span>< */}
                        <div className="animate-bounce">
                            <svg 
                                className="w-12 h-12 text-gradient-to-r from-orange-600 to-orange-600" 
                                fill="none" 
                                stroke="orange" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2.5} 
                                    d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div> 
    )
}