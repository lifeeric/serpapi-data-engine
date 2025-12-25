import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Types
export interface Contact {
    id: number
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    company?: string
    industry?: string
    location?: string
    city?: string
    state?: string
    country?: string
    source?: string
    created_at: string
    updated_at: string
    intent_scores?: IntentScore[]
}

export interface IntentScore {
    id: number
    contact_id: number
    score: 'LOW' | 'MEDIUM' | 'HIGH'
    score_value: number
    signals?: any
    calculated_at: string
}

export interface Audience {
    id: number
    name: string
    description?: string
    filters?: any
    contact_count: number
    created_at: string
    updated_at: string
}
