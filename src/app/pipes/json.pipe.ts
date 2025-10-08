import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'json',
  standalone: true,
  pure: false
})

export class JSONStringifyPipe implements PipeTransform {
  transform(data: any,replacer:any,space:number): string {
    return JSON.stringify(data,replacer,space);
  }
}
