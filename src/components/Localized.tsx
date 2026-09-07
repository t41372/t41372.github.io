import { useEffect, useState } from 'react'

/** Both translations are server-rendered. The head bootstrap chooses which
 * one CSS shows before paint, without changing React's hydration text. */
export default function Localized({ en, zh }: { en: string; zh: string }) {
  return <><span data-ui-copy="en" lang="en">{en}</span><span data-ui-copy="zh" lang="zh-Hans">{zh}</span></>
}

export function useUiLanguage() {
  const [language, setLanguage] = useState<'en' | 'zh'>('en')
  useEffect(() => {
    const sync = () => setLanguage(document.documentElement.dataset.uiLang === 'zh' ? 'zh' : 'en')
    sync()
    document.addEventListener('site:language', sync)
    document.addEventListener('astro:after-swap', sync)
    return () => {
      document.removeEventListener('site:language', sync)
      document.removeEventListener('astro:after-swap', sync)
    }
  }, [])
  return language
}
