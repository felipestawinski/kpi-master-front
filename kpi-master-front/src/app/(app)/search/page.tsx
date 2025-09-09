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

  const generateAnalysis = async (fileId: number) =>  {
    const res = await fetch('http://localhost:8080/analysis-gen', {
      method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `${token}` } : {}),
          },
          body: JSON.stringify({
            fileId: fileId,
          })
        });

    const text = await res.text();
    console.log("Analysis response:", text);
  }

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
    <div className="p-6 ">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Seus arquivos</h1>
            <p className="text-sm text-white">
              Mostrando uploads para{' '}
              <span className="font-bold ">{username ?? '-'}</span>
            </p>
          </div>
        </div>

        {loading && <div className="rounded-lg p-6 shadow">Carregando arquivos…</div>}

        {!loading && error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {!loading && !error && files.length === 0 && (
          <div className="rounded-lg p-6 text-gray-600 shadow">
            No files found for this user.
          </div>
        )}

        {!loading && !error && files.length > 0 && (
          <div className="overflow-hidden rounded-lg shadow ring-1">
            <table className="min-w-full divide-y backdrop-blur-sm rounded-lg bg-white/25">
              <thead className="backdrop-blur-sm rounded-lg bg-black/20">
                <tr>
                  <Th>Nome</Th>
                  <Th>Instituição</Th>
                  <Th>Autor</Th>
                  <Th>Data</Th>
                  <Th>Arquivo</Th>
                  <Th>Análise</Th>
                </tr>
              </thead>
              <tbody className="divide-y backdrop-blur-sm rounded-lg">
                {files.map((f) => (
                  console.log(typeof(f)),       
                  <tr key={f.id} className="hover:bg-white/20">
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
                          className="text-amber-500 hover:underline"
                        >
                          Abrir
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </Td>
                    <Td> 
                    <button
                        onClick={() => generateAnalysis(f.id)}
                        className="bg-amber-500 hover:bg-amber-600 p-3 rounded"
                      >
                        Gerar análise
                      </button>
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
