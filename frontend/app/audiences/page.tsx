'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Audience } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

export default function AudiencesPage() {
    const [audiences, setAudiences] = useState<Audience[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAudiences()
    }, [])

    const loadAudiences = async () => {
        try {
            const response = await api.get('/audiences/')
            setAudiences(response.data.audiences)
        } catch (error) {
            console.error('Failed to load audiences:', error)
        } finally {
            setLoading(false)
        }
    }

    const deleteAudience = async (id: number) => {
        if (!confirm('Are you sure you want to delete this audience?')) return

        try {
            await api.delete(`/audiences/${id}`)
            setAudiences(audiences.filter(a => a.id !== id))
        } catch (error) {
            alert('Failed to delete audience')
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Audiences</h1>
                    <p className="mt-2 text-gray-600">
                        {audiences.length} saved audiences
                    </p>
                </div>
                <Link
                    href="/audiences/builder"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    Create Audience
                </Link>
            </div>

            {loading ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-gray-500">Loading audiences...</div>
                </div>
            ) : audiences.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-gray-500 mb-4">No audiences created yet</div>
                    <Link
                        href="/audiences/builder"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        Create Your First Audience
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {audiences.map((audience) => (
                        <div key={audience.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {audience.name}
                                        </h3>
                                        {audience.description && (
                                            <p className="mt-1 text-sm text-gray-600">
                                                {audience.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Contacts:</span>
                                        <span className="font-semibold text-gray-900">
                                            {audience.contact_count}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Created:</span>
                                        <span className="text-gray-900">
                                            {formatDateTime(audience.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Link
                                        href={`/audiences/${audience.id}`}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition"
                                    >
                                        View
                                    </Link>
                                    <button
                                        onClick={() => deleteAudience(audience.id)}
                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
