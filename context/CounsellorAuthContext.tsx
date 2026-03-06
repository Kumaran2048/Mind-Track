'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { counsellorApi } from '@/lib/counsellorApi'

interface Counsellor {
    id: string
    email: string
    name: string
    institution: string
    department: string
    created_at: string
}

interface CounsellorAuthContextType {
    counsellor: Counsellor | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (data: any) => Promise<void>
    logout: () => void
}

const CounsellorAuthContext = createContext<CounsellorAuthContextType>({
    counsellor: null,
    loading: true,
    login: async () => { },
    register: async () => { },
    logout: () => { },
})

export function CounsellorAuthProvider({ children }: { children: ReactNode }) {
    const [counsellor, setCounsellor] = useState<Counsellor | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // Restore session on mount
    useEffect(() => {
        const token = localStorage.getItem('mt_counsellor_token')
        if (!token) {
            setLoading(false)
            return
        }
        counsellorApi.getMe()
            .then((data) => setCounsellor(data.counsellor))
            .catch(() => localStorage.removeItem('mt_counsellor_token'))
            .finally(() => setLoading(false))
    }, [])

    const login = async (email: string, password: string) => {
        const data = await counsellorApi.login({ email, password })
        localStorage.setItem('mt_counsellor_token', data.token)
        setCounsellor(data.counsellor)
        router.push('/counsellor/dashboard')
    }

    const register = async (formData: any) => {
        const data = await counsellorApi.register(formData)
        localStorage.setItem('mt_counsellor_token', data.token)
        setCounsellor(data.counsellor)
        router.push('/counsellor/dashboard')
    }

    const logout = () => {
        localStorage.removeItem('mt_counsellor_token')
        setCounsellor(null)
        router.push('/counsellor/login')
    }

    return (
        <CounsellorAuthContext.Provider value={{ counsellor, loading, login, register, logout }}>
            {children}
        </CounsellorAuthContext.Provider>
    )
}

export const useCounsellorAuth = () => useContext(CounsellorAuthContext)
