import { Group } from '@/app/models/group';
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'GroupImage',
  imports: [],
  templateUrl: './groupimage.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './groupimage.scss',
})
export class GroupImage {
  group = input<Group>();
}
