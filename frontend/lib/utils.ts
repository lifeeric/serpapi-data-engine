export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

export function formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
}
