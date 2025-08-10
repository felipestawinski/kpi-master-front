'use client'

import { useState } from 'react';

export default function Search() {

    const [label, setLabel] = useState('')

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:8080/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label }),
            });

            const resultText = await response.text();

            if (!response.ok) throw new Error(resultText || 'Search failed');


            // router.push('/dashboard'); // or wherever you want to redirect
            } catch (error: any) {
            alert('Login failed: ' + error.message);
            }
        };
    


    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-100'>
            <div className='bg-white p-8 shadow rounded-lg w-full max-w-md'>
                <form onSubmit={handleSearch}>
                    <input
                        type="label"
                        placeholder="Label"
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        className="w-full mb-3 px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-amber-500"
                        required
                    />
                </form>
                <button type="submit" className="w-full py-2 bg-amber-500 text-white rounded">
                    Submit
                </button>
            </div>
        </div>
    )
}