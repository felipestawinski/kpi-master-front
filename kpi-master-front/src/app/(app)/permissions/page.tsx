'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a file.');
      return;
    }
    if (!filename) {
      alert('Please enter a filename.');
      return;
    }

    try {
      const token = localStorage.getItem('token'); // if auth required
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', filename);

      const res = await fetch('http://localhost:8080/upload-file', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Upload failed');

      alert('File uploaded successfully!');
      setFile(null);
      setFilename('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-full">
      <div className="max-w-lg mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-semibold mb-4">Upload a File</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Select file</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Enter filename"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Upload
          </button>
        </form>
      </div>
    </div>
  );
}
