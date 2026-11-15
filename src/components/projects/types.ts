import type { Project, Text } from '../../data/projects'

/** An optimized image, resolved at build time by projects.astro. */
export interface Picture {
  src: string
  srcset: string
  width: number
  height: number
}

export interface ShotView {
  kind: 'image'
  img: Picture
  zh?: Picture
  alt: Text
  frame?: 'paper'
}

export interface ClipView {
  kind: 'video'
  src: string
  poster: string
  width: number
  height: number
  alt: Text
}

/** Serializable island props: images replaced by resolved pictures. */
export type ProjectView = Omit<Project, 'shots' | 'demo'> & {
  shots: ShotView[]
  demo?: ClipView
}

/** Only cards with runtime behaviour (a demo dialog or a live GitHub number)
 * hydrate; the rest are server-rendered React with no client JS. */
export const needsHydration = (project: ProjectView) =>
  !!project.demo || !!project.stats?.some((stat) => stat.live)

/** `{slug:Label}` icon tokens reduced to their labels, for plain-text spots. */
export const plainText = (text: string) => text.replace(/\{[a-z0-9-]+:([^}]+)\}/g, '$1')
