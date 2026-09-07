# 動畫審查與改善紀錄

套用技能：improve-animations、emil-design-eng、find-animation-opportunities。  
基準：`6c0259c` 加本次修復工作區；日期：2026-09-07 UTC。  
本次已有明確實作授權的範圍：恢復原本 Hero／煙霧互動、修復玻璃、博客共享卡片，以及捲動後切頁的連續性。未把審查技能延伸成新的 redesign 授權。

## Recon

這是帶有個性的個人網站，不是每天操作上百次的 dashboard。次數以下為情境推估，沒有使用者行為量測。導航／文章開關通常每次瀏覽數次；Preview 偶爾使用；Hero 是首頁的敘事演出；拖曳／煙霧是使用者要求保留的遊玩互動。

- Astro ClientRouter／原生 View Transitions：路由與背景截圖、共享卡片幾何。
- Motion Primitives：單一持續 React island 的選取背景；beUI：Preview modal。
- CSS：glitch、字型變化、cursor、scroll-driven parallax；WebGL／canvas：天空與煙霧。
- 原始 HeroIntro：打字時間線、獨立拖曳層與磁吸；禁止以此審查為由刪除或改版。
- 既有 tokens：`src/lib/ease.ts` 的 EASE_IN_OUT 與 springs；本次 CSS morph 引用相同 `cubic-bezier(0.77, 0, 0.175, 1)`。

已掃描八類：目的／頻率、時長／曲線、空間來源、可中斷性、效能、無障礙、共用 tokens、缺少的回饋。這是小型網站，審查直接核對來源與實際幀，沒有再派重複的研究代理。

## 經核對的 Before After

| # | Severity | Category | Location | Before | After | Why / status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | HIGH | 可讀性／合成 | [global.css](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/styles/global.css:426) | `main`／island 祖先有 View Transition 名稱，computed blur 非零但像素未模糊 | 祖先 `view-transition-name: none`；只命名玻璃自身；`blur(16px) saturate(1.12)` | 已修復。棋盤對照從 σ 約63.5 降到約0；來源根因是 named element 形成 Backdrop Root。 |
| 2 | HIGH | 空間連續性 | [reading-context.ts](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/lib/reading-context.ts:23) | 博客卡片與文章只有分別淡入淡出 | 載入完成後，以 slug 配對 `blog-surface`；title 獨立；list/article copy 分開 | 已修復。中間幀同時有 old/new shared surface，尺寸介於兩端；正文沒有隨表面一起 scale。 |
| 3 | HIGH | 捲動交接 | [reading-context.ts](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/lib/reading-context.ts:57) | 舊背景被隱藏；page-load 才恢復閱讀捲動 | 保留 root additive crossfade；after-swap 先恢復位置與重畫天空再 capture | 已修復。從700px切頁，在 ready 前 scrollY 已到目的位置，old/new root 都存在。 |
| 4 | HIGH | 設計範圍 | [HeroSection.astro](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/components/hero/HeroSection.astro:29) | 未批准的靜態 Hero redesign；原打字／glitch／拖曳和煙霧 pointer 被移除 | 原 HeroSection 和煙霧源碼恢復；HeroIntro 保留可讀SSR／返回免重播 | 已修復。HeroSection／AsciiSmoke 與原提交的 diff 為空；原版內容與拖曳測試通過。 |
| 5 | MEDIUM | Easing | [global.css](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/styles/global.css:444) | 共享表面也用強 ease-out，50ms 已完成約六成高度變化 | 表面與 title 使用既有 EASE_IN_OUT 曲線，280ms | 已調整。現有物件的形變有加速與減速，不把「有中間值」當成觀感合格的唯一證據。 |
| 6 | MEDIUM | Reduced motion | [global.css](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/styles/global.css:463) | `duration:0` 但仍有100ms delay | 同時 `duration:0`、`delay:0` | 已修復。使用者要求减少動作時，不應留下等待空窗。 |
| 7 | MEDIUM | 輸入方式 | [reading-context.ts](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/lib/reading-context.ts:29) | 鍵盤啟動與滑鼠啟動目前共用相同 route motion | 建議未來讓鍵盤導航跳過 snapshot motion，保持 focus／history 行為 | 待選定，不在本次強行擴充。此為技能規則下的審查發現，不表示目前鍵盤導航功能失效。 |

### 不誤報的項目

- beUI modal 的中心 origin 正確；430ms 落在 modal 的200–500ms區間，不能只因大於300ms就報錯。
- 原生 View Transition 的 group 幾何不是逐幀改寫主文件的 width／height，不把它等同自製 layout thrash。
- Hero／煙霧的長時間或循環動畫是已確認的產品特色，不把 dashboard 的頻率規則套上去刪除。
- 沒有實機 trace，就不宣稱 Motion shorthand、clip-path 或 WebGL 已掉幀。效能候選要以正式建置及目標裝置驗證。

## 通過 Gate 的小型機會

這些是額外建議，未改動來源；它們不是本次修復的先決條件。

| # | Location | Today | Purpose | Frequency | Suggested motion | Function / Gate |
| --- | --- | --- | --- | --- | --- | --- |
| A | [ProjectCard.tsx](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/components/projects/ProjectCard.tsx:32) | Preview 只有 hover 色彩，按下無局部回饋 | Feedback | 偶爾；可控制在100–160ms | pointer press：`transform: scale(0.97)`；`transition: transform 160ms cubic-bezier(0.23,1,0.32,1)`；鍵盤不 scale；reduced-motion 保留色彩回饋、取消 transform | 不移動卡片、不延後 modal 開啟；只讓既有控制確認收到點擊。 |
| B | [BaseLayout.astro](/Users/tim/LocalData/coding/LongTermProjects/t41372.github.io/t41372.github.io/src/layouts/BaseLayout.astro:218) | 頁內 EN／中文直接更換多張卡片文字 | Preventing a jarring change | 每次瀏覽少數幾次，推估 | 僅變更文字 opacity，120ms `cubic-bezier(0.23,1,0.32,1)`；鍵盤／reduced-motion 即時；不加位移、blur 或逐卡 stagger | 限制在文字回饋；若在窄螢幕造成閱讀等待則放棄，不為此再建立一套 router。 |

## 明確拒絕的新增動畫

- 所有博客卡片新增 pointer tilt：頻率／功能 Gate 不通過；閱讀列表不需要不斷移動。
- GitHub stars 加持續 rolling counter：功能 Gate 不通過；數字只載入一次，沒有持續變動可解釋。
- 文章段落逐段滑入、強制 stagger：功能 Gate 不通過；妨礙長文閱讀和錨點定位。
- 在現有 Hero 再加一個揭示或新增 CTA 動畫：目的 Gate 不通過；原敘事已足夠，也沒有 redesign 授權。

## Verdict

最有價值的是修復既有視覺因果與取樣，不是增加動作數量。此次已授權的故障修正照常完成；額外機會只保留為候選。若之後選定其中一項，可用 `improve-animations plan <編號>` 產出獨立執行計畫。桌面／手機模擬、像素對照和中間幀提供機械證據；Safari／Metal 的實際手感仍需裝置確認。
