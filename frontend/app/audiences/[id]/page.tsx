'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, Audience, Contact } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import IntentBadge from '@/components/IntentBadge'

export default function AudienceDetailPage() {
    const params = useParams()
    const router = useRouter()
    const audienceId = params?.id as string

    const [audience, setAudience] = useState<Audience | null>(null)
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        if (audienceId) {
            loadAudience()
            loadContacts()
        }
    }, [audienceId, page])

    const loadAudience = async () => {
        try {
            const response = await api.get(`/audiences/${audienceId}`)
            setAudience(response.data)
        } catch (error) {
            console.error('Failed to load audience:', error)
        }
    }

    const loadContacts = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/audiences/${audienceId}/contacts`, {
                params: { page, page_size: 50 }
            })
            setContacts(response.data.contacts)
            setTotal(response.data.total)
        } catch (error) {
            console.error('Failed to load contacts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        router.push(`/exports?audienceId=${audienceId}`)
    }

    if (!audience && !loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">Audience not found</div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {audience && (
                <>
                    <div className="mb-8">
                        <Link href="/audiences" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
                            ← Back to Audiences
                        </Link>
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{audience.name}</h1>
                                {audience.description && (
                                    <p className="mt-2 text-gray-600">{audience.description}</p>
                                )}
                                <p className="mt-4 text-sm text-gray-500">
                                    Created {formatDateTime(audience.created_at)} • {audience.contact_count} contacts
                                </p>
                            </div>
                            <button
                                onClick={handleExport}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                            >
                                Export Audience
                            </button>
                        </div>
                    </div>

                    {/* Contacts Table */}
                    {loading ? (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <div className="text-gray-500">Loading contacts...</div>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <div className="text-gray-500">No contacts in this audience</div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Company
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Industry
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Intent
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {contacts.map((contact) => (
                                            <tr key={contact.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {contact.first_name || contact.last_name
                                                            ? `${contact.first_name || ''} ${contact.last_name || ''}`
                                                            : contact.email || 'N/A'}
                                                    </div>
                                                    {contact.email && (
                                                        <div className="text-sm text-gray-500">{contact.email}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{contact.company || '—'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{contact.industry || '—'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {contact.city && contact.state
                                                            ? `${contact.city}, ${contact.state}`
                                                            : contact.location || '—'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <IntentBadge score={contact.intent_scores?.[0]} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {total > 50 && (
                                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                                    <div className="text-sm text-gray-700">
                                        Showing page {page} of {Math.ceil(total / 50)}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={page >= Math.ceil(total / 50)}
                                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
