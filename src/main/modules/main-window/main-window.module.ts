import { BrowserWindow, app } from 'electron';

import { ElectronModule } from '@doubleshot/nest-electron';
import { Module } from '@nestjs/common';
import { join } from 'node:path';
import { MainWindowService } from './main-window.service';

@Module({
  imports: [
    ElectronModule.registerAsync({
      useFactory: async () => {
        const isDev = !app.isPackaged;
        const preloadPath = isDev
      ? join(app.getAppPath(), '../preload/index.js')
      : join(app.getAppPath(), 'dist/preload/index.js')
        const win = new BrowserWindow({
          width: 1280,
          height: 720,
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            preload: preloadPath,
          },
        });

        win.on('closed', () => {
          win.destroy();
        });

        const URL = isDev
          ? `${process.env.DS_RENDERER_URL}#/`
          : `file://${join(app.getAppPath(), 'dist/render/index.html')}#/`;

        win.loadURL(URL);

        return { win };
      },
    }),
  ],
  providers: [MainWindowService],
  exports: [MainWindowService],
})
export class MainWindowModule {} 