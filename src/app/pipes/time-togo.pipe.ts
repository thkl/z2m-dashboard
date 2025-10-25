import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'timeTogo',
  standalone: true,
  pure: false,
})
export class TimeToPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(date: string | Date | number): string {
    const now = new Date();
    const future = new Date(date);
    const seconds = Math.floor((future.getTime() - now.getTime()) / 1000);

    if (seconds < 60) {
      const key = seconds === 1 ? 'TIME.seconds_left_one' : 'TIME.seconds_left';
      return this.translate.instant(key, { count: seconds });
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      const key = minutes === 1 ? 'TIME.minutes_left_one' : 'TIME.minutes_left';
      return this.translate.instant(key, { count: minutes });
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      const key = hours === 1 ? 'TIME.hours_left_one' : 'TIME.hours_left';
      return this.translate.instant(key, { count: hours });
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
      const key = days === 1 ? 'TIME.days_left_one' : 'tTIMEme.days_left';
      return this.translate.instant(key, { count: days });
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      const key = months === 1 ? 'TIME.months_left_one' : 'TIME.months_left';
      return this.translate.instant(key, { count: months });
    }

    const years = Math.floor(months / 12);
    const key = years === 1 ? 'TIME.years_left_one' : 'TIME.years_left';
    return this.translate.instant(key, { count: years });
  }
}
