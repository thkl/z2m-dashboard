import { Group } from '@/app/models/group';
import { Component, input } from '@angular/core';

@Component({
  selector: 'GroupImage',
  imports: [],
  templateUrl: './groupimage.html',
  styleUrl: './groupimage.scss',
})
export class GroupImage {
    group = input<Group>()
}
