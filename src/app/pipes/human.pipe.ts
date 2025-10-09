

import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
    name: 'human',
    standalone: true,
    pure: false
})

export class HumanReadablePipe implements PipeTransform {

    private readonly translate = inject(TranslateService);

      
    transform(value:any,replacer?:any,space?:number): string {

        switch (typeof value) {
        case "boolean":
            return value ? this.translate.instant("YES") : this.translate.instant('NO')
        case "undefined":
            return "N/A";
        case "object":
            return value === null ? '' : JSON.stringify(value,replacer??"", space??2);
        case "string":
            return value;
        default:
            return JSON.stringify(value,replacer??"", space??2);
    }
    }
}
