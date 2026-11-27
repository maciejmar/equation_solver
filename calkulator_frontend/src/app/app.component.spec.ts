import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';
import { AdMob } from '@capacitor-community/admob';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let platformSpy: jasmine.Spy;
  let adMobInitializeSpy: jasmine.Spy;
  let adMobBannerSpy: jasmine.Spy;

  beforeEach(async () => {
    platformSpy = spyOn(Capacitor, 'getPlatform').and.returnValue('web');
    adMobInitializeSpy = spyOn(AdMob, 'initialize').and.returnValue(Promise.resolve());
    adMobBannerSpy = spyOn(AdMob, 'showBanner').and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('blocks the app and starts an immediate update when Play reports a newer version', async () => {
    platformSpy.and.returnValue('android');
    spyOn(AppUpdate, 'getAppUpdateInfo').and.returnValue(Promise.resolve({
      updateAvailability: AppUpdateAvailability.UPDATE_AVAILABLE,
      immediateUpdateAllowed: true,
      availableVersionName: '1.0.26',
      availableVersionCode: '26'
    } as any));
    const immediateUpdateSpy = spyOn(AppUpdate, 'performImmediateUpdate')
      .and.returnValue(Promise.resolve({ code: 0 } as any));

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.mandatory-update')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Update required');
    expect(immediateUpdateSpy).toHaveBeenCalled();
    expect(adMobInitializeSpy).not.toHaveBeenCalled();
    expect(adMobBannerSpy).not.toHaveBeenCalled();
  });
});
