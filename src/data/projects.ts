import type { ImageMetadata } from 'astro'
import olvApp from '../assets/projects/open-llm-vtuber-app.jpg'
import olvSettings from '../assets/projects/open-llm-vtuber-settings.jpg'
import olvPet from '../assets/projects/open-llm-vtuber-pet.jpg'
import olvScreen from '../assets/projects/open-llm-vtuber-screen.jpg'
import olvBrowser from '../assets/projects/open-llm-vtuber-browser.jpg'
import asrConcept from '../assets/projects/standard-asr-concept.jpg'
import longScreen from '../assets/projects/long-screen.jpg'
import longScreenResult from '../assets/projects/long-screen-result.jpg'
import longScreenLanding from '../assets/projects/long-screen-landing.jpg'
import modalfsEn from '../assets/projects/modalfs-en.jpg'
import modalfsZh from '../assets/projects/modalfs-zh.jpg'
import modalfsVolumeEn from '../assets/projects/modalfs-volume-en.jpg'
import modalfsVolumeZh from '../assets/projects/modalfs-volume-zh.jpg'
import modalfsActivityEn from '../assets/projects/modalfs-activity-en.jpg'
import modalfsActivityZh from '../assets/projects/modalfs-activity-zh.jpg'
import modalfsSettingsEn from '../assets/projects/modalfs-settings-en.jpg'
import modalfsSettingsZh from '../assets/projects/modalfs-settings-zh.jpg'
import modalfsDownloadEn from '../assets/projects/modalfs-download-en.jpg'
import modalfsDownloadZh from '../assets/projects/modalfs-download-zh.jpg'
import pathkeepEn from '../assets/projects/pathkeep-en.jpg'
import pathkeepZh from '../assets/projects/pathkeep-zh.jpg'
import pathkeepHistoryEn from '../assets/projects/pathkeep-history-en.jpg'
import pathkeepHistoryZh from '../assets/projects/pathkeep-history-zh.jpg'
import pathkeepInsightsEn from '../assets/projects/pathkeep-insights-en.jpg'
import pathkeepInsightsZh from '../assets/projects/pathkeep-insights-zh.jpg'
import pathkeepPageEn from '../assets/projects/pathkeep-page-en.jpg'
import pathkeepPageZh from '../assets/projects/pathkeep-page-zh.jpg'
import pathkeepBackupEn from '../assets/projects/pathkeep-backup-en.jpg'
import pathkeepBackupZh from '../assets/projects/pathkeep-backup-zh.jpg'
import pathkeepRhythmEn from '../assets/projects/pathkeep-rhythm-en.jpg'
import pathkeepRhythmZh from '../assets/projects/pathkeep-rhythm-zh.jpg'
import pathkeepAskEn from '../assets/projects/pathkeep-ask-en.jpg'
import pathkeepAskZh from '../assets/projects/pathkeep-ask-zh.jpg'
import skitEn from '../assets/projects/skit-en.png'
import skitZh from '../assets/projects/skit-zh.png'
import skitLibraryEn from '../assets/projects/skit-library-en.png'
import skitLibraryZh from '../assets/projects/skit-library-zh.png'
import skitAddEn from '../assets/projects/skit-add-en.png'
import skitAddZh from '../assets/projects/skit-add-zh.png'
import skitSettingsEn from '../assets/projects/skit-settings-en.png'
import skitSettingsZh from '../assets/projects/skit-settings-zh.png'

/*
 * This page pitches each project to people who might use it; it is not a
 * resume. Each card says what the project is in one line (from the GitHub
 * repo description), then a longer blurb in the voice of the GitHub profile
 * README (github.com/t41372/t41372): first person, why it exists, honest.
 * `{slug:Label}` in a tagline, stack or platform entry renders the brand
 * glyph from brand-icons.ts (plain `Label` has no icon).
 * Dates matter: Open-LLM-VTuber was one of the first of its kind (Jun 2024)
 * and is no longer actively updated. An end month means work has paused (the
 * last commit's month); "now" means it is still being updated. Start dates
 * come from resume.typ / LinkedIn, else the repo's creation month.
 * No "what I did", no single project dominating the page. Numbers are either
 * live from GitHub or facts that don't change. Order follows the GitHub pins.
 * Chinese copy is Simplified (zh-Hans).
 */

export interface Text {
  en: string
  zh: string
}

/** A screenshot. `zh` swaps in a localized screenshot under the Chinese UI. */
export interface Shot {
  kind: 'image'
  src: ImageMetadata
  zh?: ImageMetadata
  alt: Text
  /** `paper`: light artwork that needs its own mat instead of a dark crop */
  frame?: 'paper'
}

export interface Clip {
  kind: 'video'
  /** file under public/ */
  src: string
  poster: ImageMetadata
  alt: Text
}

export interface Stat {
  /** static text; for `live` stats, a floor shown until (or if) GitHub answers.
   * Omitted for a live stat that has no safe floor: it shows only once loaded. */
  value?: string
  /** `{value}` sets the number inside the sentence instead of before it */
  label: Text
  /** read from the GitHub API in the browser, so it never needs hand edits */
  live?: 'stars' | 'downloads' | 'rank'
}

export interface Link {
  label: Text
  href: string
}

export interface Project {
  slug: string
  title: string
  /** owner/name on GitHub */
  repo: string
  /** when work started, and ended if it has */
  period: Text
  status?: Text
  /** what it is, in one line (from the repo description); may hold icons */
  tagline: Text
  /** why and how, in the profile README's voice */
  blurb: Text
  /** what it's built with: `slug:Label` or plain `Label` */
  stack: string[]
  /** where it runs: `slug:Label` or plain `Label` */
  platforms: string[]
  /** small print under the chips */
  note?: Text
  stats?: Stat[]
  /** the main way to try it */
  action?: Link
  /** shell command shown as the way to try it */
  install?: string
  links?: Link[]
  /** card images, in README order; several become a swipeable gallery.
   * Projects without a UI get a text-only card. */
  shots?: Shot[]
  /** demo video, opened from the card in a dialog */
  demo?: Clip
}

export const projects: Project[] = [
  {
    slug: 'open-llm-vtuber',
    title: 'Open-LLM-VTuber',
    repo: 'Open-LLM-VTuber/Open-LLM-VTuber',
    period: { en: 'Jun 2024 – May 2026', zh: '2024.06 – 2026.05' },
    stats: [
      { value: '14k+', label: { en: 'GitHub stars', zh: 'GitHub stars' }, live: 'stars' },
      { value: '#5', label: { en: 'on GitHub Trending (Python)', zh: 'GitHub Trending Python 榜最高名次' } },
      { value: '43k+', label: { en: 'release downloads', zh: '次 Release 下载' }, live: 'downloads' },
      // Rank is live (GitHub search: public, non-fork repos with more stars,
      // plus one). The denominator can't be: that search times out for
      // anonymous browsers and returns partial counts. Authenticated, it was
      // 365,732,130 on 2026-11-14; the count only grows, so this floor stays true.
      {
        label: {
          en: '{value} of 360M+ GitHub repos by stars',
          zh: '3.6 亿+ GitHub 仓库中按 star 排 {value}',
        },
        live: 'rank',
      },
    ],
    tagline: {
      en: 'Talk to any LLM with hands-free voice interaction, voice interruption and a Live2D avatar, running locally across platforms.',
      zh: '用语音和任意 LLM 对话：解放双手、随时打断，配上 Live2D 形象，跨平台在本地运行。',
    },
    blurb: {
      en: 'A voice AI companion on your computer. Talk in real time and cut in whenever you like. It can see your camera or screen, answers through a Live2D character whose look, persona and voice you can make your own, and can float on your desktop as a pet, fully offline. I wanted Neuro-sama on my computer, so I built one.',
      zh: '一个住在你电脑里的语音 AI 伴侣。和它实时语音对话，想插话就直接说。它能看到你的摄像头和屏幕，通过一个外观、人设和声线都能自定义的 Live2D 角色回应你，还能变成桌宠待在屏幕上，全程可以离线运行。我想在自己电脑上也有一个 Neuro-sama，所以就做了一个。',
    },
    stack: ['python:Python', 'fastapi:FastAPI', 'react:React', 'electron:Electron', 'Live2D'],
    platforms: ['windows:Windows', 'apple:macOS', 'linux:Linux'],
    action: { label: { en: 'Get started', zh: '快速开始' }, href: 'https://open-llm-vtuber.github.io/docs/quick-start' },
    shots: [
      {
        kind: 'image',
        src: olvApp,
        alt: {
          en: 'The Open-LLM-VTuber desktop app: a Live2D character in a classroom scene, beside the chat history and camera panels',
          zh: 'Open-LLM-VTuber 桌面应用：教室场景中的 Live2D 角色，旁边是聊天记录和摄像头面板',
        },
      },
      {
        kind: 'image',
        src: olvSettings,
        alt: {
          en: 'The settings panel beside a Live2D character: language, Live2D model, background and character preset',
          zh: '设置面板和 Live2D 角色：语言、Live2D 模型、背景和角色预设',
        },
      },
      {
        kind: 'image',
        src: olvPet,
        alt: {
          en: 'Desktop-pet mode: the character floats over a code editor on a transparent background',
          zh: '桌宠模式：角色以透明背景浮在代码编辑器上方',
        },
      },
      {
        kind: 'image',
        src: olvScreen,
        alt: {
          en: 'Screen sharing in the browser: the companion sees the shared screen while you talk',
          zh: '在浏览器里共享屏幕：你说话时，角色能看到你分享的屏幕',
        },
      },
      {
        kind: 'image',
        src: olvBrowser,
        alt: {
          en: 'The web client with a custom background and Live2D model',
          zh: '网页版：自定义背景和 Live2D 模型',
        },
      },
    ],
  },
  {
    slug: 'standard-asr',
    title: 'Standard ASR',
    repo: 'standard-voice/standard_asr',
    period: { en: 'Aug 2025 – now', zh: '2025.08 – 至今' },
    status: { en: 'Work in progress', zh: '开发中' },
    tagline: {
      en: 'The open standard interface between apps and speech-to-text engines. Integrate and switch ASR engines without code changes.',
      zh: '连接应用与语音识别引擎的开放标准接口。集成和切换 ASR 引擎，都不用改代码。',
    },
    blurb: {
      en: 'Most voice apps support only a few speech-to-text engines. Standard ASR lets every engine ship as its own plugin, so any app built on it can use any engine with one pip install and no code changes, and users pick the one that works best for their language and hardware. Anyone can publish a plugin for an existing engine; engine authors implement it once and reach every app. My most ambitious project.',
      zh: '大多数语音应用只支持少数几个语音识别引擎。Standard ASR 让每个引擎都以独立插件发布，基于它的应用只要 pip install 一下就能用上任何引擎，不用改代码，用户也能自己挑最适合自己语言和硬件的引擎。任何人都能为现有引擎发布插件；引擎作者实现一次，就能接入所有应用。这是我最有野心的项目。',
    },
    stack: ['python:Python', 'pydantic:Pydantic', 'fastapi:FastAPI'],
    platforms: ['apple:macOS', 'linux:Linux', 'windows:Windows'],
    note: { en: 'Python 3.10+ library, CLI and server', zh: 'Python 3.10+ 库、CLI 和服务器' },
    action: { label: { en: 'Website', zh: '官网' }, href: 'https://asr.standard-voice.com/' },
    shots: [
      {
        kind: 'image',
        src: asrConcept,
        frame: 'paper',
        alt: {
          en: 'Concept sketch: a cloud ASR SDK, Whisper, sherpa-onnx and any other engine each plug into your app through the same Standard ASR connector',
          zh: '概念草图：云端 ASR SDK、Whisper、sherpa-onnx 以及任何其他引擎，都通过同一个 Standard ASR 接口接入你的应用',
        },
      },
    ],
  },
  {
    slug: 'qwen3-asr-ane',
    title: 'Qwen3-ASR on Apple Neural Engine',
    repo: 'standard-voice/std_qwen3asr_ane',
    period: { en: 'Sep – Oct 2026', zh: '2026.09 – 2026.10' },
    status: { en: 'Experiment', zh: '实验' },
    tagline: {
      en: 'Probably the first inference engine for Qwen3-ASR 1.7B on the {apple:Apple Neural Engine}, and a proof of concept for LLMs writing a full inference engine for a specialized accelerator on their own.',
      zh: '可能是首个在 {apple:Apple Neural Engine} 上运行 Qwen3-ASR 1.7B 的推理引擎，也是一次概念验证：让 LLM 自主为专用加速器写出完整的推理引擎。',
    },
    blurb: {
      en: 'It runs as a Standard ASR plugin on your Mac\'s Neural Engine: slower than MLX on the GPU, but it leaves the GPU free. Coding agents (mostly Codex with GPT 6 Astra) wrote the whole inference engine. With a proper feedback loop, including the Standard ASR compliance suite, we can mass-produce tested, usable ASR plugins for weird accelerators and models. That sounded insane, so I built this proof of concept right away, and it worked.',
      zh: '它作为 Standard ASR 插件跑在你 Mac 的 Neural Engine 上：比 GPU 上的 MLX 慢，但能把 GPU 空出来。整个推理引擎都是 coding agent 写的（主要是 Codex 加 GPT 6 Astra）。只要有一套合适的反馈闭环（包括 Standard ASR 的合规测试套件），我们就能为各种奇怪的加速器和模型批量产出经过测试、真正能用的 ASR 插件。这听起来太疯狂了，所以我马上做了这个概念验证，结果真的成了。',
    },
    stack: ['python:Python', 'Core ML'],
    platforms: ['apple:Apple Silicon, macOS 15+'],
  },
  {
    slug: 'long-screen',
    title: 'Long Screen',
    repo: 't41372/long-screen',
    period: { en: 'Sep 2026 – now', zh: '2026.09 – 至今' },
    tagline: {
      en: 'The ultimate long screenshot tool. It turns a screen recording into one big screenshot, whatever direction, speed or path you scrolled in.',
      zh: '终极长截图工具。把一段录屏变成一张大截图，不管你往哪个方向、以什么速度、沿什么路径滚动。',
    },
    blurb: {
      en: 'As long as it showed up on screen, it\'s in the image, at full resolution, with fixed window bars restored. My iPhone and Mac don\'t have long screenshots, and I didn\'t want to install anything for it, so Long Screen runs right in your browser. Nothing gets uploaded and it keeps working offline, so I don\'t pay for a server and you don\'t pay for data.',
      zh: '只要在屏幕上出现过，就会出现在图里，保持原始分辨率，固定的窗口栏和状态栏也会还原。我的 iPhone 和 Mac 都没有长截图，我又不想为这个专门装软件，所以 Long Screen 直接在你的浏览器里运行。什么都不用上传，离线也能用，我不用付服务器的钱，你也不用花流量。',
    },
    stack: ['rust:Rust', 'webassembly:WebAssembly', 'typescript:TypeScript', 'deno:Deno'],
    platforms: ['browser:Modern browsers|现代浏览器'],
    note: { en: 'Also a CLI, a Rust crate, and Python and npm packages', zh: '另有 CLI、Rust crate，以及 Python 和 npm 包' },
    action: { label: { en: 'Open the app', zh: '打开应用' }, href: 'https://long-screen.yi-ting.com' },
    shots: [
      {
        kind: 'image',
        src: longScreen,
        alt: {
          en: 'Long Screen in the browser after a run: the stitched Wikipedia page beside the recording it came from',
          zh: 'Long Screen 运行完成后的界面：拼接好的维基百科页面，旁边是原始录屏',
        },
      },
      {
        kind: 'image',
        src: longScreenResult,
        alt: {
          en: 'The finished screenshot: the whole Wikipedia article as one full-resolution image',
          zh: '拼好的截图：整篇维基百科文章成了一张原始分辨率的图片',
        },
      },
      {
        kind: 'image',
        src: longScreenLanding,
        alt: {
          en: 'Long Screen\'s start screen: record, drop the recording on the printer, take the whole page',
          zh: 'Long Screen 的起始页：录屏，把录屏拖进打印机，拿到整页截图',
        },
      },
    ],
    demo: {
      kind: 'video',
      src: '/projects/long-screen-demo.mp4',
      poster: longScreen,
      alt: {
        en: 'Demo: a Wikipedia article panned in two dimensions is dropped on the app and turned into one full-size screenshot',
        zh: '演示：一段在两个方向上平移浏览维基百科的录屏，被拖进应用后变成一张完整尺寸的截图',
      },
    },
  },
  {
    slug: 'modalfs',
    title: 'modalfs',
    repo: 't41372/modalfs',
    period: { en: 'Oct – Nov 2026', zh: '2026.10 – 2026.11' },
    tagline: {
      en: 'Mount {modal:Modal} Volumes as folders on your Mac. Files stream on demand, so terabytes open instantly without filling your disk.',
      zh: '将 {modal:Modal} Volume 挂载为 Mac 上的本地文件夹。文件按需流式加载，TB 级数据集也能瞬间打开，不占满本地硬盘。',
    },
    blurb: {
      en: 'Your laptop, your desktop and your Modal Functions and Sandboxes all work off the same Volume. Finder, your editor, ffmpeg and local agents read and write it like any ordinary folder; modalfs downloads only the parts they actually read, and uploads only the blocks you change. It\'s a native menu-bar app with a full CLI, and it needs no kernel extension.',
      zh: '你的笔记本、台式机、Modal Sandbox 和 Modal Function，用的都是同一个 Volume。访达、编辑器、ffmpeg 和本地 Agent 都能像读写普通文件夹一样操作它；modalfs 只下载它们实际读取的部分，保存时也只上传改动的数据块。它是一个原生的菜单栏应用，附带完整的 CLI，也不需要安装内核扩展。',
    },
    stack: ['go:Go', 'typescript:TypeScript'],
    platforms: ['apple:macOS 13+', 'linux:Linux'],
    note: { en: 'Not affiliated with Modal Labs', zh: '与 Modal Labs 无关联' },
    action: { label: { en: 'Download', zh: '下载' }, href: 'https://github.com/t41372/modalfs/releases' },
    shots: [
      {
        kind: 'image',
        src: modalfsEn,
        zh: modalfsZh,
        alt: {
          en: 'A Modal Volume named datasets open in Finder as an ordinary folder of parquet files, in front of the modalfs app listing the volumes it manages',
          zh: '名为 datasets 的 Modal Volume 在访达里是一个普通文件夹，里面是 parquet 文件；后面是 modalfs 应用，列出它管理的 Volume',
        },
      },
      {
        kind: 'image',
        src: modalfsVolumeEn,
        zh: modalfsVolumeZh,
        alt: {
          en: 'A volume\'s page in the dark theme: where it\'s mounted, its size, its upload and read speed now and over the last minute',
          zh: '深色主题的 Volume 页面：挂载位置、大小、当前和最近一分钟的上传和读取速度',
        },
      },
      {
        kind: 'image',
        src: modalfsActivityEn,
        zh: modalfsActivityZh,
        alt: {
          en: 'Activity: uploads, mounts and a recovery, grouped by day',
          zh: '动态页：上传、挂载和一次恢复，按天分组',
        },
      },
      {
        kind: 'image',
        src: modalfsSettingsEn,
        zh: modalfsSettingsZh,
        alt: {
          en: 'Settings in the dark theme: Modal accounts, start at login, mount location, appearance, language and remote downloads',
          zh: '深色主题的设置页：Modal 账号、登录时启动、挂载位置、外观、语言和远程下载',
        },
      },
      {
        kind: 'image',
        src: modalfsDownloadEn,
        zh: modalfsDownloadZh,
        alt: {
          en: 'A remote download: its progress, speed and cost so far, and its speed over the whole run',
          zh: '一个远程下载：进度、速度和目前的花费，以及全程速度图',
        },
      },
    ],
  },
  {
    slug: 'pathkeep',
    title: 'PathKeep',
    repo: 't41372/PathKeep',
    period: { en: 'Apr 2026 – now', zh: '2026.04 – 至今' },
    tagline: {
      en: 'Browsers delete your history after 3 months. PathKeep keeps it for you.',
      zh: '浏览器三个月就会删掉你的历史记录，PathKeep 帮你留下来。',
    },
    blurb: {
      en: 'Your browsing history is the closest thing most of us have to a diary of our time online, and your browser throws it away on a schedule nobody agreed to. PathKeep backs up every browser you use into one archive on your own disk, for as long as you want. Search all of it, see what it says about you, or ask about it in plain words. Nothing goes to a server.',
      zh: '对大多数人来说，浏览历史最接近一本记录网上时光的日记，而浏览器按一个没人同意过的时间表把它丢掉。PathKeep 把你用的每个浏览器的历史备份进你自己硬盘上的一份存档，想留多久就留多久。你可以搜索全部记录，看看它说明了你什么，也可以直接用自然语言问它。数据不上传任何服务器。',
    },
    stack: ['rust:Rust', 'tauri:Tauri', 'react:React', 'turso:Turso', 'Tantivy'],
    platforms: ['apple:macOS', 'windows:Windows'],
    action: { label: { en: 'Download', zh: '下载' }, href: 'https://github.com/t41372/PathKeep/releases' },
    shots: [
      {
        kind: 'image',
        src: pathkeepEn,
        zh: pathkeepZh,
        alt: {
          en: 'PathKeep\'s home screen in the dark theme: visit totals, a 30-day activity chart and a year heatmap',
          zh: 'PathKeep 深色模式首页：访问总数、近 30 天活动曲线和全年热力图',
        },
      },
      {
        kind: 'image',
        src: pathkeepHistoryEn,
        zh: pathkeepHistoryZh,
        alt: {
          en: 'History: today\'s visits grouped by session, with one page open beside them',
          zh: '历史：今天的访问按浏览片段分组，旁边打开了一个页面',
        },
      },
      {
        kind: 'image',
        src: pathkeepInsightsEn,
        zh: pathkeepInsightsZh,
        alt: {
          en: 'Insights over all time: visits, sites, searches, browsing per month, kinds of sites and top sites',
          zh: '全部时间的洞察：页面浏览、网站、搜索次数、每月浏览、网站类别和最常浏览',
        },
      },
      {
        kind: 'image',
        src: pathkeepPageEn,
        zh: pathkeepPageZh,
        alt: {
          en: 'A page you keep reopening: its visits over 12 weeks, why it is listed, and the searches that led to it',
          zh: '反复打开的页面：12 周的访问、为什么列出它、把你带到这里的搜索',
        },
      },
      {
        kind: 'image',
        src: pathkeepBackupEn,
        zh: pathkeepBackupZh,
        alt: {
          en: 'Backup: each browser and profile with its visits, automatic backup and Google Takeout import',
          zh: '备份：每个浏览器和用户资料的访问数、自动备份和 Google Takeout 导入',
        },
      },
      {
        kind: 'image',
        src: pathkeepRhythmEn,
        zh: pathkeepRhythmZh,
        alt: {
          en: 'Insights in the dark theme: when you browse across the week, new sites, and what you search for',
          zh: '深色模式的洞察：一周里什么时候浏览、新网站，以及搜索什么',
        },
      },
      {
        kind: 'image',
        src: pathkeepAskEn,
        zh: pathkeepAskZh,
        alt: {
          en: 'Ask in the dark theme: a question about cameras, answered from a search of the archive, with the page it used',
          zh: '深色模式的助理：问去年看相机的事，它搜索存档后回答，并列出用到的页面',
        },
      },
    ],
  },
  {
    slug: 'skit',
    title: 'skit',
    repo: 't41372/skit',
    period: { en: 'Jul – Nov 2026', zh: '2026.07 – 2026.11' },
    tagline: {
      en: 'A script manager and launcher for your terminal. Put any script, prompt or program in one library.',
      zh: '命令行里的脚本管理器与启动器。把任何脚本、提示词或程序收进同一个库。',
    },
    blurb: {
      en: 'skit reads each script and turns its CLI flags, input() prompts and hard-coded constants into a launch menu, so you change values on screen instead of in the code, and it remembers what you used last time. Your AI agents use the same library, so the scripts they write for you get saved and reused. Put your scripts in skit and stop worrying whether you\'ll still know how to use them next year.',
      zh: 'skit 会读你的脚本，把命令行参数、input()、写死的常量变成一个带说明的启动菜单，输入和变量都在画面上改，不用改脚本，还记得你上次填的值。你的 AI agent 也能用同一个库，它写的脚本存进去，之后也能轻松调用。直接塞进 skit，再也不用担心明年找不到或忘了怎么用你（或 AI）写的脚本。',
    },
    stack: ['rust:Rust', 'ratatui:Ratatui', 'tree-sitter'],
    platforms: ['apple:macOS', 'linux:Linux', 'windows:Windows'],
    install: 'uv tool install skit-cli',
    links: [{ label: { en: 'Docs', zh: '文档' }, href: 'https://t41372.github.io/skit/' }],
    shots: [
      {
        kind: 'image',
        src: skitLibraryEn,
        zh: skitLibraryZh,
        alt: {
          en: 'The library: every action on screen, mouse or keyboard',
          zh: '工具库：每个操作都在屏幕上，鼠标键盘都行',
        },
      },
      {
        kind: 'image',
        src: skitEn,
        zh: skitZh,
        alt: {
          en: 'The launch menu, generated from the script\'s own parameters',
          zh: '启动菜单：根据脚本自己的参数生成',
        },
      },
      {
        kind: 'image',
        src: skitAddEn,
        zh: skitAddZh,
        alt: {
          en: 'Adding a script: parameters detected statically; you choose which ones skit manages',
          zh: '添加脚本：静态检测参数；哪些交给 skit 管理由你决定',
        },
      },
      {
        kind: 'image',
        src: skitSettingsEn,
        zh: skitSettingsZh,
        alt: {
          en: 'Script settings: parameters, secrets, presets, dependencies',
          zh: '脚本设置：参数、机密、组合、依赖',
        },
      },
    ],
  },
]
