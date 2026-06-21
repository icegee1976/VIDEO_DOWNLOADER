# LumaGrab

LumaGrab 是一個以 `Electron + Vite + yt-dlp + ffmpeg` 打造的桌面影片下載器，支援多平台影片下載、格式切換、批次佇列、播放清單模式、本機歷史紀錄、品質選擇與可續傳的暫停流程。

## 先講最重要的

一般使用者不需要安裝 Node.js。

`Node.js` 只是在「開發這個軟體」或「製作安裝包」時才需要。真正交給一般使用者的，應該是一個已經打包好的 Windows `.exe` 安裝程式。

也就是說：

- 你這邊要準備一次開發/打包環境
- 最終使用者只要雙擊安裝包即可

## 一鍵安裝即用要怎麼做

要做到「小白使用者一鍵安裝即用」，安裝包裡需要直接內建：

- `yt-dlp.exe`
- `ffmpeg.exe`
- `ffprobe.exe`

本專案現在已經支援這種模式：

1. 把上面三個檔案放進 [bin/README.txt](D:/@_CDXPRJCT/VIDEO_DOWNLOADER/bin/README.txt) 同層的 `bin/` 資料夾
2. 執行 `npm install`
3. 執行 `npm run dist`
4. 把 `release/` 產生的 `.exe` 安裝包交給最終使用者

這樣最終使用者通常不需要再自行安裝：

- Node.js
- yt-dlp
- ffmpeg

## 一般使用者如何安裝

如果你已經做好安裝包，對一般使用者來說流程會是：

1. 下載 `LumaGrab` 的 `.exe`
2. 雙擊安裝
3. 安裝完成後直接開啟
4. 貼上影片網址開始下載

這就是你要的「一鍵安裝即用」。

## 目前你現在卡住的是什麼

你剛剛看到我提到 `Node.js`，那是因為我現在在幫你「製作軟體」這一側工作。

如果你的目標是：
- 自己在這台電腦上繼續開發
- 自己產生安裝包

那你這台電腦需要先安裝：
- Node.js

但如果你的目標是：
- 把成品提供給別人安裝使用

那別人的電腦不需要安裝 Node.js，只要安裝你做好的 `.exe` 即可。

## 功能

- 貼上單一影片連結後分析資訊並下載
- 支援 YouTube、Facebook、Instagram、Bilibili 等 yt-dlp 可處理的平台
- 可選擇輸出 `mp4`、`mkv`、`mp3`、`wav`
- 影片可選 `Best`、`1080p`、`720p`、`480p`
- 音訊可選 `320`、`192`、`128 kbps`
- 支援進階 yt-dlp 選項：metadata、字幕下載/內嵌、字幕語言、瀏覽器 cookies 與分段下載數
- 支援批次下載：每行一個網址，依序處理
- 支援播放清單模式：交由 yt-dlp 下載整份播放清單
- 支援暫停與繼續：暫停時保留中間檔，之後可續傳
- 自動保存下載歷史，紀錄成功、失敗、暫停與取消狀態
- 完成或失敗時會送出桌面通知
- 可輸出 Windows `.exe` 安裝包，並已加入 app icon

## 開發者如何產生安裝包

### 需要先安裝

- [Node.js](https://nodejs.org/)

### 需要準備

把以下三個執行檔放進 `bin/`：

- `yt-dlp.exe`
- `ffmpeg.exe`
- `ffprobe.exe`

### 打包指令

```bash
npm install
npm run dist
```

輸出檔案會在 `release/` 目錄。

## 實作說明

- `electron/main.js`: Electron 主程序，優先使用安裝包內建的 `yt-dlp.exe` / `ffmpeg.exe`
- `electron/preload.js`: 提供前端安全 IPC API
- `src/main.js`: 介面、模式切換、品質控制、進階下載選項、批次佇列與暫停/繼續流程
- `src/style.css`: 品牌化 UI 與響應式版型
- `assets/icon.ico`: Windows 安裝包與應用程式 icon
- `public/assets/logo.svg`: 前端 UI logo
- `bin/README.txt`: 內建下載工具的放置說明
- `package.json`: 開發、打包腳本與 `electron-builder` 設定

## 注意事項

- 不同網站可下載的實際格式仍受來源平台與 `yt-dlp` / `ffmpeg` 能力影響
- 批次下載目前採序列式執行，避免多程序同時寫入造成衝突
- `暫停 / 繼續` 目前是基於保留中間檔續傳，實際效果仍取決於來源站點與 yt-dlp 行為
- Browser cookies 需要本機有對應瀏覽器設定檔；如果瀏覽器鎖住資料庫，請先關閉瀏覽器後再試
