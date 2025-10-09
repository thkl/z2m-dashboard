

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'toHex',
    standalone: true,
    pure: false
})

export class HexPipe implements PipeTransform {
    transform(input: number, padding = 4): string {
        const padStr = "0".repeat(padding);
        return `0x${(padStr + input.toString(16)).slice(-1 * padding).toUpperCase()}`;
    }
}
