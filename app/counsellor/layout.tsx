'use client'

import { CounsellorAuthProvider } from '@/context/CounsellorAuthContext'

export default function CounsellorLayout({ children }: { children: React.ReactNode }) {
    return (
        <CounsellorAuthProvider>
            {children}
        </CounsellorAuthProvider>
    )
}
