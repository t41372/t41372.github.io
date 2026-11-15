import type { ReactNode } from 'react'
import { Globe } from 'lucide-react'
import type { Text } from '../../data/projects'
import { brandIcons } from './brand-icons'

/*
 * Server-only pieces of a project card. They are passed to ProjectCard as
 * slots, so brand icon paths never ship in island JavaScript.
 *
 * `{slug:Label}` inside text, or a `slug:Label` stack/platform entry, renders
 * the brand glyph for `slug` followed by Label. A label written `EN|中文` is
 * localized.
 */
const TOKEN = /\{([a-z0-9-]+):([^}]+)\}/g

function Icon({ slug, className }: { slug: string; className: string }) {
  if (slug === 'browser') return <Globe aria-hidden className={className} strokeWidth={2} />
  const icon = brandIcons[slug]
  if (!icon) throw new Error(`Unknown brand icon "${slug}"`)
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill={icon.color ?? 'currentColor'}>
      <path d={icon.path} />
    </svg>
  )
}

function rich(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(TOKEN)) {
    const [whole, slug, label] = match
    nodes.push(text.slice(last, match.index))
    nodes.push(
      <span key={match.index} className="whitespace-nowrap">
        <Icon slug={slug} className="mr-[0.3em] inline-block size-[1em] align-[-0.14em]" />
        {label}
      </span>,
    )
    last = match.index + whole.length
  }
  nodes.push(text.slice(last))
  return nodes
}

/** Localized text with inline brand icons. */
export function Rich({ t }: { t: Text }) {
  return (
    <>
      <span data-ui-copy="en" lang="en">{rich(t.en)}</span>
      <span data-ui-copy="zh" lang="zh-Hans">{rich(t.zh)}</span>
    </>
  )
}

function Label({ text }: { text: string }) {
  const [en, zh] = text.split('|')
  if (!zh) return <>{en}</>
  return (
    <>
      <span data-ui-copy="en" lang="en">{en}</span>
      <span data-ui-copy="zh" lang="zh-Hans">{zh}</span>
    </>
  )
}

function Chip({ entry }: { entry: string }) {
  const at = entry.indexOf(':')
  const slug = at > 0 ? entry.slice(0, at) : undefined
  const label = at > 0 ? entry.slice(at + 1) : entry
  return (
    <li className="inline-flex items-center gap-1.5 text-foreground/85">
      {slug && <Icon slug={slug} className="size-3 shrink-0" />}
      <Label text={label} />
    </li>
  )
}

function Row({ en, zh, entries }: { en: string; zh: string; entries: string[] }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-16 shrink-0 text-muted-dark">
        <span data-ui-copy="en" lang="en">{en}</span>
        <span data-ui-copy="zh" lang="zh-Hans">{zh}</span>
      </span>
      <ul className="flex flex-wrap gap-x-3.5 gap-y-1">
        {entries.map((entry) => <Chip key={entry} entry={entry} />)}
      </ul>
    </div>
  )
}

/** What a project is built with and where it runs, as icon chips. */
export function TechRow({ stack, platforms, note }: { stack: string[]; platforms: string[]; note?: Text }) {
  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <Row en="Built with" zh="技术栈" entries={stack} />
      <Row en="Runs on" zh="平台" entries={platforms} />
      {note && (
        <p className="pl-[4.75rem] text-muted-dark">
          <span data-ui-copy="en" lang="en">{note.en}</span>
          <span data-ui-copy="zh" lang="zh-Hans">{note.zh}</span>
        </p>
      )}
    </div>
  )
}
