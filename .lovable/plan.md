# 全台流浪動物物資智能媒合平台

建立一個溫暖、現代、傳統公益感的單頁 React 應用程式，全部內容放在首頁路由。

## 視覺設計方向

- 色系：白底為主，主色調溫暖橘黃 (約 oklch 0.75 0.15 65)，輔以大地色（暖棕、米色）作為強調。
- 字體：標題使用具人文感的襯線（如 Fraunces 或 Noto Serif TC），內文用 Noto Sans TC，透過 `<link>` 在 `__root.tsx` 載入。
- 風格：圓角適中、柔和陰影、留白寬鬆，避免 AI 常見紫色漸層。Hero 加入細緻光暈或柔和漸層點綴。
- 所有顏色透過 `src/styles.css` 的 design tokens 定義，元件只用語意化 class。

## 頁面結構（單一檔案 `src/routes/index.tsx` + 區塊元件）

1. **Hero 區塊** — 大標「用科技點亮微光」、副標「全台毛孩物資 AI 智能媒合與認養平台」，配溫暖背景與一張可愛毛孩示意插圖（用 imagegen 產生）。
2. **互動媒合區** — `Textarea`（物資描述，placeholder：「請描述您想捐贈的物資，例如無穀貓飼料或舊毛巾」）、`Select`（台灣 22 縣市）、主按鈕「AI 智能媒合」。按下後以前端模擬：依縣市過濾顯示下方結果卡片。
3. **結果卡片區** — Grid 顯示 3 張真實收容所靜態資料卡片：
   - 桃園市動物保護教育園區
   - 台北市動物之家
   - 台中市動物之家
   每卡片含名稱、地址、急缺物資 `Badge` 標籤群、底部「生成物資寄送打包單」按鈕。
4. **Modal 打包明細** — 使用 shadcn `Dialog`，標題「物資捐贈打包明細單」。內容含收件資訊（自動帶入該收容所名稱/地址/急缺物資）與寄件人欄位（姓名、電話、地址、備註，皆為留白 input）。底部「列印此明細單」按鈕觸發 `window.print()`，並加上 print CSS 讓只列印 Modal 內容。
5. **Footer** — 深色背景、文字置中：「本開源公益系統之雲端與營運費用，由 程永和 (Yung-Ho Cheng) 全額發起與贊助。© 2026 All rights reserved.」

## 技術細節

- 框架：既有 TanStack Start，僅修改 `src/routes/index.tsx` 並新增 `src/components/shelter/*` 區塊元件。
- UI：使用既有 shadcn `Button`、`Textarea`、`Select`、`Card`、`Badge`、`Dialog`、`Input`、`Label`。
- 資料：3 筆真實收容所資料作為靜態 Mock Data 寫死於前端常數（確保系統穩定展示，後續可擴充 API）。
- 縣市清單：台灣 22 個直轄市/縣市常數。
- SEO：在 `index.tsx` 的 `head()` 設定中文 title/description/og 標籤。
- 列印：`@media print` 隱藏非 Modal 元素，僅輸出打包明細。
- 不需後端、不啟用 Lovable Cloud。

## 檔案異動

- 修改：`src/routes/index.tsx`、`src/styles.css`、`src/routes/__root.tsx`（字體 `<link>` 與 meta）。
- 新增：`src/components/shelter/Hero.tsx`、`MatchForm.tsx`、`ShelterCard.tsx`、`PackingDialog.tsx`、`Footer.tsx`、`data.ts`、`src/assets/hero-illustration.jpg`。
