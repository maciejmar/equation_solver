// nav.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions } from '@capacitor-community/admob';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit, OnDestroy {

  async ngOnInit() {
    // Show the banner when this component initializes
    await this.showBannerAd();
  }

  async showBannerAd(): Promise<void> {
    const options: BannerAdOptions = {
      adId: 'ca-app-pub-3940256099942544/6300978111', // Test Banner Ad Unit ID
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true,
    };
    try {
      await AdMob.showBanner(options);
      console.log('Banner ad displayed!');
    } catch (error) {
      console.error('Error showing banner ad:', error);
    }
  }

  async ngOnDestroy() {
    // Optionally hide the banner when the component is destroyed
    await AdMob.hideBanner();
  }
}
