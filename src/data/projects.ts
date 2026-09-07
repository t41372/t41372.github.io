export interface ProjectMedia {
  type: 'image' | 'video'
  src: string
  alt?: string
}

export interface Project {
  title: string
  description: string
  descriptionZh: string
  repo: string
  /** screenshot / demo clip shown in the card's media slot; omit for placeholder */
  media?: ProjectMedia
}

export const projects: Project[] = [
  {
    title: 'Open-LLM-VTuber',
    description:
      'Talk to any LLM with hands-free voice interaction, voice interruption, and a Live2D talking face — running locally across platforms.',
    descriptionZh: '通过语音与 LLM 自然对话，随时打断，搭配会说话的 Live2D 角色。支持跨平台，在本机运行。',
    repo: 'Open-LLM-VTuber/Open-LLM-VTuber',
  },
  {
    title: 'PathKeep',
    description:
      'Browsers delete your history after 3 months. PathKeep keeps it for you — a local-first desktop app written in Rust that preserves your browser history and shows analytics.',
    descriptionZh: '浏览器会清除三个月前的历史记录，PathKeep 帮你保留下来。这是一款用 Rust 开发、数据优先存储在本机的桌面应用，可保存浏览记录并提供使用分析。',
    repo: 't41372/PathKeep',
  },
  {
    title: 'Standard ASR',
    description:
      'The open standard interface between apps and speech-to-text engines. Integrate once, switch ASR engines without code changes.',
    descriptionZh: '连接应用程序与语音识别引擎的开放标准接口。集成一次，之后切换 ASR 引擎，无需修改代码。',
    repo: 'standard-voice/standard_asr',
  },
]
