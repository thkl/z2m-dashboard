import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation, withRouterConfig } from '@angular/router';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { LoggerModule } from 'ngx-logger';
import { NgxLoggerLevel } from 'ngx-logger';
import { isDevMode } from '@angular/core';

import { routes } from './app.routes';
import { MultiTranslateHttpLoader } from './services/multi-translate-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes,withHashLocation()),
    provideHttpClient(),
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new MultiTranslateHttpLoader(http),
        deps: [HttpClient]
      }
    }),
    importProvidersFrom(LoggerModule.forRoot({
      level: isDevMode() ? NgxLoggerLevel.DEBUG : NgxLoggerLevel.ERROR,
    })),
  ]
};
