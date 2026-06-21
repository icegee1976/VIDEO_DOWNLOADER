import "./style.css";

function renderFatalError(error) {
  const root = document.querySelector("#app") || document.body;
  root.innerHTML = `
    <section style="padding:32px;max-width:760px;margin:40px auto;border-radius:24px;background:rgba(255,248,239,.92);border:1px solid rgba(23,17,15,.12);box-shadow:0 20px 60px rgba(67,37,17,.12);font-family:'Segoe UI','Microsoft JhengHei UI',sans-serif;color:#17110f;">
      <p style="margin:0 0 8px;text-transform:uppercase;letter-spacing:.18em;font-size:.74rem;color:#b6411b;">LumaGrab Error</p>
      <h1 style="margin:0 0 14px;font-size:2rem;line-height:1.15;">介面載入失敗</h1>
      <p style="margin:0 0 16px;line-height:1.8;color:#67594f;">應用程式啟動時發生錯誤，請把下方訊息提供給開發者。</p>
      <pre style="margin:0;padding:18px;border-radius:18px;background:#18100d;color:#ffe7cb;white-space:pre-wrap;word-break:break-word;line-height:1.6;">${String(error?.stack || error?.message || error)}</pre>
    </section>
  `;
}

function initApp() {
  const app = document.querySelector("#app");
  if (!app) {
    throw new Error("找不到 #app 掛載節點。");
  }

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar card-strip">
        <div class="brand-row">
          <div class="logo-mark" aria-hidden="true">
            <img src="./assets/logo.svg" alt="" />
          </div>
          <div>
            <div class="brand-meta"><p class="eyebrow">LumaGrab</p><span class="version-pill">v0.1</span></div>
            <h1>一鍵收下影片與音訊。</h1>
            <p class="brand-copy">支援單筆、批次與播放清單下載，格式、品質、進度與歷史都集中管理。</p>
          </div>
        </div>
      </header>

      <main class="workspace">
        <nav class="tabbar card-strip">
          <button class="tab-chip active" data-tab="downloader">下載器</button>
          <button class="tab-chip" data-tab="history">下載歷史</button>
        </nav>

        <section class="tab-panel active" data-panel="downloader">
          <section class="card-panel downloader-panel">
            <div class="panel-head">
              <div>
                <p class="eyebrow">Downloader</p>
                <h2>下載工作台</h2>
              </div>
              <div class="head-actions">
                <span class="status-pill" id="status-pill">待命中</span>
                <button class="ghost-button" id="open-folder">開啟資料夾</button>
              </div>
            </div>

            <div class="mode-switch compact-row">
              <button class="mode-chip active" data-mode="single">單筆下載</button>
              <button class="mode-chip" data-mode="batch">批次下載</button>
              <button class="mode-chip" data-mode="playlist">播放清單模式</button>
            </div>

            <div class="form-grid">
              <div class="form-column">
                <label class="field-label" id="source-label" for="video-url">下載來源</label>
                <div class="url-row">
                  <input id="video-url" type="url" placeholder="https://www.youtube.com/watch?v=..." autocomplete="off" />
                  <button id="analyze-button">分析連結</button>
                </div>

                <label class="field-label" for="batch-urls">批次網址清單</label>
                <textarea id="batch-urls" rows="5" placeholder="每行一個網址，例如：&#10;https://www.youtube.com/watch?v=aaa&#10;https://www.instagram.com/reel/bbb"></textarea>

                <div class="folder-row card-lite">
                  <div>
                    <span class="meta-label">儲存位置</span>
                    <strong id="save-dir">載入中...</strong>
                  </div>
                  <button class="ghost-button" id="pick-folder">更換位置</button>
                </div>
              </div>

              <div class="form-column settings-column">
                <div class="media-preview card-lite">
                  <div class="cover-wrap">
                    <img id="thumbnail" alt="影片縮圖預覽" hidden />
                    <div class="cover-fallback" id="cover-fallback">等待讀取影片資訊</div>
                  </div>
                  <div class="media-copy">
                    <h3 id="video-title">尚未載入影片</h3>
                    <p id="video-meta">單筆模式可分析影片資訊；批次與播放清單模式會依序處理來源。</p>
                  </div>
                </div>

                <div class="settings-grid">
                  <div>
                    <label class="field-label">輸出格式</label>
                    <div class="format-picker compact-row">
                      <button class="format-chip active" data-format="mp4">MP4</button>
                      <button class="format-chip" data-format="mkv">MKV</button>
                      <button class="format-chip" data-format="mp3">MP3</button>
                      <button class="format-chip" data-format="wav">WAV</button>
                    </div>
                  </div>

                  <div>
                    <label class="field-label" id="quality-label" for="quality-select">畫質</label>
                    <select id="quality-select"></select>
                  </div>
                </div>

                <div class="advanced-card card-lite">
                  <div class="advanced-grid">
                    <label class="inline-toggle">
                      <input id="embed-metadata" type="checkbox" checked />
                      <span>寫入 metadata</span>
                    </label>
                    <label class="inline-toggle">
                      <input id="download-subtitles" type="checkbox" />
                      <span>下載字幕</span>
                    </label>
                    <label class="inline-toggle">
                      <input id="embed-subtitles" type="checkbox" checked />
                      <span>內嵌字幕</span>
                    </label>
                  </div>

                  <div class="advanced-grid inputs-grid">
                    <div>
                      <label class="field-label" for="subtitle-languages">字幕語言</label>
                      <input id="subtitle-languages" type="text" value="zh-Hant,zh-TW,en" spellcheck="false" />
                    </div>
                    <div>
                      <label class="field-label" for="cookie-browser">Cookie 來源</label>
                      <select id="cookie-browser">
                        <option value="none">無</option>
                        <option value="chrome">Chrome</option>
                        <option value="edge">Edge</option>
                        <option value="firefox">Firefox</option>
                      </select>
                    </div>
                    <div>
                      <label class="field-label" for="concurrent-fragments">分段數</label>
                      <input id="concurrent-fragments" type="number" min="1" max="16" value="4" />
                    </div>
                  </div>
                </div>

                <div class="queue-summary card-lite" id="queue-summary">目前模式：單筆下載</div>

                <div class="progress-card card-lite">
                  <div class="progress-headline">
                    <strong id="progress-text">尚未開始下載</strong>
                    <span id="progress-meta">等待任務</span>
                  </div>
                  <pre class="mini-log" id="mini-log">LumaGrab 已就緒。</pre>
                </div>

                <div class="action-row compact-row">
                  <button id="download-button" class="primary-button">開始下載</button>
                  <button id="pause-button" class="ghost-button">暫停</button>
                  <button id="resume-button" class="ghost-button">繼續</button>
                  <button id="cancel-button" class="ghost-button">取消下載</button>
                </div>
              </div>
            </div>
          </section>
        </section>

        <section class="tab-panel" data-panel="history">
          <section class="card-panel history-panel">
            <div class="panel-head">
              <div>
                <p class="eyebrow">History</p>
                <h2>下載歷史</h2>
              </div>
              <button class="ghost-button" id="clear-history">清空歷史</button>
            </div>
            <div class="history-list" id="history-list"></div>
          </section>
        </section>
      </main>
    </div>
  `;

  const VIDEO_QUALITIES = [
    { value: "best", label: "Best available" },
    { value: "1080", label: "1080p" },
    { value: "720", label: "720p" },
    { value: "480", label: "480p" }
  ];
  const AUDIO_QUALITIES = [
    { value: "320", label: "320 kbps" },
    { value: "192", label: "192 kbps" },
    { value: "128", label: "128 kbps" }
  ];

  const state = {
    activeTab: "downloader",
    mode: "single",
    selectedFormat: "mp4",
    outputDir: "",
    videoInfo: null,
    downloading: false,
    paused: false,
    batchCancelled: false,
    history: [],
    quality: "best",
    embedMetadata: true,
    downloadSubtitles: false,
    embedSubtitles: true,
    subtitleLanguages: "zh-Hant,zh-TW,en",
    cookieBrowser: "none",
    concurrentFragments: 4,
    pausedPayload: null,
    queueUrls: [],
    queueIndex: 0,
    logLines: ["LumaGrab 已就緒。"]
  };

  const saveDirEl = document.querySelector("#save-dir");
  const openFolderButton = document.querySelector("#open-folder");
  const pickFolderButton = document.querySelector("#pick-folder");
  const urlInput = document.querySelector("#video-url");
  const batchInput = document.querySelector("#batch-urls");
  const sourceLabelEl = document.querySelector("#source-label");
  const analyzeButton = document.querySelector("#analyze-button");
  const titleEl = document.querySelector("#video-title");
  const metaEl = document.querySelector("#video-meta");
  const thumbnailEl = document.querySelector("#thumbnail");
  const coverFallbackEl = document.querySelector("#cover-fallback");
  const statusPillEl = document.querySelector("#status-pill");
  const progressTextEl = document.querySelector("#progress-text");
  const progressMetaEl = document.querySelector("#progress-meta");
  const miniLogEl = document.querySelector("#mini-log");
  const downloadButton = document.querySelector("#download-button");
  const pauseButton = document.querySelector("#pause-button");
  const resumeButton = document.querySelector("#resume-button");
  const cancelButton = document.querySelector("#cancel-button");
  const queueSummaryEl = document.querySelector("#queue-summary");
  const historyListEl = document.querySelector("#history-list");
  const clearHistoryButton = document.querySelector("#clear-history");
  const qualitySelect = document.querySelector("#quality-select");
  const qualityLabel = document.querySelector("#quality-label");
  const embedMetadataInput = document.querySelector("#embed-metadata");
  const downloadSubtitlesInput = document.querySelector("#download-subtitles");
  const embedSubtitlesInput = document.querySelector("#embed-subtitles");
  const subtitleLanguagesInput = document.querySelector("#subtitle-languages");
  const cookieBrowserSelect = document.querySelector("#cookie-browser");
  const concurrentFragmentsInput = document.querySelector("#concurrent-fragments");
  const tabChips = [...document.querySelectorAll(".tab-chip")];
  const tabPanels = [...document.querySelectorAll(".tab-panel")];
  const modeChips = [...document.querySelectorAll(".mode-chip")];
  const formatChips = [...document.querySelectorAll(".format-chip")];
  const advancedControls = [
    embedMetadataInput,
    downloadSubtitlesInput,
    embedSubtitlesInput,
    subtitleLanguagesInput,
    cookieBrowserSelect,
    concurrentFragmentsInput
  ];

  function extractPercent(line) {
    const match = String(line).match(/(\d+(?:\.\d+)?)%/);
    return match ? `${match[1]}%` : null;
  }

  function pushMiniLog(line) {
    if (!line) {
      return;
    }

    state.logLines.push(line);
    const percent = extractPercent(line);
    if (percent) {
      const modeText = state.queueUrls.length > 1 ? `第 ${state.queueIndex + 1} / ${state.queueUrls.length} 筆下載中` : "下載中";
      const currentMeta = progressMetaEl.textContent === "等待任務" ? "正在接收下載進度" : progressMetaEl.textContent;
      setProgressSummary(modeText, currentMeta, percent);
    }

    state.logLines = state.logLines.slice(-120);
    miniLogEl.textContent = state.logLines.join("\n");
    miniLogEl.scrollTop = miniLogEl.scrollHeight;
  }

  function clearMiniLog() {
    state.logLines = ["LumaGrab 已就緒。"];
    miniLogEl.textContent = state.logLines.join("\n");
  }

  function setActiveTab(tab) {
    state.activeTab = tab;
    tabChips.forEach((chip) => chip.classList.toggle("active", chip.dataset.tab === tab));
    tabPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDuration(seconds) {
    if (!seconds || Number.isNaN(Number(seconds))) {
      return "長度未提供";
    }
    const total = Number(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = Math.floor(total % 60);
    return [h, m, s].filter((value, index) => value > 0 || index > 0).map((value) => String(value).padStart(2, "0")).join(":");
  }

  function formatTimestamp(isoString) {
    if (!isoString) {
      return "尚未完成";
    }
    return new Date(isoString).toLocaleString("zh-TW", { hour12: false });
  }

  function setStatus(text, tone = "idle") {
    statusPillEl.textContent = text;
    statusPillEl.dataset.tone = tone;
  }

  function activeQualityOptions() {
    return state.selectedFormat === "mp3" || state.selectedFormat === "wav" ? AUDIO_QUALITIES : VIDEO_QUALITIES;
  }

  function syncQualityOptions() {
    const options = activeQualityOptions();
    if (!options.some((option) => option.value === state.quality)) {
      state.quality = options[0].value;
    }
    qualityLabel.textContent = state.selectedFormat === "mp3" || state.selectedFormat === "wav" ? "音質" : "畫質";
    qualitySelect.innerHTML = options.map((option) => `<option value="${option.value}">${option.label}</option>`).join("");
    qualitySelect.value = state.quality;
  }

  function clampConcurrentFragments(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return 1;
    }
    return Math.min(16, Math.max(1, parsed));
  }

  function isAudioFormat() {
    return state.selectedFormat === "mp3" || state.selectedFormat === "wav";
  }

  function syncAdvancedOptions() {
    embedMetadataInput.checked = state.embedMetadata;
    downloadSubtitlesInput.checked = state.downloadSubtitles;
    embedSubtitlesInput.checked = state.embedSubtitles;
    subtitleLanguagesInput.value = state.subtitleLanguages;
    cookieBrowserSelect.value = state.cookieBrowser;
    concurrentFragmentsInput.value = state.concurrentFragments;

    advancedControls.forEach((control) => {
      control.disabled = state.downloading || state.paused;
    });
    subtitleLanguagesInput.disabled = state.downloading || state.paused || !state.downloadSubtitles;
    embedSubtitlesInput.disabled = state.downloading || state.paused || !state.downloadSubtitles || isAudioFormat();
  }

  function isPlaylistMode() {
    return state.mode === "playlist";
  }

  function syncFormatSelection() {
    formatChips.forEach((chip) => chip.classList.toggle("active", chip.dataset.format === state.selectedFormat));
    syncQualityOptions();
    syncModeSelection();
  }

  function getBatchUrls() {
    return batchInput.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }

  function syncModeSelection() {
    modeChips.forEach((chip) => chip.classList.toggle("active", chip.dataset.mode === state.mode));
    const isBatch = state.mode === "batch";
    const isPlaylist = state.mode === "playlist";
    batchInput.disabled = !isBatch || state.downloading;
    urlInput.disabled = isBatch || state.downloading;
    analyzeButton.disabled = isBatch || isPlaylist || state.downloading;
    pickFolderButton.disabled = state.downloading;
    pauseButton.disabled = !state.downloading || state.paused;
    resumeButton.disabled = !state.paused;
    cancelButton.disabled = !state.downloading && !state.paused;
    downloadButton.disabled = state.downloading || state.paused;
    sourceLabelEl.textContent = isPlaylist ? "播放清單連結" : "下載來源";
    syncAdvancedOptions();

    const qualityText = activeQualityOptions().find((item) => item.value === state.quality)?.label || state.quality;
    if (state.paused) {
      queueSummaryEl.textContent = `已暫停於第 ${state.queueIndex + 1} / ${state.queueUrls.length || 1} 筆 ｜ ${qualityText}`;
      return;
    }
    if (isBatch) {
      queueSummaryEl.textContent = `目前模式：批次下載，共 ${getBatchUrls().length} 筆待處理 ｜ ${qualityText}`;
    } else if (isPlaylist) {
      queueSummaryEl.textContent = `目前模式：播放清單模式 ｜ ${qualityText}`;
    } else {
      queueSummaryEl.textContent = `目前模式：單筆下載 ｜ ${qualityText}`;
    }
  }

  function setProgressSummary(text, meta, percent = null) {
    progressTextEl.textContent = percent === null ? text : `${percent} ｜ ${text}`;
    progressMetaEl.textContent = meta;
  }

  function resetProgress() {
    setProgressSummary("尚未開始下載", "等待任務", "0%");
    clearMiniLog();
  }

  function renderVideoInfo(info) {
    state.videoInfo = info;
    titleEl.textContent = info.title || "未命名影片";
    metaEl.textContent = `${info.platform || "未知平台"} ｜ ${info.uploader || "未知作者"} ｜ ${formatDuration(info.duration)}`;
    if (info.thumbnail) {
      thumbnailEl.src = info.thumbnail;
      thumbnailEl.hidden = false;
      coverFallbackEl.hidden = true;
      return;
    }
    thumbnailEl.hidden = true;
    coverFallbackEl.hidden = false;
    coverFallbackEl.textContent = "此來源未提供縮圖";
  }

  function resetPreview(text = "等待讀取影片資訊") {
    titleEl.textContent = "尚未載入影片";
    metaEl.textContent = state.mode === "single"
      ? "貼上連結後按「分析連結」，這裡會顯示平台、頻道與長度。"
      : "此模式會依序處理來源並顯示即時文字進度。";
    thumbnailEl.hidden = true;
    thumbnailEl.removeAttribute("src");
    coverFallbackEl.hidden = false;
    coverFallbackEl.textContent = text;
  }

  async function loadDefaultSaveDir() {
    state.outputDir = await window.lumagrab.getDefaultSaveDir();
    saveDirEl.textContent = state.outputDir;
  }

  async function loadHistory() {
    state.history = await window.lumagrab.listHistory();
    renderHistory();
  }

  function renderHistory() {
    if (!state.history.length) {
      historyListEl.innerHTML = '<div class="history-empty">還沒有下載紀錄，開始第一筆任務吧。</div>';
      return;
    }
    historyListEl.innerHTML = state.history.map((item) => `
      <article class="history-item" data-status="${item.status}">
        <div class="history-top">
          <strong>${escapeHtml(item.title || item.url)}</strong>
          <span class="history-status">${item.status}</span>
        </div>
        <p>${escapeHtml(item.url)}</p>
        <div class="history-meta">
          <span>${(item.format || "-").toUpperCase()}</span>
          <span>${escapeHtml(item.quality || "-")}</span>
          <span>${escapeHtml(item.platform || "未知平台")}</span>
          <span>${item.playlistMode ? "播放清單" : "一般"}</span>
          <span>${item.downloadSubtitles ? "字幕" : "無字幕"}</span>
          <span>${item.cookieBrowser && item.cookieBrowser !== "none" ? escapeHtml(item.cookieBrowser) : "無 cookies"}</span>
          <span>x${escapeHtml(item.concurrentFragments || 1)}</span>
          <span>${formatTimestamp(item.completedAt || item.startedAt)}</span>
        </div>
      </article>
    `).join("");
  }

  async function handleAnalyze() {
    const url = urlInput.value.trim();
    if (!url) {
      setStatus("請先貼上連結", "warn");
      return;
    }
    setStatus("分析中", "busy");
    setProgressSummary("正在分析連結", url, "--");
    const result = await window.lumagrab.getVideoInfo(url);
    if (!result.ok) {
      setStatus("分析失敗", "error");
      pushMiniLog(result.error);
      return;
    }
    renderVideoInfo({ ...result.data, sourceUrl: url });
    setStatus("可下載", "ready");
    pushMiniLog(`已讀取影片資訊：${result.data.title}`);
  }

  function getActiveUrls() {
    if (state.mode === "batch") {
      return getBatchUrls();
    }
    const singleUrl = urlInput.value.trim();
    return singleUrl ? [singleUrl] : [];
  }

  function makePayload(url) {
    return {
      url,
      format: state.selectedFormat,
      quality: state.quality,
      outputDir: state.outputDir,
      allowPlaylist: isPlaylistMode(),
      embedMetadata: state.embedMetadata,
      downloadSubtitles: state.downloadSubtitles,
      embedSubtitles: state.downloadSubtitles && !isAudioFormat() && state.embedSubtitles,
      subtitleLanguages: state.subtitleLanguages,
      cookieBrowser: state.cookieBrowser,
      concurrentFragments: state.concurrentFragments,
      title: state.mode === "single" && state.videoInfo?.sourceUrl === url ? state.videoInfo.title : url,
      platform: state.mode === "single" && state.videoInfo?.sourceUrl === url ? state.videoInfo.platform : (isPlaylistMode() ? "播放清單工作" : "批次工作")
    };
  }

  async function runDownloadJob(url, index, total, resumePayload = null) {
    setProgressSummary(total > 1 ? `第 ${index + 1} / ${total} 筆準備下載` : "正在準備下載", url, "0%");
    pushMiniLog(`開始處理：${url}`);
    const payload = resumePayload || makePayload(url);
    const runner = resumePayload ? window.lumagrab.resumeDownload : window.lumagrab.startDownload;
    const result = await runner(payload);
    await loadHistory();
    if (result.ok) {
      setProgressSummary(total > 1 ? `第 ${index + 1} / ${total} 筆完成` : "下載完成", url, "100%");
      pushMiniLog(`完成：${url}`);
      state.pausedPayload = null;
      return { ok: true };
    }
    if (result.paused) {
      pushMiniLog(`已暫停：${url}`);
      state.pausedPayload = result.payload;
      return { ok: false, paused: true };
    }
    if (result.canceled) {
      pushMiniLog(`已取消：${url}`);
      state.pausedPayload = null;
      return { ok: false, canceled: true };
    }
    pushMiniLog(`失敗：${result.error}`);
    state.pausedPayload = null;
    return { ok: false, error: result.error };
  }

  async function processQueue(startIndex = 0, resumePayload = null) {
    let successCount = startIndex;
    state.downloading = true;
    state.paused = false;
    state.batchCancelled = false;
    setStatus("下載中", "busy");
    syncModeSelection();

    for (let index = startIndex; index < state.queueUrls.length; index += 1) {
      if (state.batchCancelled) {
        break;
      }
      state.queueIndex = index;
      queueSummaryEl.textContent = `處理進度：${index + 1} / ${state.queueUrls.length}`;
      const result = await runDownloadJob(state.queueUrls[index], index, state.queueUrls.length, resumePayload && index === startIndex ? resumePayload : null);
      resumePayload = null;
      if (result.ok) {
        successCount += 1;
        continue;
      }
      if (result.paused) {
        state.downloading = false;
        state.paused = true;
        setStatus("已暫停", "warn");
        syncModeSelection();
        return;
      }
      if (result.canceled) {
        state.downloading = false;
        state.paused = false;
        setStatus("已取消", "warn");
        syncModeSelection();
        return;
      }
    }

    state.downloading = false;
    state.paused = false;
    syncModeSelection();
    queueSummaryEl.textContent = `本次完成 ${successCount} / ${state.queueUrls.length} 筆`;
    setStatus(successCount === state.queueUrls.length ? "下載完成" : "部分完成", successCount === state.queueUrls.length ? "ready" : "warn");
  }

  async function handleStartDownload() {
    const urls = getActiveUrls();
    if (!urls.length) {
      setStatus("請先輸入網址", "warn");
      return;
    }
    state.queueUrls = urls;
    state.queueIndex = 0;
    resetProgress();
    pushMiniLog(`開始任務，共 ${urls.length} 筆。`);
    await processQueue(0, null);
  }

  async function handlePauseDownload() {
    await window.lumagrab.pauseDownload();
  }

  async function handleResumeDownload() {
    if (!state.pausedPayload) {
      return;
    }
    pushMiniLog("繼續下載中...");
    await processQueue(state.queueIndex, state.pausedPayload);
  }

  async function handleCancelDownload() {
    state.batchCancelled = true;
    if (state.downloading) {
      await window.lumagrab.cancelDownload();
    }
    state.paused = false;
    state.pausedPayload = null;
    state.downloading = false;
    setStatus("已取消", "warn");
    syncModeSelection();
    pushMiniLog("目前下載工作已取消。");
  }

  tabChips.forEach((chip) => chip.addEventListener("click", () => setActiveTab(chip.dataset.tab)));
  modeChips.forEach((chip) => chip.addEventListener("click", () => {
    if (state.downloading || state.paused) {
      return;
    }
    state.mode = chip.dataset.mode;
    resetPreview(state.mode === "batch" ? "批次模式會依序下載每一列網址。" : state.mode === "playlist" ? "播放清單模式會下載整份播放清單。" : "等待讀取影片資訊");
    syncModeSelection();
  }));
  formatChips.forEach((chip) => chip.addEventListener("click", () => {
    state.selectedFormat = chip.dataset.format;
    state.quality = state.selectedFormat === "mp3" || state.selectedFormat === "wav" ? "320" : "best";
    syncFormatSelection();
  }));
  qualitySelect.addEventListener("change", () => {
    state.quality = qualitySelect.value;
    syncModeSelection();
  });
  embedMetadataInput.addEventListener("change", () => {
    state.embedMetadata = embedMetadataInput.checked;
    syncAdvancedOptions();
  });
  downloadSubtitlesInput.addEventListener("change", () => {
    state.downloadSubtitles = downloadSubtitlesInput.checked;
    syncAdvancedOptions();
  });
  embedSubtitlesInput.addEventListener("change", () => {
    state.embedSubtitles = embedSubtitlesInput.checked;
    syncAdvancedOptions();
  });
  subtitleLanguagesInput.addEventListener("input", () => {
    state.subtitleLanguages = subtitleLanguagesInput.value;
  });
  cookieBrowserSelect.addEventListener("change", () => {
    state.cookieBrowser = cookieBrowserSelect.value;
  });
  concurrentFragmentsInput.addEventListener("input", () => {
    state.concurrentFragments = clampConcurrentFragments(concurrentFragmentsInput.value);
    concurrentFragmentsInput.value = state.concurrentFragments;
  });
  batchInput.addEventListener("input", syncModeSelection);
  analyzeButton.addEventListener("click", handleAnalyze);
  downloadButton.addEventListener("click", handleStartDownload);
  pauseButton.addEventListener("click", handlePauseDownload);
  resumeButton.addEventListener("click", handleResumeDownload);
  cancelButton.addEventListener("click", handleCancelDownload);
  pickFolderButton.addEventListener("click", async () => {
    const result = await window.lumagrab.pickSaveDir();
    state.outputDir = result.path;
    saveDirEl.textContent = state.outputDir;
  });
  openFolderButton.addEventListener("click", async () => {
    if (state.outputDir) {
      await window.lumagrab.openPath(state.outputDir);
    }
  });
  clearHistoryButton.addEventListener("click", async () => {
    await window.lumagrab.clearHistory();
    await loadHistory();
  });

  window.lumagrab.onProgress((payload) => {
    const header = state.queueUrls.length > 1
      ? `第 ${state.queueIndex + 1} / ${state.queueUrls.length} 筆下載中`
      : "下載中";
    setProgressSummary(header, `速度 ${payload.speed} ｜ ETA ${payload.eta}`, payload.percent);
    pushMiniLog(`${payload.percent} ｜ ${payload.speed} ｜ ETA ${payload.eta}`);
  });

  window.lumagrab.onStatus((payload) => {
    if (payload.state === "running") {
      setStatus("下載中", "busy");
    }
    if (payload.state === "finished") {
      setProgressSummary("下載完成", "工作已完成", "100%");
      pushMiniLog("下載完成。");
    }
    if (payload.state === "paused") {
      setStatus("已暫停", "warn");
      pushMiniLog("下載已暫停。");
    }
    if (payload.state === "error") {
      setStatus("下載失敗", "error");
      pushMiniLog(payload.message);
    }
    if (payload.state === "idle") {
      setStatus("已取消", "warn");
      pushMiniLog("下載已取消。");
    }
  });

  window.lumagrab.onLog((message) => {
    pushMiniLog(message);
  });

  syncQualityOptions();
  syncFormatSelection();
  syncModeSelection();
  resetProgress();
  setActiveTab("downloader");
  loadDefaultSaveDir();
  loadHistory();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => {
    try {
      initApp();
    } catch (error) {
      renderFatalError(error);
    }
  }, { once: true });
} else {
  try {
    initApp();
  } catch (error) {
    renderFatalError(error);
  }
}

window.addEventListener("error", (event) => {
  renderFatalError(event.error || event.message);
});





