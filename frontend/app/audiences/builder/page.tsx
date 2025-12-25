'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function AudienceBuilderPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [filters, setFilters] = useState({
        industry: '',
        city: '',
        state: '',
        intentLevel: '',
    })
    const [preview, setPreview] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const handlePreview = async () => {
        try {
            setLoading(true)
            const response = await api.post('/audiences/preview', {
                industry: filters.industry || null,
                city: filters.city || null,
                state: filters.state || null,
                intent_level: filters.intentLevel || null,
            })
            setPreview(response.data)
        } catch (error) {
            alert('Failed to preview audience')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            alert('Please enter an audience name')
            return
        }

        try {
            setLoading(true)
            await api.post('/audiences/', {
                name,
                description: description || null,
                filters: {
                    industry: filters.industry || null,
                    city: filters.city || null,
                    state: filters.state || null,
                    intent_level: filters.intentLevel || null,
                },
            })

            router.push('/audiences')
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to create audience')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Build Audience</h1>
                <p className="mt-2 text-gray-600">
                    Create a filtered audience segment
                </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
                {/* Audience Details */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Audience Details
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., High Intent Plumbers in Austin"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Filter Criteria
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Industry
                            </label>
                            <input
                                type="text"
                                value={filters.industry}
                                onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                                placeholder="e.g., Plumbing"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Intent Level
                            </label>
                            <select
                                value={filters.intentLevel}
                                onChange={(e) => setFilters({ ...filters, intentLevel: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                            </label>
                            <input
                                type="text"
                                value={filters.city}
                                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                                placeholder="e.g., Austin"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                State
                            </label>
                            <input
                                type="text"
                                value={filters.state}
                                onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                                placeholder="e.g., TX"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handlePreview}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Preview Matching Contacts'}
                    </button>
                </div>

                {/* Preview */}
                {preview && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            Preview Results
                        </h3>
                        <p className="text-2xl font-bold text-blue-900 mb-4">
                            {preview.matching_contacts} contacts match these criteria
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating...' : 'Create Audience'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/audiences')}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
