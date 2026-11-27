import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppUpdateAvailability } from '@capawesome/capacitor-app-update';
import { AppUpdateService } from './app-update.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let appUpdateService: jasmine.SpyObj<AppUpdateService>;

  beforeEach(async () => {
    appUpdateService = jasmine.createSpyObj<AppUpdateService>(
      'AppUpdateService',
      ['isAndroid', 'getAppUpdateInfo', 'performImmediateUpdate', 'openAppStore']
    );
    appUpdateService.isAndroid.and.returnValue(false);
    appUpdateService.getAppUpdateInfo.and.returnValue(Promise.resolve({
      updateAvailability: AppUpdateAvailability.UPDATE_NOT_AVAILABLE
    } as any));
    appUpdateService.performImmediateUpdate.and.returnValue(Promise.resolve({ code: 0 } as any));
    appUpdateService.openAppStore.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [CommonModule, RouterTestingModule],
      declarations: [AppComponent],
      providers: [{ provide: AppUpdateService, useValue: appUpdateService }]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('blocks the app and starts an immediate update when Play reports a newer version', async () => {
    appUpdateService.isAndroid.and.returnValue(true);
    appUpdateService.getAppUpdateInfo.and.returnValue(Promise.resolve({
      updateAvailability: AppUpdateAvailability.UPDATE_AVAILABLE,
      immediateUpdateAllowed: true,
      availableVersionName: '1.0.26',
      availableVersionCode: '26'
    } as any));

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.mandatory-update')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Update required');
    expect(appUpdateService.performImmediateUpdate).toHaveBeenCalled();
  });

  it('keeps the app usable when Play reports no newer version', async () => {
    appUpdateService.isAndroid.and.returnValue(true);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.mandatory-update')).toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });

  it('keeps the app blocked and opens Play when an immediate update is unavailable', async () => {
    appUpdateService.isAndroid.and.returnValue(true);
    appUpdateService.getAppUpdateInfo.and.returnValue(Promise.resolve({
      updateAvailability: AppUpdateAvailability.UPDATE_AVAILABLE,
      immediateUpdateAllowed: false,
      availableVersionName: '1.0.26',
      availableVersionCode: '26'
    } as any));

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const updateButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(updateButton).not.toBeNull();
    updateButton.click();
    await fixture.whenStable();

    expect(appUpdateService.openAppStore).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.mandatory-update')).not.toBeNull();
  });
});
