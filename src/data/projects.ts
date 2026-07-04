export interface ProjectMedia {
  type: 'image' | 'video'
  src: string
  alt?: string
}

export interface Project {
  title: string
  tag: string
  description: string
  repo: string
  accent: 'green' | 'teal' | 'purple'
  /** screenshot / demo clip shown in the card's media slot; omit for placeholder */
  media?: ProjectMedia
}

export const projects: Project[] = [
  {
    title: 'Open-LLM-VTuber',
    tag: 'AI VTuber',
    description:
      'Talk to any LLM with hands-free voice interaction, voice interruption, and a Live2D talking face — running locally across platforms.',
    repo: 'Open-LLM-VTuber/Open-LLM-VTuber',
    accent: 'green',
  },
  {
    title: 'PathKeep',
    tag: 'Desktop App',
    description:
      'Browsers delete your history after 3 months. PathKeep keeps it for you — a local-first desktop app written in Rust that preserves your browser history and shows analytics.',
    repo: 't41372/PathKeep',
    accent: 'teal',
  },
  {
    title: 'Standard ASR',
    tag: 'Speech',
    description:
      'The open standard interface between apps and speech-to-text engines. Integrate once, switch ASR engines without code changes.',
    repo: 'standard-voice/standard_asr',
    accent: 'purple',
  },
]
