import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import type { Stat, Text } from '../../data/projects'
import Localized, { useUiLanguage } from '../Localized'
import { Card } from '../vendor/card'
import { CenterMorphModal, CenterMorphModalContent, CenterMorphModalTrigger } from '../vendor/center-morph-modal'
import { cn } from '@/lib/utils'
import { formatFloor, formatRank, formatStars, useGithubMetric } from './GithubStars'
import { plainText, type ClipView, type Picture, type ProjectView, type ShotView } from './types'

type Language = 'en' | 'zh'

const L = ({ t }: { t: Text }) => <Localized en={t.en} zh={t.zh} />
const surface =
  'group/card gap-0 rounded-2xl border-white/10 bg-surface/50 py-0 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] glass-surface transition-[background-color,border-color,box-shadow] duration-500 ease-[var(--ease-out)] hover:border-white/22 hover:bg-surface/72 hover:shadow-[0_20px_50px_-20px_rgb(0_0_0/0.65),inset_0_1px_0_0_rgb(255_255_255/0.12)]'
const textLink =
  'group/link inline-flex items-center gap-1 text-sm text-muted transition-colors duration-300 ease-[var(--ease-out)] hover:text-foreground'
const linkArrow =
  'transition-transform duration-300 ease-[var(--ease-out)] group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 motion-reduce:transform-none'
const button =
  'group/btn inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-out)] active:scale-[0.97] motion-reduce:transform-none'

function Img({ picture, alt, altLang, sizes, copy, eager, fetchPriority, className }: {
  picture: Picture
  alt: string
  /** language of `alt`, so screen readers use the right voice */
  altLang: Language
  sizes: string
  copy?: Language
  eager?: boolean
  fetchPriority?: 'high' | 'low'
  className?: string
}) {
  return (
    <img
      src={picture.src}
      srcSet={picture.srcset}
      sizes={sizes}
      width={picture.width}
      height={picture.height}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={fetchPriority}
      decoding="async"
      data-ui-copy={copy}
      lang={altLang === 'zh' ? 'zh-Hans' : 'en'}
      className={className}
    />
  )
}

const sizes = '(min-width: 1152px) 540px, (min-width: 768px) 46vw, 100vw'

/** A screenshot. Localized pairs render both images, lazily, so CSS shows
 * the UI language's copy and the hidden one never downloads. */
function ShotImage({ shot, language, eager, lowPriority }: { shot: ShotView; language: Language; eager?: boolean; lowPriority?: boolean }) {
  const img = cn(
    'block h-full w-full transition-transform duration-700 ease-[var(--ease-out)] group-hover/card:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none',
    shot.frame === 'paper' ? 'object-contain' : 'object-cover object-top',
  )
  const fetchPriority = eager ? 'high' : lowPriority ? 'low' : undefined
  if (!shot.zh) return <Img picture={shot.img} alt={shot.alt[language]} altLang={language} sizes={sizes} eager={eager} fetchPriority={fetchPriority} className={img} />
  // Paired copies stay lazy: an eager hidden twin would still download.
  return (
    <>
      <Img picture={shot.img} alt={shot.alt.en} altLang="en" sizes={sizes} copy="en" fetchPriority={lowPriority ? 'low' : undefined} className={img} />
      <Img picture={shot.zh} alt={shot.alt.zh} altLang="zh" sizes={sizes} copy="zh" fetchPriority={lowPriority ? 'low' : undefined} className={img} />
    </>
  )
}

// At either end the script sets aria-disabled instead of disabling: a
// disabled (or hidden) button would drop keyboard focus to <body>.
const pager =
  'absolute top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background/80 text-foreground opacity-0 transition-[opacity,transform,background-color,border-color,color] duration-300 ease-[var(--ease-out)] hover:border-white/30 hover:bg-background/95 active:scale-92 motion-reduce:transform-none group-hover/gallery:opacity-100 group-hover/gallery:backdrop-blur-sm focus-visible:opacity-100 focus-visible:backdrop-blur-sm aria-disabled:pointer-events-none aria-disabled:cursor-default aria-disabled:text-foreground/25'

/**
 * One screenshot in a frame, or several as a swipeable strip (CSS scroll
 * snap). The buttons and dots are driven by a small delegated script in
 * projects.astro, so cards without other runtime behaviour stay static HTML.
 */
function Gallery({ project, language, priority }: { project: ProjectView; language: Language; priority?: boolean }) {
  const { shots, slug } = project
  const paper = shots.length === 1 && shots[0].frame === 'paper'
  const frame = cn(
    'aspect-[16/10] overflow-hidden rounded-xl border border-white/10',
    // the concept art's own paper color, so the mat reads as one sheet
    paper ? 'bg-[rgb(252_249_244)] p-3' : 'bg-background-deep',
  )
  if (shots.length === 1) {
    return <div className={frame}><ShotImage shot={shots[0]} language={language} eager={priority} /></div>
  }
  const label = `gallery-${slug}`
  return (
    <div data-gallery className="group/gallery relative" role="group" aria-labelledby={label}>
      <span id={label} className="sr-only">
        <Localized en={`${project.title} screenshots`} zh={`${project.title} 截图`} />
      </span>
      <div
        data-gallery-track
        tabIndex={0}
        className={cn(
          frame,
          'flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 [&::-webkit-scrollbar]:hidden',
        )}
      >
        {shots.map((shot, i) => (
          <div key={i} className="h-full w-full shrink-0 snap-start" role="group" aria-label={`${i + 1} / ${shots.length}`}>
            <ShotImage shot={shot} language={language} eager={priority && i === 0} lowPriority={i > 0} />
          </div>
        ))}
      </div>
      <button type="button" data-gallery-prev aria-disabled="true" className={cn(pager, 'left-2')}>
        <ChevronLeft size={16} aria-hidden />
        <span className="sr-only"><Localized en="Previous screenshot" zh="上一张截图" /></span>
      </button>
      <button type="button" data-gallery-next aria-disabled="false" className={cn(pager, 'right-2')}>
        <ChevronRight size={16} aria-hidden />
        <span className="sr-only"><Localized en="Next screenshot" zh="下一张截图" /></span>
      </button>
      <div className="absolute inset-x-0 bottom-0.5 flex justify-center">
        {shots.map((_, i) => (
          // 24 px hit area around a 6 px dot (WCAG 2.5.8 target size)
          <button
            key={i}
            type="button"
            data-gallery-dot
            data-active={i === 0 ? '' : undefined}
            aria-current={i === 0 ? 'true' : 'false'}
            className="group/dot p-[9px]"
          >
            <span className="block h-1.5 w-1.5 rounded-full bg-white/35 shadow-[0_0_2px_rgb(0_0_0/0.6)] transition-[width,background-color] duration-400 ease-[var(--ease-out)] motion-reduce:transition-colors group-hover/dot:bg-white/75 group-data-[active]/dot:w-4 group-data-[active]/dot:bg-white" />
            <span className="sr-only"><Localized en={`Screenshot ${i + 1}`} zh={`第 ${i + 1} 张截图`} /></span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ClipPlayer({ clip, language }: { clip: ClipView; language: Language }) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    const video = ref.current
    if (!video) return
    // React doesn't reflect `muted` as an attribute; autoplay needs the property.
    video.muted = true
    if (!reduce) video.play().catch(() => {})
  }, [reduce])
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-background-deep">
      <video
        ref={ref}
        src={clip.src}
        poster={clip.poster}
        width={clip.width}
        height={clip.height}
        muted
        loop
        playsInline
        controls
        preload="metadata"
        aria-label={clip.alt[language]}
        className="block h-auto w-full"
      />
    </div>
  )
}

const strong = 'font-mono text-sm font-semibold text-foreground'

/** A label sentence with the number set where `{value}` is. */
function sentence(template: string, value: string) {
  const [before, after] = template.split('{value}')
  return <>{before}<span className={strong}>{value}</span>{after}</>
}

function StatItem({ stat, repo }: { stat: Stat; repo: string }) {
  const live = useGithubMetric(repo, stat.live)
  const value =
    live === null ? stat.value
      : stat.live === 'stars' ? formatStars(live)
        : stat.live === 'rank' ? formatRank(live)
          : formatFloor(live)
  // A live stat without a safe floor stays visually and semantically hidden
  // until (unless) it loads, while reserving its line box so arrival after a
  // page transition never shifts the card grid downward.
  if (!value && !stat.live) return null
  const pending = !value
  const display = value ?? '#0,000'
  if (stat.label.en.includes('{value}')) {
    return (
      <div
        aria-hidden={pending || undefined}
        className={cn(
          'transition-opacity duration-700 ease-[var(--ease-out)]',
          pending ? 'invisible pointer-events-none select-none opacity-0' : 'opacity-100',
        )}
      >
        <dt className="sr-only"><Localized en="GitHub rank" zh="GitHub 排名" /></dt>
        <dd className="text-xs text-muted">
          <span data-ui-copy="en" lang="en">{sentence(stat.label.en, display)}</span>
          <span data-ui-copy="zh" lang="zh-Hans">{sentence(stat.label.zh, display)}</span>
        </dd>
      </div>
    )
  }
  return (
    <div
      aria-hidden={pending || undefined}
      className={cn(
        'flex flex-row-reverse items-baseline justify-end gap-1.5 transition-opacity duration-700 ease-[var(--ease-out)]',
        pending ? 'invisible pointer-events-none select-none opacity-0' : 'opacity-100',
      )}
    >
      <dt className="text-xs text-muted"><L t={stat.label} /></dt>
      <dd className={strong}>{display}</dd>
    </div>
  )
}

/** A compact line of facts: live GitHub numbers, or ones that don't change. */
function Stats({ stats, repo }: { stats: Stat[]; repo: string }) {
  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1.5">
      {stats.map((stat) => <StatItem key={stat.label.en} stat={stat} repo={repo} />)}
    </dl>
  )
}

function Heading({ project }: { project: ProjectView }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 font-mono text-xs text-muted-dark">
        <span><L t={project.period} /></span>
        {project.status && (
          <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[11px] leading-none text-muted">
            <L t={project.status} />
          </span>
        )}
      </div>
      <h2 className="mt-2 text-balance font-mono text-lg font-semibold text-foreground">{project.title}</h2>
    </>
  )
}

function Install({ command }: { command: string }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-background/40 px-3 py-1.5 font-mono text-[13px]">
      <span aria-hidden="true" className="select-none text-muted-dark">$</span>
      {/* one click selects the whole command for copying */}
      <code className="select-all truncate text-foreground">{command}</code>
    </div>
  )
}

/** `tagline`, `stack` and `children` (the blurb) are server-rendered slots
 * (see RichText.tsx), so brand icons stay out of the island bundle. */
export default function ProjectCard({ project, priority, tagline, stack, children }: {
  project: ProjectView
  /** the first card: load its first screenshot eagerly (likely the LCP) */
  priority?: boolean
  tagline?: ReactNode
  stack?: ReactNode
  children?: ReactNode
}) {
  const language = useUiLanguage()
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const { shots, demo } = project
  useEffect(() => {
    if (!demo) return
    setReady(true)
    const close = () => setOpen(false)
    document.addEventListener('astro:before-preparation', close)
    return () => document.removeEventListener('astro:before-preparation', close)
  }, [demo])
  const repoUrl = `https://github.com/${project.repo}`
  const actions = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {project.install && <Install command={project.install} />}
      {project.action && (
        <a
          href={project.action.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(button, 'bg-foreground font-medium text-background shadow-[0_2px_12px_rgb(255_255_255/0.12)] hover:bg-foreground/90 hover:shadow-[0_4px_18px_rgb(255_255_255/0.18)]')}
        >
          <L t={project.action.label} />
          <ArrowUpRight size={14} aria-hidden className="transition-transform duration-300 ease-[var(--ease-out)] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 motion-reduce:transform-none" />
        </a>
      )}
      {/* Server-rendered as a plain link to the video (works without JS, no
          pop-in below the fold); hydration upgrades it to the dialog trigger. */}
      {demo &&
        (ready ? (
          <CenterMorphModalTrigger>
            <button type="button" className={cn(button, 'border border-white/15 text-foreground hover:border-white/28 hover:bg-white/[0.06]')}>
              <Play size={12} aria-hidden className="transition-transform duration-300 ease-[var(--ease-out)] group-hover/btn:scale-110 motion-reduce:transform-none" />
              <Localized en="Watch demo" zh="观看演示" />
            </button>
          </CenterMorphModalTrigger>
        ) : (
          <a href={demo.src} target="_blank" rel="noopener" data-astro-prefetch="false" className={cn(button, 'border border-white/15 text-foreground hover:border-white/28 hover:bg-white/[0.06]')}>
            <Play size={12} aria-hidden />
            <Localized en="Watch demo" zh="观看演示" />
          </a>
        ))}
      {project.links?.map((link) => (
        <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={textLink}>
          <L t={link.label} />
          <ArrowUpRight size={14} aria-hidden className={linkArrow} />
        </a>
      ))}
      <a href={repoUrl} target="_blank" rel="noopener noreferrer" className={textLink}>
        GitHub
        <ArrowUpRight size={14} aria-hidden className={linkArrow} />
      </a>
    </div>
  )

  // Projects without a UI get a wide, text-only card instead of a made-up visual.
  const card = shots.length ? (
    <Card className={cn(surface, 'h-full p-4 sm:p-5')}>
      <Gallery project={project} language={language} priority={priority} />
      <div className="flex flex-1 flex-col px-1 pt-5 sm:px-2">
        <Heading project={project} />
        <p className="mt-2 text-pretty text-[15px] leading-snug text-foreground">{tagline}</p>
        {project.stats && <div className="mt-3"><Stats stats={project.stats} repo={project.repo} /></div>}
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">{children}</p>
        <div className="mt-4">{stack}</div>
        <div className="mt-auto pt-5">{actions}</div>
      </div>
    </Card>
  ) : (
    <Card className={cn(surface, 'p-6 sm:p-7')}>
      <Heading project={project} />
      <p className="mt-2 max-w-4xl text-pretty text-[15px] leading-snug text-foreground">{tagline}</p>
      {project.stats && <div className="mt-3"><Stats stats={project.stats} repo={project.repo} /></div>}
      <p className="mt-3 max-w-4xl text-pretty text-sm leading-relaxed text-muted">{children}</p>
      <div className="mt-4">{stack}</div>
      <div className="mt-5">{actions}</div>
    </Card>
  )

  if (!demo) return card

  return (
    <CenterMorphModal open={open} onOpenChange={setOpen}>
      {card}
      <CenterMorphModalContent
        ariaLabel={project.title}
        closeButtonLabel={language === 'zh' ? `关闭 ${project.title}` : `Close ${project.title}`}
        className="max-w-3xl border-white/12 bg-surface/90"
        backdropClassName="bg-background-deep/75"
      >
        <div className="p-5 sm:p-8">
          <h2 className="pr-10 font-mono text-xl font-semibold text-foreground">{project.title}</h2>
          <p className="mt-2 pr-10 text-pretty text-muted">
            <Localized en={plainText(project.tagline.en)} zh={plainText(project.tagline.zh)} />
          </p>
          <div className="mt-5">
            <ClipPlayer clip={demo} language={language} />
          </div>
          {/* The repository link follows the video directly in tab order. */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className={textLink}>
              GitHub
              <ArrowUpRight size={14} aria-hidden className={linkArrow} />
            </a>
            {project.action && (
              <a href={project.action.href} target="_blank" rel="noopener noreferrer" className={textLink}>
                <L t={project.action.label} />
                <ArrowUpRight size={14} aria-hidden className={linkArrow} />
              </a>
            )}
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
