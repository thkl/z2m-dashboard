import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { BridgeEventStore } from '../../datastore/logging.store';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OptionPanelComponent } from '../controls/optionpanel/optionpanel';
import { SelectOption } from '../../models/types';
import { BridgeService } from '../../services/bridge.service';

@Component({
  selector: 'LogView',
  imports: [DatePipe, TranslateModule, OptionPanelComponent],
  templateUrl: './logview.html',
  styleUrl: './logview.scss'
})
export class LogView {
  protected readonly eventStore = inject(BridgeEventStore);
  protected readonly bridgeService = inject(BridgeService);

  log_level = computed(() => {
    const bi = this.bridgeService.getBridgeInfo();
    if (bi() !== null) {
      return bi()!.log_level;
    };
    return "";
  })

  logViewOpen = model<boolean>(false);
  toggleLogView = output();

  logOptions = signal<SelectOption[]>([
    { label: "Info", isSelected: false },
    { label: "Debug", isSelected: false },
    { label: "Warning", isSelected: false },
    { label: "Error", isSelected: false }
  ])

  protected readonly reversedEntries = computed(() => {
    return [...this.eventStore.entities()].reverse();
  });

  toggleView() {
    this.toggleLogView.emit()
  }

  clearLog() {
    this.eventStore.clear();
  }



  logOptionChange(event: any) {
    console.log(event);
  }
}
