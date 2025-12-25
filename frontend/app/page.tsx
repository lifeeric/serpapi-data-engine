'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function Home() {
    const [stats, setStats] = useState({
        totalContacts: 0,
        highIntent: 0,
        mediumIntent: 0,
        lowIntent: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const response = await api.get('/contacts/?page=1&page_size=1000')
            const contacts = response.data.contacts

            const stats = {
                totalContacts: response.data.total,
                highIntent: contacts.filter((c: any) =>
                    c.intent_scores?.[0]?.score === 'HIGH'
                ).length,
                mediumIntent: contacts.filter((c: any) =>
                    c.intent_scores?.[0]?.score === 'MEDIUM'
                ).length,
                lowIntent: contacts.filter((c: any) =>
                    c.intent_scores?.[0]?.score === 'LOW'
                ).length,
            }

            setStats(stats)
        } catch (error) {
            console.error('Failed to load stats:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            <div className="mb-12">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-4">
                    Intent Data Engine
                </h1>
                <p className="text-lg text-gray-600">
                    Simple, rule-based contact data management
                </p>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="card p-6 animate-shimmer" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-slide-up">
                    <div className="card p-6 border-l-4 border-primary-500 hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-500">
                                Total Contacts
                            </div>
                            <span className="text-2xl">👥</span>
                        </div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                            {stats.totalContacts}
                        </div>
                    </div>

                    <div className="card p-6 border-l-4 border-emerald-500 hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-500">
                                High Intent
                            </div>
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                            {stats.highIntent}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            Ready to convert
                        </div>
                    </div>

                    <div className="card p-6 border-l-4 border-amber-500 hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-500">
                                Medium Intent
                            </div>
                            <span className="text-2xl">⚡</span>
                        </div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            {stats.mediumIntent}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            Nurture opportunity
                        </div>
                    </div>

                    <div className="card p-6 border-l-4 border-gray-400 hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-500">
                                Low Intent
                            </div>
                            <span className="text-2xl">💤</span>
                        </div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-gray-500 to-gray-600 bg-clip-text text-transparent">
                            {stats.lowIntent}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            Long-term leads
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="card">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
                    <p className="text-sm text-gray-600 mt-1">Get started with your intent data</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            href="/data-sources/serpapi"
                            className="group relative overflow-hidden p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-400/10 to-primary-600/10 rounded-bl-full transform group-hover:scale-150 transition-transform duration-300" />
                            <div className="relative">
                                <div className="text-4xl mb-3">🔍</div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900">Search SerpAPI</h3>
                                <p className="text-gray-600 text-sm">
                                    Import contacts from Google search results
                                </p>
                            </div>
                        </Link>

                        <Link
                            href="/data-sources/upload"
                            className="group relative overflow-hidden p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-400/10 to-primary-600/10 rounded-bl-full transform group-hover:scale-150 transition-transform duration-300" />
                            <div className="relative">
                                <div className="text-4xl mb-3">📤</div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900">Upload CSV</h3>
                                <p className="text-gray-600 text-sm">
                                    Import contacts from CSV file
                                </p>
                            </div>
                        </Link>

                        <Link
                            href="/contacts"
                            className="group relative overflow-hidden p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-400/10 to-primary-600/10 rounded-bl-full transform group-hover:scale-150 transition-transform duration-300" />
                            <div className="relative">
                                <div className="text-4xl mb-3">👥</div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900">View Contacts</h3>
                                <p className="text-gray-600 text-sm">
                                    Browse and filter all contacts
                                </p>
                            </div>
                        </Link>

                        <Link
                            href="/audiences/builder"
                            className="group relative overflow-hidden p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-400/10 to-primary-600/10 rounded-bl-full transform group-hover:scale-150 transition-transform duration-300" />
                            <div className="relative">
                                <div className="text-4xl mb-3">🎯</div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900">Build Audience</h3>
                                <p className="text-gray-600 text-sm">
                                    Create filtered audience segments
                                </p>
                            </div>
                        </Link>

                        <Link
                            href="/audiences"
                            className="group relative overflow-hidden p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-400/10 to-primary-600/10 rounded-bl-full transform group-hover:scale-150 transition-transform duration-300" />
                            <div className="relative">
                                <div className="text-4xl mb-3">📊</div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900">View Audiences</h3>
                                <p className="text-gray-600 text-sm">
                                    Manage saved audience segments
                                </p>
                            </div>
                        </Link>

                        <Link
                            href="/exports"
                            className="group relative overflow-hidden p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-400/10 to-primary-600/10 rounded-bl-full transform group-hover:scale-150 transition-transform duration-300" />
                            <div className="relative">
                                <div className="text-4xl mb-3">📥</div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900">Export Data</h3>
                                <p className="text-gray-600 text-sm">
                                    Export contacts as CSV or webhook
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
