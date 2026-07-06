export interface ProjectMedia {
  type: 'image' | 'video'
  src: string
  alt?: string
}

export interface Project {
  title: string
  description: string
  repo: string
  /** screenshot / demo clip shown in the card's media slot; omit for placeholder */
  media?: ProjectMedia
}

export const projects: Project[] = [
  {
    title: 'Open-LLM-VTuber',
    description:
      'Talk to any LLM with hands-free voice interaction, voice interruption, and a Live2D talking face — running locally across platforms.',
    repo: 'Open-LLM-VTuber/Open-LLM-VTuber',
  },
  {
    title: 'PathKeep',
    description:
      'Browsers delete your history after 3 months. PathKeep keeps it for you — a local-first desktop app written in Rust that preserves your browser history and shows analytics.',
    repo: 't41372/PathKeep',
  },
  {
    title: 'Standard ASR',
    description:
      'The open standard interface between apps and speech-to-text engines. Integrate once, switch ASR engines without code changes.',
    repo: 'standard-voice/standard_asr',
  },
]
