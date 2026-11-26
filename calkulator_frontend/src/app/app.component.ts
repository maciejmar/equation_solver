// app.component.ts
import { Component, OnInit } from '@angular/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions } from '@capacitor-community/admob';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`, // or your app's template
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor() { }

  async ngOnInit() {
    await this.initializeAdMob();
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
