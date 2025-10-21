export default function About() {

    return (
        <div className="flex flex-col flex-1 items-center justify-center p-8 bg-white text-gray-800">
            <h2 className="text-3xl font-bold mb-4">About Us</h2>
            <p className="mb-2">
                Welcome to our application! We are dedicated to providing the best service possible.
            </p>
            <p className="mb-6">
                Our team is passionate about creating innovative solutions that make a difference.
            </p>
            
            <div className="flex items-center space-x-2 mt-4">
                <span className="text-lg font-medium">Learn more</span>
                <div className="animate-bounce">
                    <svg 
                        className="w-6 h-6 text-gray-600" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                        />
                    </svg>
                </div>
            </div>
        </div> 
    )
}