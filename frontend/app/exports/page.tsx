'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

function ExportForm() {
    const searchParams = useSearchParams()
    const audienceId = searchParams?.get('audienceId')

    const [format, setFormat] = useState('csv')
    const [selectedAudienceId, setSelectedAudienceId] = useState(audienceId || '')
    const [webhookUrl, setWebhookUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    useEffect(() => {
        if (audienceId) {
            setSelectedAudienceId(audienceId)
        }
    }, [audienceId])

    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault()

        if (format === 'webhook' && !webhookUrl) {
            alert('Please enter a webhook URL')
            return
        }

        try {
            setLoading(true)
            setResult(null)

            const payload: any = {
                format,
                audience_id: selectedAudienceId ? parseInt(selectedAudienceId) : null,
            }

            if (format === 'webhook') {
                payload.webhook_url = webhookUrl
            }

            // For CSV and hashed, use the download endpoint
            if (format === 'csv' || format === 'hashed') {
                const response = await api.post('/exports/download', payload, {
                    responseType: 'blob'
                })

                // Create download
                const blob = new Blob([response.data], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `export_${format}_${Date.now()}.csv`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)

                setResult({
                    format,
                    message: 'Export downloaded successfully',
                    success: true
                })
            } else {
                // Webhook export
                const response = await api.post('/exports/', payload)
                setResult(response.data)
            }
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Export failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Export Contacts</h1>
                <p className="mt-2 text-gray-600">
                    Export contacts in various formats
                </p>
            </div>

            {/* Export Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <form onSubmit={handleExport} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Export Format
                        </label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="csv">CSV - Full Contact Data</option>
                            <option value="hashed">Hashed Emails (SHA-256) - For Ad Platforms</option>
                            <option value="webhook">Webhook - Send to URL</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Source
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    checked={!selectedAudienceId}
                                    onChange={() => setSelectedAudienceId('')}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Export all contacts</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    checked={!!selectedAudienceId}
                                    onChange={() => { }}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Export specific audience</span>
                            </label>
                            {selectedAudienceId && (
                                <input
                                    type="number"
                                    value={selectedAudienceId}
                                    onChange={(e) => setSelectedAudienceId(e.target.value)}
                                    placeholder="Audience ID"
                                    className="ml-6 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            )}
                        </div>
                    </div>

                    {format === 'webhook' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Webhook URL *
                            </label>
                            <input
                                type="url"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                placeholder="https://your-webhook-url.com/endpoint"
                                required={format === 'webhook'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Contact data will be sent as JSON to this URL
                            </p>
                        </div>
                    )}

                    {/* Format Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                            {format === 'csv' && 'CSV Export'}
                            {format === 'hashed' && 'Hashed Export (SHA-256)'}
                            {format === 'webhook' && 'Webhook Delivery'}
                        </h3>
                        <p className="text-sm text-gray-700">
                            {format === 'csv' && 'Downloads a CSV file with all contact fields including name, email, phone, company, location, and intent scores.'}
                            {format === 'hashed' && 'Downloads a CSV with SHA-256 hashed emails only. Perfect for uploading to advertising platforms like Facebook or Google Ads for customer matching.'}
                            {format === 'webhook' && 'Sends contact data as JSON to your specified webhook URL. Useful for integrating with CRMs or automation tools.'}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : 'Export'}
                    </button>
                </form>
            </div>

            {/* Results */}
            {result && (
                <div className={`rounded-lg shadow p-6 ${result.success || result.webhook_sent ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <h2 className="text-xl font-semibold mb-4" style={{ color: result.success || result.webhook_sent ? '#065f46' : '#78350f' }}>
                        {result.success || result.webhook_sent ? 'Export Complete ✓' : 'Export Completed with Warnings'}
                    </h2>
                    <div className="space-y-2" style={{ color: result.success || result.webhook_sent ? '#047857' : '#92400e' }}>
                        <p><strong>Format:</strong> {result.format}</p>
                        {result.record_count !== undefined && (
                            <p><strong>Records:</strong> {result.record_count}</p>
                        )}
                        <p><strong>Message:</strong> {result.message}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function ExportsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading export settings...</div>}>
            <ExportForm />
        </Suspense>
    )
}
