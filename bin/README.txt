此資料夾給開發者放入 Windows 執行檔，之後打包成 `.exe` 安裝包時會自動帶進去。

請放入以下檔案：
- yt-dlp.exe
- ffmpeg.exe
- ffprobe.exe

放好之後：
1. 執行 `npm install`
2. 執行 `npm run dist`
3. 把 `release/` 內產生的安裝包交給最終使用者

最終使用者只需要安裝這個 `.exe`，不需要另外安裝 Node.js。
