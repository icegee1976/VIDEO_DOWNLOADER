import { Notification, app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

let mainWindow;
let activeDownload = null;
let currentSaveDir = "";

function getAssetPath(fileName) {
  return isDev ? path.join(app.getAppPath(), "assets", fileName) : path.join(process.resourcesPath, "assets", fileName);
}

function getBundledBinaryPath(fileName) {
  return isDev ? path.join(app.getAppPath(), "bin", fileName) : path.join(process.resourcesPath, "bin", fileName);
}

function resolveBinary(fileName, fallbackCommand) {
  const bundledPath = getBundledBinaryPath(fileName);
  return fs.existsSync(bundledPath) ? bundledPath : fallbackCommand;
}

function getFfmpegEnv() {
  const ffmpegBundled = getBundledBinaryPath("ffmpeg.exe");
  const ffprobeBundled = getBundledBinaryPath("ffprobe.exe");
  const nextEnv = { ...process.env };
  if (fs.existsSync(ffmpegBundled)) {
    nextEnv.FFMPEG_LOCATION = ffmpegBundled;
  }
  if (fs.existsSync(ffprobeBundled)) {
    nextEnv.FFPROBE_LOCATION = ffprobeBundled;
  }
  const bundledDir = path.dirname(ffmpegBundled);
  if (fs.existsSync(bundledDir)) {
    nextEnv.PATH = `${bundledDir}${path.delimiter}${process.env.PATH || ""}`;
  }
  return nextEnv;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1460,
    height: 980,
    minWidth: 1180,
    minHeight: 780,
    backgroundColor: "#f5ede2",
    autoHideMenuBar: true,
    title: "LumaGrab",
    icon: getAssetPath("icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://127.0.0.1:5173");
    return;
  }

  mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
}

function sendToRenderer(channel, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  mainWindow.webContents.send(channel, payload);
}

function notifyDesktop(title, body) {
  if (!Notification.isSupported()) {
    return;
  }
  new Notification({ title, body, icon: getAssetPath("icon.png") }).show();
}

function getHistoryPath() {
  return path.join(app.getPath("userData"), "download-history.json");
}

function readHistory() {
  const filePath = getHistoryPath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeHistory(history) {
  fs.mkdirSync(path.dirname(getHistoryPath()), { recursive: true });
  fs.writeFileSync(getHistoryPath(), JSON.stringify(history, null, 2), "utf-8");
}

function getHistoryEntry(historyId) {
  return readHistory().find((item) => item.id === historyId) || null;
}

function upsertHistoryEntry(entry) {
  const history = readHistory();
  const index = history.findIndex((item) => item.id === entry.id);
  if (index >= 0) {
    history[index] = { ...history[index], ...entry };
  } else {
    history.unshift(entry);
  }
  writeHistory(history.slice(0, 120));
}

function videoFormatSelector(container, quality) {
  switch (quality) {
    case "1080":
      return `${container}[height<=?1080]+ba/${container}[height<=?1080]/b[height<=?1080]`;
    case "720":
      return `${container}[height<=?720]+ba/${container}[height<=?720]/b[height<=?720]`;
    case "480":
      return `${container}[height<=?480]+ba/${container}[height<=?480]/b[height<=?480]`;
    default:
      return `${container}+ba/b`;
  }
}

function audioQualityValue(quality) {
  switch (quality) {
    case "320":
      return "0";
    case "192":
      return "5";
    case "128":
      return "7";
    default:
      return "5";
  }
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === "" || value === "NA" || value === "Unknown") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "未知";
  }
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let nextValue = value;
  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024;
    unitIndex += 1;
  }
  return `${nextValue.toFixed(nextValue >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatSpeed(value) {
  return value ? `${formatBytes(value)}/s` : "未知速度";
}

function formatEta(value) {
  if (!Number.isFinite(value) || value < 0) {
    return "未知";
  }
  const totalSeconds = Math.round(value);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function clampConcurrentFragments(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.min(16, Math.max(1, parsed));
}

function sanitizeSubtitleLanguages(value) {
  return String(value || "")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter((item) => /^[a-z0-9._*-]+$/i.test(item))
    .slice(0, 12)
    .join(",");
}

function appendAdvancedDownloadArgs(args, options) {
  const {
    cookieBrowser,
    concurrentFragments,
    downloadSubtitles,
    embedMetadata,
    embedSubtitles,
    format,
    subtitleLanguages
  } = options;
  const fragmentCount = clampConcurrentFragments(concurrentFragments);
  const cookieMap = {
    chrome: "chrome",
    edge: "edge",
    firefox: "firefox"
  };

  if (fragmentCount > 1) {
    args.push("--concurrent-fragments", String(fragmentCount));
  }

  if (cookieMap[cookieBrowser]) {
    args.push("--cookies-from-browser", cookieMap[cookieBrowser]);
  }

  if (embedMetadata !== false) {
    args.push("--embed-metadata");
  }

  if (downloadSubtitles) {
    const languages = sanitizeSubtitleLanguages(subtitleLanguages) || "zh-Hant,zh-TW,en";
    args.push("--sub-langs", `${languages},-live_chat`);
    args.push("--write-subs", "--write-auto-subs", "--sub-format", "srt/best", "--convert-subs", "srt");
    if (embedSubtitles && (format === "mp4" || format === "mkv")) {
      args.push("--embed-subs", "--compat-options", "no-keep-subs");
    }
  }

  return args;
}

function buildDownloadArgs(payload) {
  const { url, format, outputDir, allowPlaylist, quality } = payload;
  const baseArgs = [
    "--newline",
    "--continue",
    "--progress",
    "--progress-template",
    "download:%(progress.status)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s",
    "--progress-delta",
    ".75",
    "--no-mtime",
    "-o",
    path.join(outputDir, "%(title)s.%(ext)s")
  ];

  if (!allowPlaylist) {
    baseArgs.push("--no-playlist");
  }

  appendAdvancedDownloadArgs(baseArgs, payload);

  switch (format) {
    case "mp4":
      return [...baseArgs, "-f", videoFormatSelector("bv*", quality), "--merge-output-format", "mp4", url];
    case "mkv":
      return [...baseArgs, "-f", videoFormatSelector("bv*", quality), "--merge-output-format", "mkv", url];
    case "mp3":
      return [...baseArgs, "-x", "--audio-format", "mp3", "--audio-quality", audioQualityValue(quality), url];
    case "wav":
      return [...baseArgs, "-x", "--audio-format", "wav", "--audio-quality", audioQualityValue(quality), url];
    default:
      return [...baseArgs, url];
  }
}

function cleanLine(line) {
  return line.replace(/\u001b\[[0-9;]*m/g, "").replace(/^\[download\]\s*/i, "").trim();
}

function parseProgressLine(line) {
  const cleaned = cleanLine(line);
  const templateMatch = cleaned.match(/^download:([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)$/);
  if (templateMatch) {
    const status = templateMatch[1].trim();
    const downloaded = parseOptionalNumber(templateMatch[2].trim());
    const total = parseOptionalNumber(templateMatch[3].trim()) || parseOptionalNumber(templateMatch[4].trim());
    const speed = parseOptionalNumber(templateMatch[5].trim());
    const eta = parseOptionalNumber(templateMatch[6].trim());
    const percentNumber = downloaded !== null && total ? Math.min(100, Math.max(0, (downloaded / total) * 100)) : null;

    if (status === "finished") {
      return {
        percent: "100%",
        speed: "處理中",
        eta: "0:00",
        status,
        downloadedBytes: downloaded,
        totalBytes: total
      };
    }

    return {
      percent: percentNumber === null ? "--" : `${percentNumber.toFixed(percentNumber >= 10 ? 1 : 2)}%`,
      speed: formatSpeed(speed),
      eta: formatEta(eta),
      status,
      downloadedBytes: downloaded,
      totalBytes: total
    };
  }

  const genericMatch = cleaned.match(/^(\d+(?:\.\d+)?)%.*?at\s+(.+?)\s+ETA\s+(.+)$/i);
  if (genericMatch) {
    return {
      percent: `${genericMatch[1]}%`,
      speed: genericMatch[2].trim(),
      eta: genericMatch[3].trim()
    };
  }

  return null;
}

async function ensureOutputDirectory() {
  if (currentSaveDir && fs.existsSync(currentSaveDir)) {
    return currentSaveDir;
  }
  const defaultDir = path.join(app.getPath("downloads"), "LumaGrab");
  fs.mkdirSync(defaultDir, { recursive: true });
  currentSaveDir = defaultDir;
  return defaultDir;
}

function createHistoryEntry(payload, outputDir) {
  const existing = payload.historyId ? getHistoryEntry(payload.historyId) : null;
  return {
    id: payload.historyId || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: payload.title || payload.url,
    url: payload.url,
    format: payload.format,
    quality: payload.quality,
    outputDir,
    playlistMode: Boolean(payload.allowPlaylist),
    embedMetadata: payload.embedMetadata !== false,
    downloadSubtitles: Boolean(payload.downloadSubtitles),
    embedSubtitles: Boolean(payload.embedSubtitles),
    subtitleLanguages: sanitizeSubtitleLanguages(payload.subtitleLanguages),
    cookieBrowser: payload.cookieBrowser || "none",
    concurrentFragments: clampConcurrentFragments(payload.concurrentFragments),
    platform: payload.platform || "未知平台",
    status: "running",
    startedAt: existing?.startedAt || new Date().toISOString(),
    completedAt: null,
    resumedAt: payload.historyId ? new Date().toISOString() : existing?.resumedAt || null,
    error: ""
  };
}

function startDownloadTask(payload) {
  return new Promise(async (resolve) => {
    if (activeDownload) {
      resolve({ ok: false, error: "目前已有下載工作進行中。" });
      return;
    }

    const ytDlpCommand = resolveBinary("yt-dlp.exe", "yt-dlp");
    const outputDir = payload.outputDir || (await ensureOutputDirectory());
    const historyEntry = createHistoryEntry(payload, outputDir);
    const args = buildDownloadArgs({ ...payload, outputDir });
    const env = getFfmpegEnv();
    upsertHistoryEntry(historyEntry);

    const child = spawn(ytDlpCommand, args, { windowsHide: true, env });
    activeDownload = {
      child,
      historyId: historyEntry.id,
      payload: { ...payload, outputDir, historyId: historyEntry.id },
      pauseRequested: false,
      cancelRequested: false
    };

    let resolved = false;
    let stderr = "";

    sendToRenderer("download:status", {
      state: "running",
      message: "下載已開始，正在呼叫下載引擎..."
    });

    function handleChunk(chunk, shouldCollectStderr = false) {
      const text = chunk.toString();
      if (shouldCollectStderr) {
        stderr += text;
      }
      const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
      for (const line of lines) {
        const progress = parseProgressLine(line);
        if (progress) {
          sendToRenderer("download:progress", progress);
        }
      }
    }

    child.stdout.on("data", (chunk) => {
      handleChunk(chunk, false);
    });

    child.stderr.on("data", (chunk) => {
      handleChunk(chunk, true);
    });

    child.on("error", (error) => {
      activeDownload = null;
      const errorMessage = `無法啟動下載引擎：${error.message}`;
      upsertHistoryEntry({ id: historyEntry.id, status: "error", completedAt: new Date().toISOString(), error: errorMessage });
      notifyDesktop("LumaGrab 下載失敗", payload.title || payload.url);
      if (!resolved) {
        resolved = true;
        resolve({ ok: false, error: errorMessage });
      }
    });

    child.on("close", (code) => {
      const runtime = activeDownload;
      activeDownload = null;

      if (runtime?.pauseRequested) {
        upsertHistoryEntry({ id: historyEntry.id, status: "paused", completedAt: null, error: "已暫停，可稍後繼續" });
        sendToRenderer("download:status", { state: "paused", message: "下載已暫停，保留續傳進度。" });
        if (!resolved) {
          resolved = true;
          resolve({ ok: false, paused: true, historyId: historyEntry.id, payload: runtime.payload });
        }
        return;
      }

      if (runtime?.cancelRequested) {
        upsertHistoryEntry({ id: historyEntry.id, status: "canceled", completedAt: new Date().toISOString(), error: "使用者取消" });
        if (!resolved) {
          resolved = true;
          resolve({ ok: false, canceled: true, error: "下載已取消。" });
        }
        return;
      }

      if (code === 0) {
        upsertHistoryEntry({ id: historyEntry.id, status: "finished", completedAt: new Date().toISOString(), error: "" });
        sendToRenderer("download:status", { state: "finished", message: "下載完成，檔案已輸出到指定資料夾。" });
        notifyDesktop("LumaGrab 下載完成", payload.title || payload.url);
        if (!resolved) {
          resolved = true;
          resolve({ ok: true, outputDir, historyId: historyEntry.id });
        }
        return;
      }

      const errorMessage = stderr.trim() || "下載過程中發生未知錯誤，請確認內建 yt-dlp / ffmpeg 是否已打包。";
      upsertHistoryEntry({ id: historyEntry.id, status: "error", completedAt: new Date().toISOString(), error: errorMessage });
      sendToRenderer("download:status", { state: "error", message: errorMessage });
      notifyDesktop("LumaGrab 下載失敗", payload.title || payload.url);
      if (!resolved) {
        resolved = true;
        resolve({ ok: false, error: errorMessage });
      }
    });
  });
}

ipcMain.handle("app:get-default-save-dir", async () => ensureOutputDirectory());
ipcMain.handle("dialog:pick-save-dir", async () => {
  const defaultPath = await ensureOutputDirectory();
  const result = await dialog.showOpenDialog(mainWindow, { defaultPath, properties: ["openDirectory", "createDirectory"] });
  if (result.canceled || !result.filePaths[0]) {
    return { canceled: true, path: currentSaveDir || defaultPath };
  }
  currentSaveDir = result.filePaths[0];
  return { canceled: false, path: currentSaveDir };
});
ipcMain.handle("history:list", async () => readHistory());
ipcMain.handle("history:clear", async () => {
  writeHistory([]);
  return { ok: true };
});

ipcMain.handle("video:get-info", async (_event, url) => {
  return new Promise((resolve) => {
    const ytDlpCommand = resolveBinary("yt-dlp.exe", "yt-dlp");
    const probe = spawn(ytDlpCommand, ["--dump-single-json", "--no-playlist", url], { windowsHide: true, env: getFfmpegEnv() });
    let stdout = "";
    let stderr = "";
    probe.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    probe.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    probe.on("error", (error) => {
      resolve({ ok: false, error: `無法啟動下載引擎：${error.message}` });
    });
    probe.on("close", () => {
      if (!stdout.trim()) {
        resolve({ ok: false, error: stderr.trim() || "讀取影片資訊失敗，請確認內建 yt-dlp 是否已打包。" });
        return;
      }
      try {
        const data = JSON.parse(stdout);
        resolve({
          ok: true,
          data: {
            title: data.title,
            uploader: data.uploader,
            duration: data.duration,
            thumbnail: data.thumbnail,
            platform: data.extractor_key || data.extractor,
            webpageUrl: data.webpage_url
          }
        });
      } catch (error) {
        resolve({ ok: false, error: `解析影片資訊失敗：${error.message}` });
      }
    });
  });
});

ipcMain.handle("download:start", async (_event, payload) => startDownloadTask(payload));
ipcMain.handle("download:resume", async (_event, payload) => startDownloadTask(payload));
ipcMain.handle("download:pause", async () => {
  if (!activeDownload) {
    return { ok: false, error: "目前沒有正在進行的下載工作。" };
  }
  activeDownload.pauseRequested = true;
  activeDownload.child.kill();
  return { ok: true };
});
ipcMain.handle("download:cancel", async () => {
  if (!activeDownload) {
    return { ok: false, error: "目前沒有正在進行的下載工作。" };
  }
  activeDownload.cancelRequested = true;
  activeDownload.child.kill();
  sendToRenderer("download:status", { state: "idle", message: "下載已取消。" });
  return { ok: true };
});
ipcMain.handle("shell:open-path", async (_event, targetPath) => shell.openPath(targetPath));

app.whenReady().then(async () => {
  await ensureOutputDirectory();
  writeHistory(readHistory());
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

