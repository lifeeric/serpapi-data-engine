'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function SerpAPIPage() {
    const [query, setQuery] = useState('')
    const [location, setLocation] = useState('')
    const [numResults, setNumResults] = useState(10)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setLoading(true)
            setResult(null)

            const response = await api.post('/data-sources/serpapi/search', {
                query,
                location: location || null,
                num_results: numResults,
            })

            setResult(response.data)
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Search failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">SerpAPI Search</h1>
                <p className="mt-2 text-gray-600">
                    Import contacts from Google search results
                </p>
            </div>

            {/* Search Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Query *
                        </label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., plumbing companies in Austin TX"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Enter a Google search query to find businesses or contacts
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location (optional)
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g., Austin, TX"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Results
                        </label>
                        <select
                            value={numResults}
                            onChange={(e) => setNumResults(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Searching...' : 'Search & Import'}
                    </button>
                </form>
            </div>

            {/* Results */}
            {result && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Import Complete ✓
                    </h2>
                    <div className="space-y-2 text-gray-700 mb-6">
                        <p><strong>Query:</strong> {result.query}</p>
                        <p><strong>Results Found:</strong> {result.results_count}</p>
                        <p><strong>Contacts Created:</strong> {result.contacts_created}</p>
                    </div>
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
