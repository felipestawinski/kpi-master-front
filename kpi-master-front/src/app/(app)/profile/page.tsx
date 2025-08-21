'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type UserInfo = {
  email: string;
  username: string;
  institution?: string;
  role?: string;
  accessType?: string;
  profileImageUrl?: string; // stored URL if you have one
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Image upload state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null), []);

  useEffect(() => {
    // Protect the route minimally (client-side)
    const rawUser = localStorage.getItem('user'); // 👈 Expect a JSON blob
    if (!rawUser) {
      // Fallback: try to build user from individual keys if that’s how you stored it
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
      // If parsing fails, clear and bounce to login
      localStorage.removeItem('user');
      router.push('/login');
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  // File input -> preview URL
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const uploadPicture = async () => {
    if (!file) {
      alert('Please choose an image first.');
      return;
    }
    try {
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

      // If your backend returns the final URL of the stored image, parse it here:
      // const { url } = JSON.parse(text);
      // For now we’ll just keep using the local preview until you return a URL.
      const finalUrlFromServer = profileURL; // replace with parsed URL

      // Update localStorage copy so it persists across reloads
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
      alert('Profile picture uploaded!');
      // Optional: if backend gives you a definitive URL, you might want to force-refresh:
      // router.refresh();
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    }
  };

  if (loading) return <div className="p-10">Loading profile…</div>;
  if (!user) return <div className="p-10">No user info found.</div>;
  const picture = localStorage.getItem('profileImageUrl') || '';

  return (
    <div className="p-8 bg-gray-100">
      <div className="max-w-3xl mx-auto bg-white p-6 shadow rounded">
        <div className="flex items-center gap-6">
          <img
            src={picture}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border"
          />
          <div>
            <input type="file" accept="image/*" onChange={onFileChange} className="mb-2" />
            <button
              onClick={uploadPicture}
              className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
            >
              Upload new picture
            </button>
          </div>
        </div>

        <hr className="my-6" />

        <h1 className="text-2xl font-semibold mb-4">Your Info</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-900">
          <Info label="Email" value={user.email || '-'} />
          <Info label="Username" value={user.username || '-'} />
          <Info label="Institution" value={user.institution || '-'} />
          <Info label="Role" value={user.role || '-'} />
          <Info label="Access Type" value={user.accessType || '-'} />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
