const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ciacApi', {
  registerAttendance: (payload) => ipcRenderer.invoke('attendance:register', payload),
  getLatestRecords: (campus) => ipcRenderer.invoke('attendance:list-today', campus),
  getProfileByRun: (runValue) => ipcRenderer.invoke('attendance:profile-by-run', runValue),
  exportTodayExcel: (campus) => ipcRenderer.invoke('attendance:export-today', campus),
  parseScannedInput: (rawInput) => ipcRenderer.invoke('scanner:parse', rawInput)
});
