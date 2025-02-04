export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const languageMap: Record<string, Language> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English'
  },
  zh: {
    code: 'zh',
    name: '中文',
    nativeName: '中文'
  }
  // 在这里添加更多语言...
}
