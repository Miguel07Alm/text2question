'use client';

import { usePathname, useRouter } from 'next/navigation';
import { i18n, type Locale } from '@/i18n.config';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface LanguageSwitcherProps {
    dictionary: any;
    currentLocale: Locale;
}

const languageNames: Record<Locale, string> = {
        en: 'English',
        es: 'Español',
        ja: '日本語',
        de: 'Deutsch',
        ar: 'العربية',
};

export default function LanguageSwitcher({ dictionary, currentLocale }: LanguageSwitcherProps) {
    const router = useRouter();
    const pathname = usePathname();

    const handleChange = (newLocale: Locale) => {
        if (!pathname) return;
        const segments = pathname.split('/');
        segments[1] = newLocale;
        router.push(segments.join('/'));
    };

    return (
        <Select value={currentLocale} onValueChange={(value) => handleChange(value as Locale)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={languageNames[currentLocale]} />
            </SelectTrigger>
            <SelectContent>
                {i18n.locales.map((locale) => (
                    <SelectItem key={locale} value={locale}>
                        {languageNames[locale]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
