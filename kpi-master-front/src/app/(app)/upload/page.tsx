'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadDocument() {

    const sendFile = async () => {

    }

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Handle file selection
        }
    };

    return (
        <div className='bg-gray-100 p-8'>
            <h1 className='text-2xl font-semibold mb-4'>Upload Document</h1>
            <input type='file' accept='application/pdf' className='mb-4' onChange={onFileChange}/>
            <button onClick={sendFile}
            className='px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600'>
                Upload
            </button>
        </div>
    );
}