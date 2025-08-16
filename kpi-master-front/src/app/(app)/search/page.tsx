'use client';

import { useEffect, useState } from 'react';

type ApiFile = {
  id: number;
  filename: string;
  institution: string;
  writer: string;
  date: string;
  fileAddress: string;
};


export default function SearchPage() {
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ defer reading localStorage until after mount
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // runs only on client after hydration
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        setUsername(parsed?.username ?? null);
      } else {
        setUsername(localStorage.getItem('username'));
      }
      setToken(localStorage.getItem('token'));
    } catch {
      setUsername(null);
      setToken(null);
    }
  }, []);

  const fetchFiles = async () => {
    if (!username) {
      setError('No username found. Please log in again.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:8080/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `${token}` } : {}),
        },
        body: JSON.stringify({ username }),
      });
      const data: ApiFile[] = await res.json(); // header is application/json

      if (!res.ok) throw new Error('Failed to load files.');

      console.log("Array.isArray(data)", Array.isArray(data));
      console.log("data", data);
      console.log("type of data", typeof data);

      setFiles(Array.isArray(data) ? data : []);
      
    } catch (err: any) {
      setError(err.message || 'Error fetching files.');
    } finally {
      setLoading(false);
    }
  };

  // fetch once we have a username
  useEffect(() => {
    if (username !== null) {
      fetchFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const formatDate = (s?: string) => {
    if (!s) return '-';
    const [d, t] = s.split(' ');
    const [y, m, day] = (d || '').split('-').map(Number);
    const [hh, mm, ss] = (t || '').split(':').map(Number);
    const dt = new Date(y, (m || 1) - 1, day || 1, hh || 0, mm || 0, ss || 0);
    return isNaN(dt.getTime()) ? s : dt.toLocaleString();
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Your Files</h1>
            <p className="text-sm text-gray-600">
              Showing uploads for{' '}
              <span className="font-medium">{username ?? '-'}</span>
            </p>
          </div>
          <button
            onClick={fetchFiles}
            className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {loading && <div className="rounded-lg bg-white p-6 shadow">Loading files…</div>}

        {!loading && error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {!loading && !error && files.length === 0 && (
          <div className="rounded-lg bg-white p-6 text-gray-600 shadow">
            No files found for this user.
          </div>
        )}

        {!loading && !error && files.length > 0 && (
          <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Filename</Th>
                  <Th>Institution</Th>
                  <Th>Writer</Th>
                  <Th>Date</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {files.map((f) => (
                  console.log(typeof(f)),       
                  <tr key={f.id} className="hover:bg-gray-50">
                    <Td className="font-medium text-gray-900">{f.filename}</Td>
                    <Td>{f.institution}</Td>
                    <Td>{f.writer}</Td>
                    <Td>{formatDate(f.date)}</Td>
                    <Td>
                      {f.fileAddress ? (
                        <a
                          href={f.fileAddress}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
      {children}
    </th>
  );
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-4 py-3 text-sm text-gray-700 ${className}`}>{children}</td>;
}
