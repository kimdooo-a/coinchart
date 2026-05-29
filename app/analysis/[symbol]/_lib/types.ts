// analysis/[symbol] route-local 공유 타입
import type { TRANSLATIONS } from '@/lib/translations'

export type Language = 'ko' | 'en'

/** TRANSLATIONS[lang] 한 언어 묶음의 타입 */
export type Translation = (typeof TRANSLATIONS)['ko']
