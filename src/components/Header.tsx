import { useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { flushSync } from 'react-dom'
import { EASE_OUT } from '../lib/ease'
import { AnimatedBackground } from './vendor/animated-background'

const links = [
  { href: '/', key: 'home', label: 'Home' },
  { href: '/projects', key: 'projects', label: 'Projects' },
  { href: '/blog', key: 'blog', label: 'Blog' },
]
const keyFor = (path: string) => links.find(l => l.href === '/' ? path === '/' : path === l.href || path.startsWith(l.href + '/'))?.key ?? 'none'

export default function Header({ active = 'home' }: { active?: string }) {
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
        <nav aria-label="Main navigation" data-nav style={{ viewTransitionName: 'site-nav' }} className="flex items-center gap-1 rounded-full border border-white/10 bg-background/40 p-1.5 shadow-lg shadow-black/10 glass-surface">
          <AnimatedBackground value={selected} defaultValue={active} className="rounded-full bg-white/10" transition={{ type: 'tween', duration: 0.28, ease: EASE_OUT }}>
            {links.map(link => (
              <a key={link.key} data-id={link.key} data-nav-key={link.key} href={link.href}
                aria-current={selected === link.key ? 'page' : undefined}
                className={`rounded-full px-4 py-2 font-mono text-sm transition-colors ${selected === link.key ? 'text-foreground' : 'text-muted hover:text-foreground'}`}>
                {link.label}
              </a>
            ))}
          </AnimatedBackground>
        </nav>
      </MotionConfig>
    </header>
  )
}
