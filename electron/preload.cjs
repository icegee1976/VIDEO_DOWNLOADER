const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lumagrab", {
  getDefaultSaveDir: () => ipcRenderer.invoke("app:get-default-save-dir"),
  pickSaveDir: () => ipcRenderer.invoke("dialog:pick-save-dir"),
  getVideoInfo: (url) => ipcRenderer.invoke("video:get-info", url),
  startDownload: (payload) => ipcRenderer.invoke("download:start", payload),
  resumeDownload: (payload) => ipcRenderer.invoke("download:resume", payload),
  pauseDownload: () => ipcRenderer.invoke("download:pause"),
  cancelDownload: () => ipcRenderer.invoke("download:cancel"),
  listHistory: () => ipcRenderer.invoke("history:list"),
  clearHistory: () => ipcRenderer.invoke("history:clear"),
  openPath: (targetPath) => ipcRenderer.invoke("shell:open-path", targetPath),
  onProgress: (callback) => ipcRenderer.on("download:progress", (_event, payload) => callback(payload)),
  onStatus: (callback) => ipcRenderer.on("download:status", (_event, payload) => callback(payload)),
  onLog: (callback) => ipcRenderer.on("download:log", (_event, payload) => callback(payload))
});
