import { Injectable } from '@angular/core';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  getAppUpdateInfo() {
    return AppUpdate.getAppUpdateInfo();
  }

  performImmediateUpdate() {
    return AppUpdate.performImmediateUpdate();
  }

  openAppStore() {
    return AppUpdate.openAppStore();
  }
}
