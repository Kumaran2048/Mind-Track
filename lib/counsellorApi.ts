/**
 * Counsellor Portal API client.
 * Completely separate from the student-side Supabase client.
 * Attaches "mt_counsellor_token" as Bearer token to every request.
 * On 401 → clears token and redirects to /counsellor/login.
 */

const BASE = '/api/counsellor'

function getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('mt_counsellor_token')
}

async function req<T = any>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken()
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${BASE}${path}`, { ...options, headers })

    if (res.status === 401) {
        localStorage.removeItem('mt_counsellor_token')
        window.location.href = '/counsellor/login'
        throw new Error('Unauthorized')
    }

    const json = await res.json()
    if (!res.ok) throw new Error(json?.error || 'API error')
    return json as T
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const counsellorApi = {
    login: (data: { email: string; password: string }) =>
        req('/login', { method: 'POST', body: JSON.stringify(data) }),

    register: (data: {
        email: string; password: string; name: string;
        institution: string; department: string
    }) => req('/register', { method: 'POST', body: JSON.stringify(data) }),

    getMe: () => req('/me'),

    // ─── Dashboard ─────────────────────────────────────────────────────────────
    getStats: () => req('/stats'),

    // ─── Patients ──────────────────────────────────────────────────────────────
    getPatients: () => req('/patients'),

    addPatient: (data: { studentEmail: string; nickname: string }) =>
        req('/patients/add', { method: 'POST', body: JSON.stringify(data) }),

    removePatient: (id: string) =>
        req(`/patients/${id}`, { method: 'DELETE' }),

    getPatientDetail: (id: string) =>
        req(`/patients/${id}/detail`),

    updateNotes: (id: string, notes: string) =>
        req(`/patients/${id}/notes`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
}
