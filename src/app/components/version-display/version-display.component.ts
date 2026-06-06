import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { VersionService } from '../../services/version.service';

@Component({
  selector: 'VersionDisplayComponent',
  standalone: true,
  imports: [],
  template: `<div class="text-xs text-gray-500 dark:text-gray-400">Dashboard v{{ version() }}</div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [],
})
export class VersionDisplayComponent {
  private versionService = inject(VersionService);
  version = this.versionService.getVersion();
}
