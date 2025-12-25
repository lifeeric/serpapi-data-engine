'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Contact } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import IntentBadge from '@/components/IntentBadge'

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [filters, setFilters] = useState({
        search: '',
        industry: '',
        intentLevel: '',
    })

    useEffect(() => {
        loadContacts()
    }, [page, filters])

    const loadContacts = async () => {
        try {
            setLoading(true)
            const params: any = { page, page_size: 50 }

            if (filters.search) params.search = filters.search
            if (filters.industry) params.industry = filters.industry
            if (filters.intentLevel) params.intent_level = filters.intentLevel

            const response = await api.get('/contacts/', { params })
            setContacts(response.data.contacts)
            setTotal(response.data.total)
        } catch (error) {
            console.error('Failed to load contacts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        loadContacts()
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
                <p className="mt-2 text-gray-600">
                    {total} total contacts
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="Name, email, or company..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Industry
                            </label>
                            <input
                                type="text"
                                value={filters.industry}
                                onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                                placeholder="Enter industry..."
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
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                            Apply Filters
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setFilters({ search: '', industry: '', intentLevel: '' })
                                setPage(1)
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            {/* Contacts Table */}
            {loading ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-gray-500">Loading contacts...</div>
                </div>
            ) : contacts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-gray-500">No contacts found</div>
                    <Link
                        href="/data-sources/serpapi"
                        className="mt-4 inline-block text-blue-600 hover:text-blue-700"
                    >
                        Import contacts from SerpAPI
                    </Link>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Added
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDateTime(contact.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
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
                </div>
            )}
        </div>
    )
}
