'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
    const pathname = usePathname()

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(path + '/')
    }

    const navLinks = [
        { href: '/', label: 'Dashboard', icon: '📊' },
        { href: '/contacts', label: 'Contacts', icon: '👥' },
        { href: '/data-sources/serpapi', label: 'SerpAPI', icon: '🔍' },
        { href: '/data-sources/upload', label: 'CSV Upload', icon: '📤' },
        { href: '/audiences', label: 'Audiences', icon: '🎯' },
        { href: '/exports', label: 'Exports', icon: '📥' },
    ]

    return (
        <nav className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 shadow-lg border-b border-primary-900/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center">
                            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                                <span className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl">⚡</span>
                                    Intent Data Engine
                                </span>
                            </div>
                        </Link>
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.href)
                                            ? 'bg-white/20 backdrop-blur-sm text-white shadow-md border border-white/30'
                                            : 'text-white/80 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <span>{link.icon}</span>
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
