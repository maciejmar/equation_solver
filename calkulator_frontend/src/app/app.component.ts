// app.component.ts
import { Component, OnInit } from '@angular/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions } from '@capacitor-community/admob';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';
import { Capacitor } from '@capacitor/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  template: `
    <ng-container *ngIf="updateCheckComplete && !updateRequired; else updateGate">
      <router-outlet></router-outlet>
    </ng-container>
    <ng-template #updateGate>
      <main class="mandatory-update" role="alert">
        <h1>{{ updateRequired ? 'Update required' : 'Checking for updates…' }}</h1>
        <p *ngIf="updateRequired">Install the latest version to continue using System of Equations.</p>
        <p *ngIf="updateRequired && availableVersionName">Available version: {{ availableVersionName }}</p>
        <button
          *ngIf="updateRequired"
          type="button"
          [disabled]="updateInProgress"
          (click)="updateNow()"
        >
          {{ updateInProgress ? 'Starting update…' : 'Update now' }}
        </button>
      </main>
    </ng-template>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  updateCheckComplete = false;
  updateRequired = false;
  updateInProgress = false;
  availableVersionName: string | null = null;

  constructor() { }

  async ngOnInit(): Promise<void> {
    await this.checkForRequiredUpdate();
    if (!this.updateRequired) {
      await this.initializeAdMob();
    }
  }

  private async checkForRequiredUpdate(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      this.updateCheckComplete = true;
      return;
    }

    try {
      const info = await AppUpdate.getAppUpdateInfo();
      const updateAvailable = info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE;
      const updateInProgress = info.updateAvailability === AppUpdateAvailability.UPDATE_IN_PROGRESS;

      if (!updateAvailable && !updateInProgress) {
        this.updateCheckComplete = true;
        return;
      }

      this.updateRequired = true;
      this.availableVersionName = info.availableVersionName || info.availableVersionCode || null;
      this.updateCheckComplete = true;

      if (updateInProgress || info.immediateUpdateAllowed) {
        await this.runImmediateUpdate();
      }
    } catch (error) {
      // Play Store may be unavailable (for example, offline or sideloaded); do not lock out users.
      console.warn('Unable to check for a Play update:', error);
      this.updateCheckComplete = true;
    }
  }

  private async runImmediateUpdate(): Promise<void> {
    if (this.updateInProgress) return;

    this.updateInProgress = true;
    try {
      await AppUpdate.performImmediateUpdate();
    } catch (error) {
      // Keep the app gate active so the user can retry or open Google Play.
      console.warn('Immediate app update did not complete:', error);
    } finally {
      this.updateInProgress = false;
    }
  }

  async updateNow(): Promise<void> {
    if (!this.updateRequired || this.updateInProgress) return;

    this.updateInProgress = true;
    try {
      const info = await AppUpdate.getAppUpdateInfo();
      const updateAvailable = info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE;
      const updateInProgress = info.updateAvailability === AppUpdateAvailability.UPDATE_IN_PROGRESS;

      if (!updateAvailable && !updateInProgress) {
        this.updateRequired = false;
        this.availableVersionName = null;
        await this.initializeAdMob();
        return;
      }

      if (updateInProgress || info.immediateUpdateAllowed) {
        await AppUpdate.performImmediateUpdate();
      } else {
        await AppUpdate.openAppStore();
      }
    } catch (error) {
      console.warn('Unable to start the required update:', error);
    } finally {
      this.updateInProgress = false;
    }
  }

  async initializeAdMob(): Promise<void> {
    try {
      // Initialize AdMob first
      await AdMob.initialize({ initializeForTesting: environment.adMobUseTestAds });
      console.log('AdMob initialized!');
      // Now show the banner ad
      await this.showBannerAd();
    } catch (error) {
      console.error('Error initializing AdMob:', error);
    }
  }

  async showBannerAd(): Promise<void> {
    const options: BannerAdOptions = {
      adId: environment.adMobBannerAdUnitId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: environment.adMobUseTestAds,
    };

    try {
      await AdMob.showBanner(options);
      console.log("Banner ad displayed!");
    } catch (error) {
      console.error("Error showing banner ad:", error);
    }
  }
}
