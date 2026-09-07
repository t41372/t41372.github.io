# yi-ting.com 現成組件與轉場替換研究

研究日期：2026-09-06（America/Phoenix；UTC 2026-09-07）  
對象：網站作者與後續實作者  
程式基準：`feat/continuous-navigation`，`8e97928`  
研究方式：三個 GPT‑5.6 Terra、max 子代理分工查證，主代理交叉核對官方文件、來源碼與公開 demo。

## 決策建議

**可以，而且應該大量採用現成組件。但下一步應是替換自製動畫的責任，而不是在現有動畫上再疊一批特效。** 本次建議停止延伸 `navigation.ts` 的玻璃代理系統，改用現成換頁機制；把導航高亮、短文字揭示與專案預覽交給有來源的組件。採用之後主要修改內容、色彩、字體與公開 props，避免重新實作 spring、幾何測量、出入場時序。

我會先做一個可比較的原型，使用同一份本站內容與背景：

1. **免費基準原型**：Astro 內建 ClientRouter 短轉場，加上 Motion Primitives 高亮、beUI 局部組件。移除目前玻璃 proxy/morph；文章維持真正的獨立頁面。
2. **付費對照**：保留 Swup 作導航，讓 Motion+ `curtains()` 接管遮蓋與揭示。它是真正的預製換頁效果，但會短暫遮住背景，必須先看實際觀感。
3. **專案展示**：用 beUI `ProjectFolder` 或 Motion UI `ExpandCard` 做少量精選作品的展開預覽，讓現成組件完成整套開關動作。博客全文不先改成 modal。

轉場子代理偏好 Curtains，因為它能保持 Swup 與實際 DOM；主代理仍建議保留原生短 fade 作對照，因為遮幕可能造成另一種等待感。這是根據 API、來源碼與整合邊界作出的工程建議，**不是已證實能讓本站變好看的結果**。上一版測試全過而使用者仍否決，說明「看起來是否好」必須獨立驗收。這輪沒有再修改網站實作，也沒有購買或安裝任何組件。

## 值得先看的實際候選

| 候選 | 本站用途 | 可取代的自製工作 | 仍需做的整合 |
| --- | --- | --- | --- |
| [beUI ProjectFolder](https://beui.dev/components/blocks/project-folder) | 精選專案或多張截圖的作品預覽 | hover/focus 展開、overlay、關閉回程、焦點處理 | 以專案資料建立單一 React island；重新配色，保留可直接開啟的外部連結 |
| [Motion Primitives Animated Background](https://motion-primitives.com/docs/animated-background) | Home / Projects / Blog 導航的選取背景 | 手動量座標與 GSAP pill tween | 用真正的 `<a>`；薄薄一層路由狀態接線，處理 Back、失敗與新分頁點擊 |
| [beUI Tabs](https://beui.dev/components/motion/tabs) | 頁內作品分類、頁內 EN／中文內容切換 | indicator spring、tab 選取與局部互動 | 適用同頁 panel；不能原樣把三個網址當成 button tabs |
| [beUI Text Animation](https://beui.dev/components/motion/text-animation) | 短自介的單次 TextScramble 揭示 | 手寫逐字 timer、刪字、重播編排 | 保留可讀靜態文字；原型確認是否比直接顯示更好 |
| [Motion UI ExpandCard](https://motion.dev/ui/components/expand-card) | 作品卡片 → 詳情 dialog | shared surface、共享標題、內容延後進場、關閉流程 | Motion+；仍需 React provider，非文章路由器 |
| [Motion+ Curtains](https://motion.dev/docs/curtains) | 真正頁面更換的候選 | cover → update → reveal 的動畫程式 | Motion+；Swup adapter、重複點擊與錯誤恢復要做小型驗證 |

**免費組件優先選 beUI 與 Motion Primitives；付費優先研究 Motion 官方的 Motion UI／Motion+。** 不建議同時導入多家功能重疊的 Tabs、Dialog 和文字動畫。先選定一家的具體組件，再沿用它的動作語言。

beUI 是 React、Motion、Tailwind 的 MIT copy-in registry。ProjectFolder 的公開來源包含 `useReducedMotion`、hover 能力判斷、portal 與焦點回復；Tabs 則有 pill、segment、underline 變體。它们的可用性有來源碼支持，本站適配與最終觀感尚未驗證。[beUI repo](https://github.com/starc007/ui-components)、[ProjectFolder source/demo](https://beui.dev/components/blocks/project-folder)、[Tabs source/demo](https://beui.dev/components/motion/tabs)。

Motion Primitives 的高亮使用 Motion `layoutId`，因此可讓成熟動畫引擎負責位置接手。它仍是需要保留在同一 React island 裡的來源碼組件；公開 source 會重寫 child 的互動 handler，接入導航前要確認 modifier click、現有 handler 與 route state，而不是直接貼上。[Animated Background source](https://github.com/ibelick/motion-primitives/blob/main/components/core/animated-background.tsx)。

## 你提供的資源逐一判定

| 資源 | 查證結果 | 本次採用順位 |
| --- | --- | --- |
| [beautifului.dev](https://www.beautifului.dev/) | AI 產品的思考狀態、審批、串流與工作資料組件；MIT，依賴共同 tokens／CSS。SidebarNav 使用另需授權的 Central Icons。 | 不作網站主導航或換頁的首選；未來做 AI 產品介面時很相關。 |
| [beui.dev](https://beui.dev/) | 真正可複製／registry 安裝的 React 動畫組件；可看源碼及 demo。 | **指定清單中最值得優先採用。** ProjectFolder、Tabs、TextScramble。 |
| [rareui.com](https://www.rareui.com/) | 單檔 copy-in 組件。GooeyNav 的原始碼依賴 Next Link／usePathname。 | 第二順位。若確實喜歡其 gooey 視覺，可移植成 Astro anchor；不要為一個 nav 引入 Next。 |
| [transitions.dev](https://transitions.dev/) | 動作配方與 agent skill，包含 Tabs sliding、Text states swap、Page side-by-side。 | 選型／比對動作的參考；不是可直接接管本站的 router。 |
| [transitions.dev/refine](https://transitions.dev/refine) | 開發時調校面板，能改 timing／easing／配方並写回來源。官方標示 dev-only。 | 在選定組件後選用；不能解決 DOM 被誰替換的問題。 |
| [ui.shadcn.com](https://ui.shadcn.com/docs/installation/astro) | 有官方 Astro 安裝方式；提供結構與互動基礎。 | **結構底座。** Card、Button 等可用，不把 shadcn 本身當動畫解藥。 |
| [rolling.kitlangton.dev](https://rolling.kitlangton.dev/) | 對應實際套件 `@kitlangton/rolling-number`，有 RollingNumber／RollingText，React 18／19 支援。 | 有需要變動的數字或短標籤時用；不能替換路由或整段打字故事。 |
| [Amicro mono-charts](https://amicro.vercel.app/mono-charts) | 本次 live URL 顯示一般 Amicro 首頁／按鈕；公開 registry 沒找到 mono/chart 項目。 | 無法驗證指定圖表，不導入；圖表也不是當前問題。 |
| [libraries.dev](https://libraries.dev/how-to-use) | border-beam、thinking-orbs、liquid-gooey、metal-fx、img-fx 等視覺效果。 | 沒有本次必要替換點。先不要再增加動態邊框或 orb。 |
| [kinetics.colorion.co](https://kinetics.colorion.co/) | CSS／React／prompt 配方集；一些標示 spring 的例子實際是固定 cubic-bezier。 | 作靈感與比較，不選作主要維護層。 |

Beautiful UI 的 MIT 授權、共用 foundation 與付費 icon 例外都能在官方資料核對；免費組件不表示所有 demo 依賴也免費。[Beautiful UI README](https://github.com/slev12397/beautiful-ui)、[License](https://www.beautifului.dev/license)。Rare UI 的單檔分發及 GooeyNav 的框架耦合見[組件目錄](https://www.rareui.com/components)與[GooeyNav](https://www.rareui.com/components/gooeynav)。

Kinetics 的 Tab Pill Glide 仍要自行讀取 `offsetLeft`／`offsetWidth`，再以 `left`／`width` transition 移動；這只是換一個手寫範例，沒有轉交路由或生命週期責任。公開 Accordion 範例也有固定 max-height，不能照抄到長文章。其網站標示 MIT，但本次未找到 repository 的獨立 LICENSE 檔，採用前需確認。[Kinetics 原始範例](https://kinetics.colorion.co/)、[repo](https://github.com/ckissi/kinetics)。

Amicro 的查證依據是[公開 repo](https://github.com/Subhan-code/Amicro--Micro-transitions-)與[registry](https://raw.githubusercontent.com/Subhan-code/Amicro--Micro-transitions-/main/registry/registry.json)。Libraries.dev 的功能範圍見[官方用法](https://libraries.dev/how-to-use)與[repo](https://github.com/Jakubantalik/Libraries.dev)。原始 [X 貼文](https://x.com/MSchwaibold/status/2096306405649318139)本次無法取得內容，因此只把你列出的網址作為研究入口，不推測作者的其他推薦理由。

## 真正決定替換成本的是跨頁邊界

### 現成 Tabs 不等於網站導航

Home、Projects、Blog 是可分享、可開新分頁的 route links。beUI Tabs／Motion UI SmoothTabs 的主要介面是 button、選取值和 tabpanel。把它們直接拿來取代網址導航，會使 history、直接進站、修飾鍵點擊等責任重新回到我們手上。

因此主導航可以採用現成的高亮動作，但保留 anchor 語意與目前路由狀態；真正的 Tabs 則放在同一頁的分類／局部內容。Motion UI SmoothTabs 的 controlled value、roving tabindex 與 panel API 也明確呈現這個範圍。[SmoothTabs API](https://motion.dev/ui/components/smooth-tabs)、[beUI Tabs](https://beui.dev/components/motion/tabs)。

### Motion 需要它掌握的 React 組件生命週期

`AnimatePresence` 偵測 React tree 直接子節點的移除。官方明確指出：若 AnimatePresence 本身也卸載，就不能控制 exit。本站目前由 Swup 換掉整個 main；分別在新舊 Astro island 裡加同名 `layoutId`，不足以建立可靠的跨頁共享動畫。

這是根據官方機制與本站配置作出的整合推論，並非「Astro 不能用 Motion」。**局部 React island 很適合現成組件；跨 route 動畫則必須交給 router／瀏覽器，或讓共同 React shell 持續存在。** [AnimatePresence 官方文件](https://motion.dev/docs/react-animate-presence)、[Astro shadcn guide](https://ui.shadcn.com/docs/installation/astro)。

### Dialog 展開不能直接冒充文章導航

Motion UI ExpandCard 的 API 是一個 ExpandCards provider、triggers 與一個 detail dialog。主代理在官方 live demo 打開卡片，確認它展開為詳情，Escape 後焦點回到 trigger；這是有限功能觀察，沒有驗證長文章、SSR route 或 iPhone。

如果把博客全文放進這類元件，還得處理直接造訪 `/blog/slug`、回上一頁、分享網址、雙語路徑、長文捲動、懶載入圖片和搜尋引擎內容。這是另一個閱讀應用的設計，不是替換一張卡片。因此先將預製展開用在專案 preview；博客保留完整靜態文章。[ExpandCard API](https://motion.dev/ui/components/expand-card)、[live demo](https://examples.motion.dev/ui/components/expand-card)。

## 三條轉場路線

| 路線 | 可以刪掉什麼 | 實際代價 | 建議 |
| --- | --- | --- | --- |
| Astro ClientRouter 內建短 fade，持續元素明確標記 | Swup integration、自製玻璃 proxy、WAAPI 出入場分組、部分事件補橋 | snapshot 的材質觀感要重新用本站驗證；腳本／island 重初始化仍需檢查 | **免費比較基準**；不用再製造卡片展開到全文的幾何戲法 |
| Swup + Motion+ vanilla `curtains()` | 玻璃代理、測量與幾何接手、逐元素時序 | 付費；薄 Swup adapter；遮幕會暫時擋住夜空；取消／錯誤時的 overlay 清除未實測 | **付費預製換頁首選候選**，先體驗再決定是否符合本站性格 |
| 持續 React shell + Motion／ExpandCard | 大量 DOM proxy glue，讓元件掌握局部切換 | route、SSG、內容管線與共享 state 的整合面積較大 | 只有確定要 app-like 閱讀體驗才選，不為修一個動畫先整站換框架 |

Astro 官方提供 `fade`／`slide`／`none`、前後導航、`transition:persist`、fallback 及 reduced-motion 支援。這使其值得重新做短轉場對照，但無法由文件保證本站 live sky 與玻璃在 snapshot 中的觀感；之前對原生轉場的不滿是需重測的案例，不是永遠禁止評估的理由。[Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/)。

`curtains()` 與 snapshot 方案不同：只讓不透明遮幕動，於隱藏期間呼叫 async update，再揭示新內容；有 vanilla API，不需要把 Astro main 變成 React。它可與 Swup 整合是根據這個 async callback 契約的推論，並不是官方提供了 Swup adapter。公開文件沒有足夠資訊讓我們承諾快速連點時可取消接手，因此原型必測，不能直接取代目前全部功能。[Curtains API](https://motion.dev/docs/curtains)。

**不建議本輪採用 AnimateView／MaskWipe。** 本次官方文件仍把 AnimateView 標為 Alpha／Motion+ Early Access，要求 React canary；它用原生 View Transition snapshot，並不讓 live glass 自動解套。[AnimateView](https://motion.dev/docs/react-animate-view)、[Motion UI page transitions](https://motion.dev/ui/page-transitions)。不要因為名字更新或 demo 更漂亮就引入新一輪不穩定因素。

Transitions.dev 的工具程式與動作片段授權不能混為一談：工具標示 MIT，片段受網站另列條款約束；不要把整個 catalog 當成 MIT 套件再分發。Refine 只在開發時使用，且有些 Motion JS spring／layout 動畫不會被自動偵測。[Terms & License](https://transitions.dev/terms.html)、[Refine](https://transitions.dev/refine)。

## 本站具體替換範圍

| 現有程式 | 建議處置 | 替換方向 |
| --- | --- | --- |
| [navigation.ts](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/lib/navigation.ts)，244 行 | **整套替換，不再調參修補** | 原型 A 或 B；保留網址、回退與焦點功能的驗收，不保留 proxy 作為需求 |
| [Header.astro](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/components/Header.astro)，135 行 | **移除 GSAP 位移實作** | semantic anchors + 現成 Animated Background；若效果仍不合適，清楚的靜態 active state 作對照 |
| [HeroIntro.tsx](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/components/hero/HeroIntro.tsx)，506 行 | **拆掉長打字故事與拖曳磁吸** | 名字與主自介靜態可讀；僅保留一個預製短揭示或短標籤切換 |
| [ProjectCard.astro](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/components/projects/ProjectCard.astro) | **挑一個具展示價值的作品重做** | beUI ProjectFolder／Motion UI ExpandCard；其他卡片保持安靜 |
| blog list 與 article 模板 | **移除跨頁玻璃 morph 契約** | Card／閱讀排版與短 route transition；保留雙語 URL／SEO |
| [global.css](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/styles/global.css) | **刪除上述功能專屬樣式，重新映射 tokens** | 避免整份外部 CSS 覆蓋天空背景、字體與全域樣式 |
| `StarSky.tsx`／`ValleyScene.astro` | **先保留** | 這是品牌场景，與被否決的換頁機制獨立；沒有查到能等價替换 iOS 行為的現成元件 |
| `AsciiSmoke.tsx` | **次階段簡化** | 先拿掉 pointer 干擾效果作對照，不用另一個炫技效果代替 |

行數來自本次本機檔案，包含註解／排版，**不當成可刪程式碼量或效能收益**。Header 是目前唯一引入 GSAP 的元件，所以移除這部分後可評估移除依賴。Hero 的 `data-aurora-avoid` 與 HeroSection 的 `svh/lvh` 排版保障要保留；刪動畫不代表刪掉這些功能。

## 套件與來源碼怎麼選

**copy-in 是可接受的。** beUI／shadcn／Motion Primitives 把成熟動作原始碼帶進專案，仍能大幅減少從零設計的工作；只是不能期望 npm upgrade 自動更新已複製的檔案。做法應是保留來源、授權及版本／commit 記錄，盡量不改元件內部機制，把本站內容與配色留在 wrapper。

Motion Primitives 官方 repository 標 MIT，並仍有 beta 標記；不要把 beta 或高星數當成本站已驗證的保證。[Motion Primitives repo](https://github.com/ibelick/motion-primitives)。Animate UI 同樣明確定位為 copy-first 的 React／Motion 組件分發，適合選一兩個成熟互動，不是整站 router。[Animate UI introduction](https://animate-ui.com/docs)、[Tabs](https://animate-ui.com/docs/components/radix/tabs)。

Motion UI 需要 Motion+ token；官方安裝文件說明有些元件依賴私有套件，registry 更新可能覆蓋組件來源，建議把客製放在 wrapper。它統一動畫 tokens 的方式值得優先看，但本次只有公開 API／demo，未登入讀取付費來源，也沒有確認結帳價格。[Motion UI install](https://motion.dev/ui/install)。

若真的保留打字，Motion+ `Typewriter` 提供現成人性化速度、動態字串與 backspace API，是比重新編寫 timeline 更直接的付費候選；免費則先看短 TextScramble。兩者都不需要忠實複製現有漫長演出。[Typewriter](https://motion.dev/docs/react-typewriter)。

Rolling 的官方 manifest 當下為 0.4.0、MIT、React 18／19 optional peer；這是 **main 的版本資訊，沒有另行確認 npm 最新發布**。官方說明有可讀 SSR、初次不滾動與 reduced-motion 收斂。它適用短動態值，不必為了使用它而讓只抓一次的 GitHub star count 不斷動。[Rolling repo](https://github.com/kitlangton/rolling-number)、[manifest](https://raw.githubusercontent.com/kitlangton/rolling-number/main/package.json)。

## 原型驗收與停止條件

下一輪的產出應是**少量真實網站流程的可操作對照**，不是又一份「全部測試通過所以很好看」的結論。

1. 使用相同夜空、相同字型、相同一篇中英文長文。比較原生短轉場與預製方案；不要用空白白底 demo 推論本站效果。
2. 先保留上游預設動作，只改必要尺寸／色彩；拿掉現有 proxy、重複全頁出入場和長打字，避免新舊系統疊加。
3. 實際操作主導航連點、文章開啟與返回、語言切換、捲動中返回、窄螢幕與橫豎切換。注意反應、可讀性、結束時是否安定，並讓作者直接選更好的版本。
4. 工程檢查仍要有：無 JS 文章可讀、可開新分頁、Back／Forward、失敗恢復、焦點、reduced motion、island 清理、WebGL 不意外重建與 iOS 捲動。
5. 像素／效能工具只提供證據。MotionScore 的 render-cost 等級、套件 README 的 benchmark、headless 截圖都不能取代本站實機與作者的觀感驗收。
6. 若一個預製組件需要我們大量重寫其計時、測量或可中斷邏輯才能工作，就停止移植、換候選；不要把 vendor 名稱套在另一套自製引擎上。

## 證據與研究限制

已查指定資源的官方站點／來源碼，並額外核對 Motion、Astro、Animate UI 與 Motion Primitives。子代理操作了 beUI／Beautiful UI demo；主代理操作 Motion Primitives 高亮與 Transition Panel、Motion UI ExpandCard。這些觀察證明有限的功能與呈現狀態，**沒有本站整合原型、逐幀流暢度或 iPhone／Metal 驗證**。

本次不以網站顯示的 components 數量、stars、MotionScore 或自述「production-ready」作排名依據。維護觀察只證明當下有公開來源／更新痕跡，不能保證未來維護。動態頁面可見資料與 GitHub main 可能不同步，實作時應記錄實際取得版本。

研究在所有高影響選項已有官方契約／來源或明確缺口後停止；沒有再無限擴充組件目錄。剩下會改變決策的證據是**原型觀感與整合成本**，不是再多找十家特效網站。
