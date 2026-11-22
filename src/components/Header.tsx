import { useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { flushSync } from 'react-dom'
import { EASE_OUT } from '../lib/ease'
import { AnimatedBackground } from './vendor/animated-background'
import Localized, { useUiLanguage } from './Localized'

const links = [
  { href: '/', key: 'home', label: 'Home', zh: '首页' },
  { href: '/projects', key: 'projects', label: 'Projects', zh: '项目' },
  // Blog is unlisted from the nav for now; /blog still builds and works by URL.
  // To bring the tab back, restore:
  // { href: '/blog', key: 'blog', label: 'Blog', zh: '文章' },
]
const keyFor = (path: string) => links.find(l => l.href === '/' ? path === '/' : path === l.href || path.startsWith(l.href + '/'))?.key ?? 'none'

export default function Header({ active = 'home' }: { active?: string }) {
  const language = useUiLanguage()
  const [selected, setSelected] = useState(active)
  useEffect(() => {
    setSelected(active)
  }, [active])
  useEffect(() => {
    // Commit before the new native snapshot. page-load may run after capture,
    // leaving the pill on the previous tab throughout the page transition.
    const sync = () => flushSync(() => setSelected(keyFor(location.pathname)))
    document.addEventListener('astro:after-swap', sync)
    return () => document.removeEventListener('astro:after-swap', sync)
  }, [])
  return (
    <header className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)_+_1rem)] z-50 flex justify-center px-4">
      <MotionConfig reducedMotion="user">
        <nav aria-label={language === 'zh' ? '主要导航' : 'Main navigation'} data-nav style={{ viewTransitionName: 'site-nav' }} className="flex items-center gap-1 rounded-full border border-white/12 bg-background/45 p-1.5 shadow-[var(--nav-shadow),inset_0_1px_0_0_rgb(255_255_255/0.09)] glass-surface">
          <AnimatedBackground value={selected} defaultValue={active} className="rounded-full bg-white/[0.11] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.16),0_2px_8px_rgb(0_0_0/0.2)]" transition={{ type: 'tween', duration: 0.48, ease: EASE_OUT }}>
            {links.map(link => (
              <a key={link.key} data-id={link.key} data-nav-key={link.key} href={link.href}
                aria-current={selected === link.key ? 'page' : undefined}
                className={`rounded-full px-4 py-2 font-mono text-sm transition-[color,transform] duration-300 ease-[var(--ease-out)] active:scale-[0.96] motion-reduce:transform-none ${selected === link.key ? 'text-foreground' : 'text-muted hover:text-foreground'}`}>
                <Localized en={link.label} zh={link.zh} />
              </a>
            ))}
          </AnimatedBackground>
          <span aria-hidden className="mx-0.5 h-4 w-px bg-white/10" />
          <button type="button" data-ui-language-toggle aria-label={language === 'zh' ? 'Switch to English' : '切换为中文'} className="rounded-full px-3 py-2 font-mono text-xs text-muted transition-[color,background-color,transform] duration-300 ease-[var(--ease-out)] hover:bg-white/[0.07] hover:text-foreground active:scale-[0.95] motion-reduce:transform-none">
            <Localized en="中文" zh="EN" />
          </button>
        </nav>
      </MotionConfig>
    </header>
  )
}
