'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/lib/i18n';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => { },
    t: (k) => k
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLang] = useState<Language>('en');

    useEffect(() => {
        const saved = localStorage.getItem('mindtrack_language') as Language;
        if (saved && (saved === 'en' || saved === 'ta')) {
            setLang(saved);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLang(lang);
        localStorage.setItem('mindtrack_language', lang);
    };

    const t = (key: string) => {
        return translations[language][key as keyof typeof translations.en] || translations['en'][key as keyof typeof translations.en] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
