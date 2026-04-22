import { contextBridge } from 'electron';

import { electronAPI } from './preload/electronApi';

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
