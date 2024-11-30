import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zh from './locales/zh.json'

const initI18next = async () => {
  const i18nInstance = createInstance()
  await i18nInstance
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        zh: { translation: zh },
      },
      fallbackLng: 'en',
      supportedLngs: ['en', 'zh'],
      interpolation: {
        escapeValue: false,
      },
    })
  return i18nInstance
}

export async function getTranslation(lang: string) {
  const i18nextInstance = await initI18next()
  return {
    t: i18nextInstance.getFixedT(lang, 'translation'),
    i18n: i18nextInstance,
  }
}

export default initI18next
