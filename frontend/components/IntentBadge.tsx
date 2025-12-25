import { IntentScore } from '@/lib/api'

interface IntentBadgeProps {
    score: IntentScore | undefined
}

export default function IntentBadge({ score }: IntentBadgeProps) {
    if (!score) {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                N/A
            </span>
        )
    }

    const styles = {
        HIGH: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-sm',
        MEDIUM: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200 shadow-sm',
        LOW: 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-600 border-slate-200',
    }

    const icons = {
        HIGH: '🔥',
        MEDIUM: '⚡',
        LOW: '💤',
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[score.score]}`}>
            <span>{icons[score.score]}</span>
            <span>{score.score}</span>
        </span>
    )
}
