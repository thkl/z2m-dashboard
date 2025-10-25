import { TranslateService } from '@ngx-translate/core';

export function timeAgo(date: string | Date, translate?: TranslateService): string {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) {
    const key = seconds === 1 ? 'TIME.seconds_ago_one' : 'TIME.seconds_ago';
    return translate ? translate.instant(key, { count: seconds }) : `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const key = minutes === 1 ? 'TIME.minutes_ago_one' : 'TIME.minutes_ago';
    return translate ? translate.instant(key, { count: minutes }) : `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const key = hours === 1 ? 'TIME.hours_ago_one' : 'TIME.hours_ago';
    return translate ? translate.instant(key, { count: hours }) : `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    const key = days === 1 ? 'TIME.days_ago_one' : 'TIME.days_ago';
    return translate ? translate.instant(key, { count: days }) : `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    const key = months === 1 ? 'TIME.months_ago_one' : 'TIME.months_ago';
    return translate ? translate.instant(key, { count: months }) : `${months} month${months !== 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(months / 12);
  const key = years === 1 ? 'TIME.years_ago_one' : 'TIME.years_ago';
  return translate ? translate.instant(key, { count: years }) : `${years} year${years !== 1 ? 's' : ''} ago`;
}