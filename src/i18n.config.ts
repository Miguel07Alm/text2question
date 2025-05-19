export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'ja', 'de', 'ar']
} as const

export type Locale = (typeof i18n)['locales'][number]
