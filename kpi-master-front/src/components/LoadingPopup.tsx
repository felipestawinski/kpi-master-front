'use client';

interface LoadingPopupProps {
  isOpen: boolean;
  message?: string;
}

export default function LoadingPopup({ isOpen, message = 'Carregando...' }: LoadingPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1e2938]/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white p-8 rounded-2xl shadow-2xl transform transition-all animate-in zoom-in duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-orange-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-[#1e2938] font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}