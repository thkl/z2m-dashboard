import { Component, computed, effect, inject, input, model, output } from '@angular/core';
import { BridgeEventStore } from '../../datastore/logging.store';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'LogView',
  imports: [DatePipe,TranslateModule],
  templateUrl: './logview.html',
  styleUrl: './logview.scss'
})
export class LogView {
  protected readonly eventStore = inject(BridgeEventStore);
  logViewOpen = model<boolean>(false);
  toggleLogView = output();

  protected readonly reversedEntries = computed(() => {
    return [...this.eventStore.entities()].reverse();
  });

  toggleView() {
    this.toggleLogView.emit()
  }

  clearLog() {
    this.eventStore.clear();
  }
}
