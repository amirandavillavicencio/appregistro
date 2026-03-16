const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ciacApi', {
  registerAttendance: (payload) => ipcRenderer.invoke('attendance:register', payload),
  getLatestRecords: (campus) => ipcRenderer.invoke('attendance:list-today', campus),
  closeOpenRecord: (payload) => ipcRenderer.invoke('attendance:close-open-record', payload),
  getProfileByRun: (runValue) => ipcRenderer.invoke('attendance:profile-by-run', runValue),
  exportHistoricExcel: () => ipcRenderer.invoke('attendance:export-historic'),
  registerTutorAttendance: (payload) => ipcRenderer.invoke('tutor-attendance:register', payload),
  getLatestTutorRecords: (campus) => ipcRenderer.invoke('tutor-attendance:list-today', campus),
  closeOpenTutorRecord: (payload) => ipcRenderer.invoke('tutor-attendance:close-open-record', payload),
  getTutorProfileByRun: (runValue) => ipcRenderer.invoke('tutor-attendance:profile-by-run', runValue),
  exportTutorHistoricExcel: () => ipcRenderer.invoke('tutor-attendance:export-historic'),
  parseScannedInput: (rawInput) => ipcRenderer.invoke('scanner:parse', rawInput),
  openReportWindow: () => ipcRenderer.invoke('report:open-window'),
  getReportSummary: () => ipcRenderer.invoke('report:get-summary')
});
