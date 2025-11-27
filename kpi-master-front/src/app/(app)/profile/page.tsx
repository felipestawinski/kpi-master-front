'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { User, Mail, Building, Shield, Key, Camera, Upload, Check, Loader2 } from 'lucide-react';

type UserInfo = {
  email: string;
  username: string;
  institution?: string;
  role?: string;
  accessType?: string;
  profileImageUrl?: string; // stored URL if you have one
};

export function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const defaultProfileUrl = 'https://static.vecteezy.com/system/resources/previews/024/183/525/non_2x/avatar-of-a-man-portrait-of-a-young-guy-illustration-of-male-character-in-modern-color-style-vector.jpg';

  // Image upload state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null), []);

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      const username = localStorage.getItem('username') || '';
      const email = localStorage.getItem('email') || '';
      if (!username && !email) {
        router.push('/login');
        return;
      }
      setUser({
        email,
        username: username || email.split('@')[0],
        institution: localStorage.getItem('institution') || undefined,
        role: localStorage.getItem('role') || undefined,
        accessType: localStorage.getItem('accessType') || undefined,
        profileImageUrl: localStorage.getItem('profileImageUrl') || undefined,
      });
      setLoading(false);
      return;
    }

    try {
      const parsed: UserInfo = JSON.parse(rawUser);
      setUser(parsed);
    } catch {
      localStorage.removeItem('user');
      router.push('/login');
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
    setUploadSuccess(false);
  };

  const uploadPicture = async () => {
    if (!file) {
      alert('Please choose an image first.');
      return;
    }
    try {
      setIsUploading(true);
      const form = new FormData();
      form.append('profilePicture', file);

      const res = await fetch('http://localhost:8080/upload-picture', {
        method: 'POST',
        headers: token ? { Authorization: token } : {},
        body: form,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Upload failed');

      console.log('Upload response:', text);
      const profileURL = JSON.parse(text).profilePicture;

      const finalUrlFromServer = profileURL;

      const currentRaw = localStorage.getItem('user');
      if (currentRaw) {
        try {
          const current: UserInfo = JSON.parse(currentRaw);
          const next: UserInfo = {
            ...current,
            profileImageUrl: finalUrlFromServer || current.profileImageUrl,
          };
          localStorage.setItem('user', JSON.stringify(next));
          setUser(next);
        } catch {
          /* ignore */
        }
      } else if (finalUrlFromServer) {
        localStorage.setItem('profileImageUrl', finalUrlFromServer);
      }
      localStorage.setItem('profileImageUrl', finalUrlFromServer);

      setUploadSuccess(true);
      setFile(null);
      setPreviewUrl(null);

      setTimeout(() => {
        setUploadSuccess(false);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center backdrop-blur-xl bg-red-500/20 rounded-2xl p-8 border border-red-400/50">
          <p className="text-white text-lg">Nenhuma informação de usuário encontrada.</p>
        </div>
      </div>
    );
  }

  const picture = previewUrl || localStorage.getItem('profileImageUrl') || defaultProfileUrl;

  return (
    <div className="p-6 max-h-screen overflow-y-auto">
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes success {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .slide-up {
          animation: slideUp 0.4s ease-out;
        }

        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }

        .success-animation {
          animation: success 0.5s ease-out;
        }

        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      <div className="mx-auto max-w-4xl space-y-6">
        <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl border border-white/30 p-8 slide-up">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
              <div className="relative">
                <img
                  src={picture}
                  alt="Perfil"
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white/30 shadow-2xl relative z-10"
                />
                <div className="absolute -bottom-2 -right-2 p-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg z-20">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-2">Foto de Perfil</h2>
                <p className="text-white/60 text-sm">Atualize sua foto de perfil (JPG, PNG ou GIF)</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-300 flex items-center justify-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>{file ? 'Trocar Arquivo' : 'Escolher Arquivo'}</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={onFileChange} 
                    className="hidden" 
                  />
                </label>

                {file && (
                  <button
                    onClick={uploadPicture}
                    disabled={isUploading}
                    className={[
                      'px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center space-x-2',
                      isUploading
                        ? 'bg-gray-500/30 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:scale-105'
                    ].join(' ')}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Enviar Foto</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {file && (
                <div className="fade-in p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <p className="text-white/80 text-sm flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Arquivo selecionado: <span className="font-semibold">{file.name}</span></span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {uploadSuccess && (
          <div className="backdrop-blur-xl bg-green-500/20 rounded-2xl p-6 border border-green-400/50 shadow-2xl success-animation">
            <div className="flex items-center justify-center gap-3 text-green-300">
              <div className="p-2 rounded-full bg-green-500/30">
                <Check className="w-6 h-6" />
              </div>
              <span className="text-lg font-semibold drop-shadow-lg">Foto atualizada com sucesso!</span>
            </div>
          </div>
        )}

        <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl border border-white/30 p-8 slide-up">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-6 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600">
              <User className="w-6 h-6 text-white" />
            </div>
            <span>Informações do Perfil</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard icon={<Mail className="w-5 h-5" />} label="Email" value={user.email || '-'} />
            <InfoCard icon={<User className="w-5 h-5" />} label="Username" value={user.username || '-'} />
            <InfoCard icon={<Building className="w-5 h-5" />} label="Instituição" value={user.institution || '-'} />
            <InfoCard icon={<Shield className="w-5 h-5" />} label="Cargo" value={user.role || '-'} />
            <InfoCard icon={<Key className="w-5 h-5" />} label="Tipo de Acesso" value={user.accessType || '-'} colSpan />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ 
  icon, 
  label, 
  value, 
  colSpan = false 
}: { 
  icon: React.ReactNode;
  label: string; 
  value: string;
  colSpan?: boolean;
}) {
  return (
    <div className={`backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-amber-400/30 transition-all duration-300 group ${colSpan ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center space-x-3 mb-2">
        <div className="text-amber-300 group-hover:text-amber-400 transition-colors">
          {icon}
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-white/60 group-hover:text-white/80 transition-colors">
          {label}
        </div>
      </div>
      <div className="text-lg font-semibold text-white drop-shadow-lg pl-8">
        {value}
      </div>
    </div>
  );
}

export default function ProtectedProfilePage() {
  return (
    <AuthGuard>
      <ProfilePage />
    </AuthGuard>
  );
}
