import { useEffect, useState } from 'react'
import { ArrowUpRight, Maximize2 } from 'lucide-react'
import type { Project } from '../../data/projects'
import GithubStars from './GithubStars'
import { Card, CardContent, CardFooter, CardHeader } from '../vendor/card'
import { CenterMorphModal, CenterMorphModalContent, CenterMorphModalTrigger } from '../vendor/center-morph-modal'

export default function ProjectCard({ title, description, repo, media, index }: Project & { index: number }) {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
    const close = () => setOpen(false)
    document.addEventListener('astro:before-preparation', close)
    return () => document.removeEventListener('astro:before-preparation', close)
  }, [])
  return (
    <CenterMorphModal open={open} onOpenChange={setOpen}>
      <Card className="h-full gap-8 rounded-3xl border-white/10 bg-surface/60 py-8 shadow-none glass-surface transition-colors hover:border-white/20">
        <CardHeader className="flex items-center justify-between px-8">
          <span className="font-mono text-sm text-muted">0{index + 1}</span>
          <GithubStars repo={repo} />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-5 px-8">
          <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-pretty text-base leading-relaxed text-muted">{description}</p>
        </CardContent>
        <CardFooter className="justify-between gap-4 px-8">
          <a href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-aurora">
            View repository <ArrowUpRight size={16} aria-hidden />
          </a>
          {ready && <CenterMorphModalTrigger><button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground" aria-label={`Preview ${title}`}><Maximize2 size={14} aria-hidden />Preview</button></CenterMorphModalTrigger>}
        </CardFooter>
      </Card>
      <CenterMorphModalContent ariaLabel={title} closeButtonLabel={`Close ${title}`} className="max-w-2xl border-white/15 bg-surface p-8 sm:p-12" backdropClassName="bg-background/60">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">Selected project · 0{index + 1}</p>
        <h2 className="mb-5 pr-4 font-mono text-2xl font-semibold sm:text-3xl">{title}</h2>
        {media && (media.type === 'image' ? <img src={media.src} alt={media.alt ?? title} className="mb-6 w-full rounded-xl" /> : <video src={media.src} controls playsInline className="mb-6 w-full rounded-xl" />)}
        <p className="mb-8 text-lg leading-relaxed text-muted">{description}</p>
        <a href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 break-all text-sm text-foreground underline decoration-white/20 underline-offset-4">{repo}<ArrowUpRight size={16} className="shrink-0" aria-hidden /></a>
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
