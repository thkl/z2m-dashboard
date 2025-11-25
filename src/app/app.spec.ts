import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { appConfig } from './app.config';
import { TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';

describe('App', () => {
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: appConfig.providers,
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.classList.remove('dark-theme');
  });

  describe('component creation', () => {
    it('should create the app', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      expect(app).toBeTruthy();
    });

    it('should inject required services', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      expect(app['bs']).toBeDefined();
      expect(app['ds']).toBeDefined();
      expect(app['as']).toBeDefined();
    });
  });

  describe('template rendering', () => {
    it('should render router-outlet', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('router-outlet')).toBeTruthy();
    });
  });

  describe('translation setup', () => {
    it('should set English as fallback language', () => {
      const setFallbackSpy = vi.spyOn(translateService, 'setFallbackLang');
      TestBed.createComponent(App);
      expect(setFallbackSpy).toHaveBeenCalledWith('en');
    });

    it('should use browser language if supported (English)', () => {
      vi.spyOn(translateService, 'getBrowserLang').mockReturnValue('en');
      const useSpy = vi.spyOn(translateService, 'use');
      TestBed.createComponent(App);
      expect(useSpy).toHaveBeenCalledWith('en');
    });

    it('should use browser language if supported (German)', () => {
      vi.spyOn(translateService, 'getBrowserLang').mockReturnValue('de');
      const useSpy = vi.spyOn(translateService, 'use');
      TestBed.createComponent(App);
      expect(useSpy).toHaveBeenCalledWith('de');
    });

    it('should default to English if browser language is unsupported', () => {
      vi.spyOn(translateService, 'getBrowserLang').mockReturnValue('fr');
      const useSpy = vi.spyOn(translateService, 'use');
      TestBed.createComponent(App);
      expect(useSpy).toHaveBeenCalledWith('en');
    });

    it('should handle null browser language gracefully', () => {
      vi.spyOn(translateService, 'getBrowserLang').mockReturnValue(null as any);
      const useSpy = vi.spyOn(translateService, 'use');
      TestBed.createComponent(App);
      expect(useSpy).toHaveBeenCalledWith('en');
    });
  });

  describe('dark mode initialization', () => {
    it('should apply dark mode when system prefers dark scheme', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
      } as MediaQueryList);
      const addClassSpy = vi.spyOn(document.body.classList, 'add');

      TestBed.createComponent(App);

      expect(addClassSpy).toHaveBeenCalledWith('dark-theme');
    });

    it('should not apply dark mode when system prefers light scheme', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: false,
      } as MediaQueryList);
      const addClassSpy = vi.spyOn(document.body.classList, 'add');

      TestBed.createComponent(App);

      expect(addClassSpy).not.toHaveBeenCalledWith('dark-theme');
    });
  });

  describe('enableDarkMode method', () => {
    it('should add dark-theme class to body', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      app.enableDarkMode();
      expect(document.body.classList.contains('dark-theme')).toBe(true);
    });

    it('should persist dark mode preference to localStorage', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      app.enableDarkMode();
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should be callable multiple times without side effects', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      app.enableDarkMode();
      app.enableDarkMode();
      expect(document.body.classList.contains('dark-theme')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });
  });
});
