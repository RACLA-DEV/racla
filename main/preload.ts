import { contextBridge, desktopCapturer, ipcRenderer, IpcRendererEvent } from 'electron'
import { removeListener } from 'process'

const handler = {
  send(channel: string, value?: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
  login: (credentials: { userNo: string; userToken: string }) => ipcRenderer.send('login', credentials),
  logout: () => ipcRenderer.send('logout'),
  getSetting: () => ipcRenderer.send('getSetting'),
  getSession: () => ipcRenderer.send('getSession'),
  putSongData: (songData: any) => ipcRenderer.send('putSongData', songData),
  getSongData: () => ipcRenderer.send('getSongData'),
  openBrowser: (url: string) => ipcRenderer.send('openBrowser', url),
  setAuthorization: (userData: { userNo: string; userToken: string }) => ipcRenderer.send('setAuthorization', userData),
  desktopCapturer: (options) => desktopCapturer.getSources(options),
  removeListener: (channel: string, callback: (...args: unknown[]) => void) => ipcRenderer.removeListener(channel, callback),
}

contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
