'use client';

interface LoadingPopupProps {
  isOpen: boolean;
  message?: string;
}

export default function LoadingPopup({ isOpen, message = 'Carregando...' }: LoadingPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-2xl border border-gray-100/50 backdrop-blur-xl transform transition-all animate-in zoom-in duration-300">
        <div className="flex flex-col items-center space-y-4">
          {/* Outer spinning ring */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 opacity-20 blur-xl animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-14 w-14 border-4 border-gray-200/50">
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 border-r-amber-400"></div>
            </div>
            {/* Inner dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
            </div>
          </div>
          
          {/* Message */}
          <div className="text-center space-y-1">
            <p className="text-gray-800 text-base font-semibold tracking-tight">{message}</p>
            <div className="flex items-center justify-center space-x-1">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}