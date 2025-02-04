import { languageMap } from './languages'

export const fallbackLng = 'en'
export const defaultNS = 'translation'

// 从 languageMap 中获取所有支持的语言代码
export const languages = Object.keys(languageMap)

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
    interpolation: {
      escapeValue: false
    },
    load: 'currentOnly', // 只加载指定的语言，不加载回退语言
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  }
}
