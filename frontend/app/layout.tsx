import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Intent Data Engine',
    description: 'Simple intent-based contact data management',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="min-h-screen flex flex-col">
                    <Navigation />
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    )
}
