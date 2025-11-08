import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ButtonComponent',
  imports: [TranslateModule],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class ButtonComponent {
  title = input.required<string>();
  disabled = input<boolean>(false);
}
