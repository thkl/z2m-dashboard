import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'ButtonComponent',
  imports: [TranslatePipe],
  templateUrl: './button.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './button.scss',
})
export class ButtonComponent {
  title = input.required<string>();
  disabled = input<boolean>(false);
}
