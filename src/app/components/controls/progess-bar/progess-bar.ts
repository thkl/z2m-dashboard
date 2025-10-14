import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'ProgessBar',
  imports: [],
  templateUrl: './progess-bar.html',
  styleUrl: './progess-bar.scss'
})
export class ProgessBar {
    max = input<number>(100);
    value = input<number>(0);
    percentInput = input<number>(0, { alias: 'percent' });

    // Computed signal that either uses the direct percent input or calculates from max/value
    percent = computed(() => {
      const directPercent = this.percentInput();
      if (directPercent > 0) {
        return directPercent;
      }
      const maxVal = this.max();
      const val = this.value();
      return maxVal > 0 ? (val / maxVal) * 100 : 0;
    });
}
