import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionService } from '../../services/version.service';

@Component({
  selector: 'VersionDisplayComponent',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="text-xs text-gray-500 dark:text-gray-400">Dashboard v{{ version() }}</div>`,
  styles: [],
})
export class VersionDisplayComponent {
  private versionService = inject(VersionService);
  version = this.versionService.getVersion();
}
