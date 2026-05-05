'use client';

import AuthGuard from '@/components/AuthGuard';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Trash2, Download, X, Image as ImageIcon } from 'lucide-react';

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

 // Refs for the fixed right-edge scrollbar (DOM-only, no React state)
 const scrollContainerRef = useRef<HTMLDivElement>(null);
 const scrollTrackRef = useRef<HTMLDivElement>(null);
 const scrollThumbRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  fetchGallery();
 }, []);

 // Update the fixed right-edge scrollbar via direct DOM manipulation
 useEffect(() => {
  const el = scrollContainerRef.current;
  if (!el) return;
  const update = () => {
   const thumb = scrollThumbRef.current;
   const track = scrollTrackRef.current;
   if (!thumb || !track) return;
   const { scrollTop, scrollHeight, clientHeight } = el;
   const canScroll = scrollHeight > clientHeight;
   if (!canScroll) {
    track.style.display = 'none';
    return;
   }
   track.style.display = '';
   const thumbRatio = clientHeight / scrollHeight;
   const thumbHeight = Math.max(thumbRatio * 100, 8);
   const scrollRatio = scrollTop / (scrollHeight - clientHeight);
   const thumbTop = scrollRatio * (100 - thumbHeight);
   thumb.style.top = `${thumbTop}%`;
   thumb.style.height = `${thumbHeight}%`;
  };
  update();
  el.addEventListener('scroll', update, { passive: true });
  const ro = new ResizeObserver(update);
  ro.observe(el);
  return () => {
   el.removeEventListener('scroll', update);
   ro.disconnect();
  };
 }, [images]);

 // Drag-to-scroll handler for the fixed scrollbar thumb
 const handleScrollbarDrag = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  const el = scrollContainerRef.current;
  if (!el) return;
  const startY = e.clientY;
  const startScrollTop = el.scrollTop;
  const trackHeight = window.innerHeight;
  const { scrollHeight, clientHeight } = el;
  const maxScroll = scrollHeight - clientHeight;
  const onMove = (ev: MouseEvent) => {
   const deltaY = ev.clientY - startY;
   const scrollDelta = (deltaY / trackHeight) * scrollHeight;
   el.scrollTop = Math.min(Math.max(startScrollTop + scrollDelta, 0), maxScroll);
  };
  const onUp = () => {
   document.removeEventListener('mousemove', onMove);
   document.removeEventListener('mouseup', onUp);
   document.body.style.cursor = '';
   document.body.style.userSelect = '';
  };
  document.body.style.cursor = 'grabbing';
  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
 }, []);

 // Click on track to jump scroll position
 const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
  const el = scrollContainerRef.current;
  if (!el) return;
  if ((e.target as HTMLElement).classList.contains('fixed-scroll-thumb')) return;
  const trackRect = e.currentTarget.getBoundingClientRect();
  const clickRatio = (e.clientY - trackRect.top) / trackRect.height;
  const { scrollHeight, clientHeight } = el;
  el.scrollTop = clickRatio * (scrollHeight - clientHeight);
 }, []);

 // Forward wheel events to the scroll container with smooth interpolation
 useEffect(() => {
  const el = scrollContainerRef.current;
  if (!el) return;

  let targetScrollTop = el.scrollTop;
  let animating = false;
  const LERP = 0.18;
  const EPSILON = 0.5;

  const animate = () => {
   const diff = targetScrollTop - el.scrollTop;
   if (Math.abs(diff) < EPSILON) {
    el.scrollTop = targetScrollTop;
    animating = false;
    return;
   }
   el.scrollTop += diff * LERP;
   requestAnimationFrame(animate);
  };

  const onWheel = (e: WheelEvent) => {
   e.preventDefault();
   const maxScroll = el.scrollHeight - el.clientHeight;
   targetScrollTop = Math.min(Math.max(targetScrollTop + e.deltaY, 0), maxScroll);
   if (!animating) {
    animating = true;
    requestAnimationFrame(animate);
   }
  };

  const onScroll = () => {
   if (!animating) {
    targetScrollTop = el.scrollTop;
   }
  };

  document.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('scroll', onScroll, { passive: true });
  return () => {
   document.removeEventListener('wheel', onWheel);
   el.removeEventListener('scroll', onScroll);
  };
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
  <div className="h-screen flex flex-col overflow-hidden" style={{ overscrollBehavior: 'none', touchAction: 'pan-x pinch-zoom' }}>
   <style jsx global>{`
    .hidden-scrollbar {
     overflow-y: hidden;
     scrollbar-width: none;
     -ms-overflow-style: none;
    }
    .hidden-scrollbar::-webkit-scrollbar {
     display: none;
    }

    .fixed-scroll-track {
     position: fixed;
     right: 0;
     top: 0;
     bottom: 0;
     width: 8px;
     z-index: 50;
     pointer-events: auto;
     cursor: pointer;
    }
    .fixed-scroll-thumb {
     position: absolute;
     right: 0;
     width: 8px;
     border-radius: 4px;
     background: rgba(255,255,255,0.18);
     transition: background 0.2s, opacity 0.3s;
     opacity: 0.6;
     cursor: grab;
     pointer-events: auto;
    }
    .fixed-scroll-thumb:hover,
    .fixed-scroll-thumb:active {
     background: rgba(255,255,255,0.35);
     opacity: 1;
    }
    .fixed-scroll-thumb:active {
     cursor: grabbing;
    }

    @keyframes galleryFadeIn {
     from { opacity: 0; transform: scale(0.96); }
     to   { opacity: 1; transform: scale(1); }
    }
    .gallery-card-enter {
     animation: galleryFadeIn 0.35s ease-out both;
    }

    @keyframes lightboxIn {
     from { opacity: 0; }
     to   { opacity: 1; }
    }
    .lightbox-enter {
     animation: lightboxIn 0.25s ease-out;
    }
   `}</style>

   {/* Header */}
   <div className="flex items-center space-x-3 px-8 pt-6 pb-4 flex-shrink-0">
    <div className="p-2.5 bg-amber-500/15 rounded-xl">
     <ImageIcon className="w-5 h-5 text-amber-400" />
    </div>
    <h1 className="text-xl font-semibold text-white tracking-tight">Galeria de Gráficos</h1>
    {images.length > 0 && (
     <span className="ml-2 text-xs text-white/40 font-medium">{images.length} {images.length === 1 ? 'item' : 'itens'}</span>
    )}
   </div>

   {/* Scrollable content area */}
   <div ref={scrollContainerRef} className="flex-1 hidden-scrollbar px-6 pb-8">
    {isLoading ? (
     <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
     </div>
    ) : images.length === 0 ? (
     <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-3">
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
       <ImageIcon className="w-12 h-12 opacity-50" />
      </div>
      <p className="text-base font-medium">Nenhum gráfico na galeria.</p>
      <p className="text-sm text-white/30">Gere gráficos no chat e clique em &quot;Enviar para Galeria&quot;.</p>
     </div>
    ) : (
     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
      {images.map((img, index) => (
       <div
        key={img._id}
        className="gallery-card-enter group relative rounded-lg overflow-hidden cursor-pointer"
        style={{ animationDelay: `${index * 30}ms` }}
        onClick={() => setSelectedImage(img)}
       >
        <div className="aspect-[4/3] w-full bg-black/20 flex items-center justify-center overflow-hidden p-1.5">
         <img
          src={img.image.startsWith('data:') ? img.image : `data:image/png;base64,${img.image}`}
          alt="Gallery item"
          className="max-w-full max-h-full object-contain rounded"
         />
        </div>

        {/* Delete button */}
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
         <button
          onClick={(e) => { e.stopPropagation(); deleteImage(img._id); }}
          className="p-1.5 bg-red-500/60 hover:bg-red-500/90 text-white rounded-lg backdrop-blur-md shadow-lg transition-colors"
          aria-label="Excluir imagem"
         >
          <Trash2 className="w-3 h-3" />
         </button>
        </div>
       </div>
      ))}
     </div>
    )}
   </div>

   {/* Fixed right-edge scrollbar */}
   <div ref={scrollTrackRef} className="fixed-scroll-track" style={{ display: 'none' }} onClick={handleTrackClick}>
    <div
     ref={scrollThumbRef}
     className="fixed-scroll-thumb"
     onMouseDown={handleScrollbarDrag}
    />
   </div>

   {/* Lightbox Modal — constrained to the main content area, never overlaps sidebar */}
   {selectedImage && (
    <div
     className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 lg:p-10 lightbox-enter"
     onClick={() => setSelectedImage(null)}
    >
     <div className="absolute top-5 right-5 flex items-center space-x-3 z-10">
      <button
       onClick={(e) => { e.stopPropagation(); handleDownload(selectedImage); }}
       className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all flex items-center space-x-2"
       aria-label="Baixar imagem"
      >
       <Download className="w-4.5 h-4.5" />
       <span className="font-medium text-sm hidden sm:inline">Baixar</span>
      </button>
      <button
       onClick={() => setSelectedImage(null)}
       className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all"
       aria-label="Fechar"
      >
       <X className="w-4.5 h-4.5" />
      </button>
     </div>

     <div className="relative flex items-center justify-center w-full h-full">
      <img
       src={selectedImage.image.startsWith('data:') ? selectedImage.image : `data:image/png;base64,${selectedImage.image}`}
       alt="Amplified gallery item"
       className="object-contain rounded-xl shadow-2xl"
       style={{ maxWidth: '70%', maxHeight: '80%' }}
       onClick={(e) => e.stopPropagation()}
      />
     </div>
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