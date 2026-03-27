'use client';

import AuthGuard from '@/components/AuthGuard';
import { useEffect, useState } from 'react';
import { Trash2, Download, Search, X, Image as ImageIcon } from 'lucide-react';

type GalleryImage = {
  _id: string;
  username: string;
  image: string;
  title?: string;
  createdAt: string;
};

export function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/gallery/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setImages(data);
      }
    } catch (err) {
      console.error('Error loading gallery:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/gallery/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `${token}` } : {}),
        },
        body: JSON.stringify({ imageId }),
      });
      if (res.ok) {
        setImages(prev => prev.filter(img => img._id !== imageId));
        if (selectedImage?._id === imageId) {
          setSelectedImage(null);
        }
      }
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  const handleDownload = (img: GalleryImage) => {
    const link = document.createElement('a');
    link.href = img.image.startsWith('data:') ? img.image : `data:image/png;base64,${img.image}`;
    link.download = `gallery_${img._id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 h-screen flex flex-col overflow-hidden">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
          <ImageIcon className="w-6 h-6 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white drop-shadow-md">Galeria de Gráficos</h1>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4">
            <ImageIcon className="w-16 h-16 opacity-50" />
            <p className="text-lg">Nenhum gráfico na galeria.</p>
            <p className="text-sm">Gere gráficos no chat e clique em "Enviar para Galeria".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map(img => (
              <div 
                key={img._id} 
                className="group relative rounded-xl overflow-hidden bg-black/40 border border-white/20 shadow-xl cursor-pointer hover:border-amber-500/50 transition-all duration-300"
                onClick={() => setSelectedImage(img)}
              >
                <div className="aspect-[4/3] w-full bg-black/60 flex items-center justify-center overflow-hidden p-2">
                  <img 
                    src={img.image.startsWith('data:') ? img.image : `data:image/png;base64,${img.image}`} 
                    alt="Gallery item"
                    className="max-w-full max-h-full object-contain drop-shadow-lg"
                  />
                </div>
                
                {/* Hover overlay for delete */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                  <Search className="w-8 h-8 text-white/80" />
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteImage(img._id); }}
                    className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-md shadow-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 lg:p-8"
          onClick={() => setSelectedImage(null)}
        >
          <div className="absolute top-6 right-6 flex items-center space-x-4">
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(selectedImage); }}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Baixar</span>
            </button>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <img 
            src={selectedImage.image.startsWith('data:') ? selectedImage.image : `data:image/png;base64,${selectedImage.image}`} 
            alt="Amplified gallery item"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default function ProtectedGalleryPage() {
  return (
    <AuthGuard>
      <GalleryPage />
    </AuthGuard>
  );
}