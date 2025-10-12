import { HttpClient } from '@angular/common/http';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

export class MultiTranslateHttpLoader implements TranslateLoader {
  constructor(
    private http: HttpClient,
    public resources: { prefix: string; suffix: string }[] = [
      { prefix: './assets/i18n/', suffix: '.json' },
      { prefix: './assets/i18n/zigbee/', suffix: '.json' }
    ]
  ) {}

  getTranslation(lang: string): Observable<any> {
    const requests = this.resources.map(resource =>
      this.http.get(`${resource.prefix}${lang}${resource.suffix}`)
    );

    return forkJoin(requests).pipe(
      map(responses => Object.assign({}, ...responses))
    );
  }
}