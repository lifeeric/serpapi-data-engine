'use client'

import { useState, useRef } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function CSVUploadPage() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!file) {
            alert('Please select a CSV file')
            return
        }

        try {
            setUploading(true)

            const formData = new FormData()
            formData.append('file', file)

            const response = await api.post('/data-sources/csv/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            setResult(response.data)
            setFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Upload failed')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">CSV Upload</h1>
                <p className="mt-2 text-gray-600">
                    Import contacts from a CSV file
                </p>
            </div>

            {/* CSV Format Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-3">
                    CSV Format Guidelines
                </h2>
                <div className="text-sm text-blue-800 space-y-2">
                    <p>Your CSV should include these columns (case-insensitive):</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><code className="bg-blue-100 px-1 rounded">first_name</code>, <code className="bg-blue-100 px-1 rounded">last_name</code></li>
                        <li><code className="bg-blue-100 px-1 rounded">email</code>, <code className="bg-blue-100 px-1 rounded">phone</code></li>
                        <li><code className="bg-blue-100 px-1 rounded">company</code>, <code className="bg-blue-100 px-1 rounded">industry</code></li>
                        <li><code className="bg-blue-100 px-1 rounded">city</code>, <code className="bg-blue-100 px-1 rounded">state</code>, <code className="bg-blue-100 px-1 rounded">country</code></li>
                        <li><code className="bg-blue-100 px-1 rounded">location</code> or <code className="bg-blue-100 px-1 rounded">address</code></li>
                    </ul>
                    <p className="mt-3 font-medium">At least one of email, phone, or company is required.</p>
                </div>
            </div>

            {/* Upload Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <form onSubmit={handleUpload} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select CSV File
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition">
                            <div className="space-y-1 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                    <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                    >
                                        <span>Upload a file</span>
                                        <input
                                            id="file-upload"
                                            ref={fileInputRef}
                                            name="file-upload"
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            className="sr-only"
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">CSV files only</p>
                                {file && (
                                    <p className="text-sm font-medium text-green-600 mt-2">
                                        Selected: {file.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Uploading...' : 'Upload & Import'}
                    </button>
                </form>
            </div>

            {/* Results */}
            {result && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Import Complete ✓
                    </h2>
                    <div className="space-y-2 text-gray-700 mb-4">
                        <p><strong>File:</strong> {result.filename}</p>
                        <p><strong>Total Rows:</strong> {result.total_rows}</p>
                        <p><strong>Imported Contacts:</strong> {result.imported_contacts}</p>
                        <p><strong>Skipped Rows:</strong> {result.skipped_rows}</p>
                    </div>

                    {result.errors && result.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <h3 className="text-sm font-semibold text-red-900 mb-2">
                                Errors ({result.errors.length})
                            </h3>
                            <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                                {result.errors.map((error: string, index: number) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Link
                        href="/contacts"
                        className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                        View Contacts
                    </Link>
                </div>
            )}
        </div>
    )
}
